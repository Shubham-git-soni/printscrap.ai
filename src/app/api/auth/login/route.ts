// Login API - Next.js App Router + Database
import { NextResponse } from 'next/server';
import sql from 'mssql';

const config: sql.config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME!,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const pool = await sql.connect(config);

    // Query user from database by email only
    const result = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT id, email, password, role, companyName, contactNumber, address,
               isActive, isVerified, subscriptionId, createdAt
        FROM Users
        WHERE email = @email
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.recordset[0];

    console.log('🔍 Login Debug:');
    console.log('Email:', email);
    console.log('User found:', user.email);
    console.log('Password match:', user.password === password);
    console.log('isActive:', user.isActive, 'Type:', typeof user.isActive);

    // Check password
    if (user.password !== password) {
      console.log('❌ Password mismatch');
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('✅ Password correct, checking active status...');

    // Check if account is active
    if (!user.isActive) {
      console.log('❌ Account is deactivated');
      return NextResponse.json(
        { success: false, message: 'Your account has been deactivated. Please contact the super admin to reactivate your account.' },
        { status: 403 }
      );
    }

    // Check if email is verified (only for clients, not super_admin)
    if (user.role === 'client' && !user.isVerified) {
      console.log('❌ Email not verified');
      return NextResponse.json(
        { success: false, message: 'Please verify your email before logging in. Check your inbox for the verification link.' },
        { status: 403 }
      );
    }

    // Remove password from response
    delete user.password;

    const authHeader = `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: { user, authHeader },
    });
  } catch (error: any) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Database error', error: error.message },
      { status: 500 }
    );
  }
}
