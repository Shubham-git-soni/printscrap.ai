import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

// GET all plan activation requests
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status');

    const pool = await connectDB();

    let query = `
      SELECT
        par.id,
        par.userId,
        par.planId,
        par.status,
        par.requestMessage,
        par.requestedAt,
        par.approvedBy,
        par.approvalNotes,
        par.approvedAt,
        u.companyName as clientName,
        u.email as clientEmail,
        u.contactNumber as clientContact,
        p.name as planName,
        p.price as planPrice,
        p.billingCycle,
        admin.companyName as approvedByName
      FROM PlanActivationRequests par
      LEFT JOIN Users u ON par.userId = u.id
      LEFT JOIN Plans p ON par.planId = p.id
      LEFT JOIN Users admin ON par.approvedBy = admin.id
      WHERE 1=1
    `;

    const request_obj = pool.request();

    if (userId) {
      query += ' AND par.userId = @userId';
      request_obj.input('userId', sql.Int, parseInt(userId));
    }

    if (status) {
      query += ' AND par.status = @status';
      request_obj.input('status', sql.NVarChar, status);
    }

    query += ' ORDER BY par.requestedAt DESC';

    const result = await request_obj.query(query);
    await pool.close();

    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error: any) {
    console.error('❌ Plan requests fetch error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST - Create new plan activation request
export async function POST(request: Request) {
  try {
    const { userId, planId, requestMessage } = await request.json();

    if (!userId || !planId) {
      return NextResponse.json(
        { success: false, message: 'userId and planId are required' },
        { status: 400 }
      );
    }

    const pool = await connectDB();

    // Check if user already has a pending request for this plan
    const existingRequest = await pool.request()
      .input('userId', sql.Int, userId)
      .input('planId', sql.Int, planId)
      .query(`
        SELECT * FROM PlanActivationRequests
        WHERE userId = @userId AND planId = @planId AND status = 'pending'
      `);

    if (existingRequest.recordset.length > 0) {
      await pool.close();
      return NextResponse.json(
        { success: false, message: 'You already have a pending request for this plan' },
        { status: 400 }
      );
    }

    // Create new request
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('planId', sql.Int, planId)
      .input('requestMessage', sql.NVarChar, requestMessage || null)
      .query(`
        INSERT INTO PlanActivationRequests (userId, planId, requestMessage, status)
        OUTPUT INSERTED.*
        VALUES (@userId, @planId, @requestMessage, 'pending')
      `);

    await pool.close();

    return NextResponse.json(
      { success: true, data: result.recordset[0], message: 'Plan activation request submitted successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Plan request creation error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
