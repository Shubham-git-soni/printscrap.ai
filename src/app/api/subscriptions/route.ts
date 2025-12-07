import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    const pool = await connectDB();

    // Auto-update expired subscriptions
    await pool.request().query(`
      UPDATE Subscriptions
      SET status = 'expired'
      WHERE endDate < CAST(GETDATE() AS DATE)
        AND status IN ('active', 'trial')
    `);

    if (userId) {
      const result = await pool.request()
        .input('userId', sql.Int, parseInt(userId))
        .query(`
          SELECT
            s.id,
            s.userId,
            s.planId,
            s.startDate,
            s.endDate,
            s.status,
            s.autoRenew,
            p.name as planName,
            p.price as planPrice,
            u.companyName as userName
          FROM Subscriptions s
          LEFT JOIN Plans p ON s.planId = p.id
          LEFT JOIN Users u ON s.userId = u.id
          WHERE s.userId = @userId
          ORDER BY s.id DESC
        `);

      await pool.close();
      return NextResponse.json({ success: true, data: result.recordset[0] || null });
    } else {
      const result = await pool.request().query(`
        SELECT
          s.id,
          s.userId,
          s.planId,
          s.startDate,
          s.endDate,
          s.status,
          s.autoRenew,
          p.name as planName,
          p.price as planPrice,
          u.companyName as userName
        FROM Subscriptions s
        LEFT JOIN Plans p ON s.planId = p.id
        LEFT JOIN Users u ON s.userId = u.id
        ORDER BY s.id DESC
      `);

      await pool.close();
      return NextResponse.json({ success: true, data: result.recordset });
    }
  } catch (error: any) {
    console.error('❌ Subscriptions fetch error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, planId, startDate, endDate, status } = await request.json();
    const pool = await connectDB();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('planId', sql.Int, planId)
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .input('status', sql.NVarChar, status)
      .query(`
        INSERT INTO Subscriptions (userId, planId, startDate, endDate, status)
        OUTPUT INSERTED.*
        VALUES (@userId, @planId, @startDate, @endDate, @status)
      `);

    return NextResponse.json({ success: true, data: result.recordset[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, planId, startDate, endDate, status } = await request.json();
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('planId', sql.Int, planId)
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE Subscriptions
        SET planId = @planId, startDate = @startDate, endDate = @endDate, status = @status
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    return NextResponse.json({ success: true, data: result.recordset[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
