import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    const pool = await connectDB();
    const result = await pool.request()
      .input('userId', sql.Int, parseInt(userId))
      .query(`
        SELECT
          s.id,
          s.planId,
          s.startDate,
          s.endDate,
          s.status,
          p.name as planName,
          CASE
            WHEN s.endDate < GETDATE() THEN 'expired'
            WHEN s.status = 'active' THEN 'active'
            ELSE s.status
          END as currentStatus,
          DATEDIFF(day, GETDATE(), s.endDate) as daysRemaining
        FROM Subscriptions s
        LEFT JOIN Plans p ON s.planId = p.id
        WHERE s.userId = @userId
        ORDER BY s.id DESC
      `);



    if (result.recordset.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          hasSubscription: false,
          isActive: false,
          isExpired: true,
          daysRemaining: 0
        }
      });
    }

    const subscription = result.recordset[0];
    const isExpired = subscription.currentStatus === 'expired';
    const isActive = subscription.currentStatus === 'active' && !isExpired;

    return NextResponse.json({
      success: true,
      data: {
        hasSubscription: true,
        isActive,
        isExpired,
        daysRemaining: subscription.daysRemaining || 0,
        subscription
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
