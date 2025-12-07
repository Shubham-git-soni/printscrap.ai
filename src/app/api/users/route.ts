import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';

export async function GET() {
  try {
    const pool = await connectDB();

    // Auto-update expired subscriptions
    await pool.request().query(`
      UPDATE Subscriptions
      SET status = 'expired'
      WHERE endDate < CAST(GETDATE() AS DATE)
        AND status IN ('active', 'trial')
    `);

    const result = await pool.request().query(`
      SELECT
        u.id,
        u.email,
        u.role,
        u.companyName,
        u.contactNumber,
        u.address,
        u.isActive,
        u.isVerified,
        u.subscriptionId,
        u.createdAt,
        s.planId,
        s.startDate,
        s.endDate,
        s.status as subscriptionStatus,
        p.name as planName,
        p.price as planPrice
      FROM Users u
      LEFT JOIN Subscriptions s ON u.subscriptionId = s.id
      LEFT JOIN Plans p ON s.planId = p.id
      ORDER BY u.createdAt DESC
    `);

    await pool.close();
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error: any) {
    console.error('❌ Users fetch error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, companyName, email, contactNumber, address, isActive, isVerified } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const pool = await connectDB();

    // Fetch current user for merging
    const currentUser = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Users WHERE id = @id');

    if (currentUser.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const user = currentUser.recordset[0];

    // Merge updates with existing data
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('companyName', sql.NVarChar, companyName ?? user.companyName)
      .input('email', sql.NVarChar, email ?? user.email)
      .input('contactNumber', sql.NVarChar, (contactNumber ?? user.contactNumber) || null)
      .input('address', sql.NVarChar, (address ?? user.address) || null)
      .input('isActive', sql.Bit, isActive ?? user.isActive)
      .input('isVerified', sql.Bit, isVerified ?? user.isVerified)
      .query(`
        UPDATE Users
        SET companyName = @companyName,
            email = @email,
            contactNumber = @contactNumber,
            address = @address,
            isActive = @isActive,
            isVerified = @isVerified
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.role, INSERTED.companyName,
               INSERTED.contactNumber, INSERTED.address, INSERTED.isActive,
               INSERTED.isVerified, INSERTED.subscriptionId, INSERTED.createdAt
        WHERE id = @id
      `);

    await pool.close();

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.recordset[0] });
  } catch (error: any) {
    console.error('❌ User update error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const pool = await connectDB();

    const transaction = pool.transaction();
    await transaction.begin();

    try {
      await transaction.request()
        .input('id', sql.Int, parseInt(id!))
        .query('DELETE FROM Subscriptions WHERE userId = @id');

      await transaction.request()
        .input('id', sql.Int, parseInt(id!))
        .query('DELETE FROM Users WHERE id = @id');

      await transaction.commit();
      await pool.close();

      return NextResponse.json({ success: true });
    } catch (err) {
      await transaction.rollback();
      await pool.close();
      throw err;
    }
  } catch (error: any) {
    console.error('❌ User delete error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
