import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

// POST - Reject plan activation request
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { approvedBy, approvalNotes } = await request.json();
    const { id } = await params;
    const requestId = parseInt(id);

    if (!approvedBy) {
      return NextResponse.json(
        { success: false, message: 'approvedBy (admin userId) is required' },
        { status: 400 }
      );
    }

    const pool = await connectDB();

    // Check if request exists and is pending
    const requestResult = await pool.request()
      .input('requestId', sql.Int, requestId)
      .query(`
        SELECT * FROM PlanActivationRequests
        WHERE id = @requestId AND status = 'pending'
      `);

    if (requestResult.recordset.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Request not found or already processed' },
        { status: 404 }
      );
    }

    // Update request status to rejected
    await pool.request()
      .input('requestId', sql.Int, requestId)
      .input('approvedBy', sql.Int, approvedBy)
      .input('approvalNotes', sql.NVarChar, approvalNotes || 'Request rejected by admin')
      .input('approvedAt', sql.DateTime, new Date())
      .query(`
        UPDATE PlanActivationRequests
        SET status = 'rejected',
            approvedBy = @approvedBy,
            approvalNotes = @approvalNotes,
            approvedAt = @approvedAt
        WHERE id = @requestId
      `);

    return NextResponse.json({
      success: true,
      message: 'Plan activation request rejected'
    });
  } catch (error: any) {
    console.error('❌ Plan rejection error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
