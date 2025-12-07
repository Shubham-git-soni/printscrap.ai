import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';
import { sendPlanActivationEmail } from '@/lib/email';

// POST - Approve plan activation request
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { approvedBy, approvalNotes, startDate: reqStartDate, endDate: reqEndDate } = await request.json();
    const { id } = await params;
    const requestId = parseInt(id);

    console.log('🔍 Approve Request - ID:', requestId, 'ApprovedBy:', approvedBy);

    if (!approvedBy) {
      return NextResponse.json(
        { success: false, message: 'approvedBy (admin userId) is required' },
        { status: 400 }
      );
    }

    const pool = await connectDB();

    // Debug: Check if request exists at all
    const debugResult = await pool.request()
      .input('requestId', sql.Int, requestId)
      .query(`SELECT id, status FROM PlanActivationRequests WHERE id = @requestId`);

    console.log('📊 Request exists?', debugResult.recordset.length > 0,
                'Status:', debugResult.recordset[0]?.status);

    // Get the request details
    const requestResult = await pool.request()
      .input('requestId', sql.Int, requestId)
      .query(`
        SELECT par.*, p.billingCycle
        FROM PlanActivationRequests par
        LEFT JOIN Plans p ON par.planId = p.id
        WHERE par.id = @requestId AND par.status = 'pending'
      `);

    console.log('📊 Pending request found?', requestResult.recordset.length > 0);

    if (requestResult.recordset.length === 0) {
      console.log('❌ Request not found or not pending');
      return NextResponse.json(
        { success: false, message: 'Request not found or already processed' },
        { status: 404 }
      );
    }

    const planRequest = requestResult.recordset[0];

    // Use provided dates or calculate based on billing cycle
    let startDate: Date;
    let endDate: Date;

    if (reqStartDate && reqEndDate) {
      // Use dates provided by admin
      startDate = new Date(reqStartDate);
      endDate = new Date(reqEndDate);
    } else {
      // Fallback: Calculate subscription dates based on billing cycle
      startDate = new Date();
      endDate = new Date();

      switch (planRequest.billingCycle) {
        case 'daily':
          endDate.setDate(endDate.getDate() + 1);
          break;
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        default:
          endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
      }
    }

    // Check if user already has an active subscription
    const activeSubResult = await pool.request()
      .input('userId', sql.Int, planRequest.userId)
      .query(`
        SELECT * FROM Subscriptions
        WHERE userId = @userId AND status = 'active' AND endDate > GETDATE()
      `);

    let subscriptionId;

    if (activeSubResult.recordset.length > 0) {
      // Update existing subscription
      const existingSub = activeSubResult.recordset[0];
      const updateResult = await pool.request()
        .input('subId', sql.Int, existingSub.id)
        .input('planId', sql.Int, planRequest.planId)
        .input('startDate', sql.DateTime, startDate)
        .input('endDate', sql.DateTime, endDate)
        .query(`
          UPDATE Subscriptions
          SET planId = @planId,
              startDate = @startDate,
              endDate = @endDate,
              status = 'active'
          OUTPUT INSERTED.id
          WHERE id = @subId
        `);
      subscriptionId = updateResult.recordset[0].id;
    } else {
      // Create new subscription
      const createResult = await pool.request()
        .input('userId', sql.Int, planRequest.userId)
        .input('planId', sql.Int, planRequest.planId)
        .input('startDate', sql.DateTime, startDate)
        .input('endDate', sql.DateTime, endDate)
        .query(`
          INSERT INTO Subscriptions (userId, planId, status, startDate, endDate, autoRenew)
          OUTPUT INSERTED.id
          VALUES (@userId, @planId, 'active', @startDate, @endDate, 0)
        `);
      subscriptionId = createResult.recordset[0].id;
    }

    // Update user's subscriptionId
    await pool.request()
      .input('userId', sql.Int, planRequest.userId)
      .input('subscriptionId', sql.Int, subscriptionId)
      .query(`
        UPDATE Users
        SET subscriptionId = @subscriptionId
        WHERE id = @userId
      `);

    // Update request status to approved
    await pool.request()
      .input('requestId', sql.Int, requestId)
      .input('approvedBy', sql.Int, approvedBy)
      .input('approvalNotes', sql.NVarChar, approvalNotes || null)
      .input('approvedAt', sql.DateTime, new Date())
      .query(`
        UPDATE PlanActivationRequests
        SET status = 'approved',
            approvedBy = @approvedBy,
            approvalNotes = @approvalNotes,
            approvedAt = @approvedAt
        WHERE id = @requestId
      `);

    // Get user and plan details for email
    const userResult = await pool.request()
      .input('userId', sql.Int, planRequest.userId)
      .query('SELECT email, companyName FROM Users WHERE id = @userId');

    const planResult = await pool.request()
      .input('planId', sql.Int, planRequest.planId)
      .query('SELECT name FROM Plans WHERE id = @planId');

    // Send activation email to client (async, don't wait)
    if (userResult.recordset.length > 0 && planResult.recordset.length > 0) {
      const user = userResult.recordset[0];
      const plan = planResult.recordset[0];

      sendPlanActivationEmail(
        user.email,
        user.companyName,
        plan.name,
        startDate.toISOString(),
        endDate.toISOString()
      ).catch(err => {
        console.error('❌ Failed to send activation email:', err);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Plan activated successfully',
      data: {
        subscriptionId,
        startDate,
        endDate
      }
    });
  } catch (error: any) {
    console.error('❌ Plan approval error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
