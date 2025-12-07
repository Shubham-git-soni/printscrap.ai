import { NextResponse } from 'next/server';
import sql from 'mssql';
import { connectDB } from '@/lib/db-config';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification token is required' },
        { status: 400 }
      );
    }

    const pool = await connectDB();

    // Find user with this verification token
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT id, email, isVerified, createdAt
        FROM Users
        WHERE verificationToken = @token
      `);

    if (result.recordset.length === 0) {
      await pool.close();
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification token' },
        { status: 404 }
      );
    }

    const user = result.recordset[0];

    // Check if already verified
    if (user.isVerified) {
      await pool.close();
      return NextResponse.json(
        { success: false, message: 'Email already verified' },
        { status: 400 }
      );
    }

    // Check if token is expired (24 hours)
    const createdAt = new Date(user.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      await pool.close();
      return NextResponse.json(
        { success: false, message: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Update user as verified
    await pool.request()
      .input('id', sql.Int, user.id)
      .query(`
        UPDATE Users
        SET isVerified = 1, verificationToken = NULL
        WHERE id = @id
      `);

    await pool.close();

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now login.',
      data: { email: user.email }
    });
  } catch (error: any) {
    console.error('❌ Email verification error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
