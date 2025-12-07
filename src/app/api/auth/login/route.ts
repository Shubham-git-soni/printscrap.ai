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

    // Query user from database
    const result = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .query(`
        SELECT id, email, role, companyName, contactNumber, address,
               isActive, isVerified, subscriptionId, createdAt
        FROM Users
        WHERE email = @email AND password = @password
      `);

    await pool.close();

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.recordset[0];

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is not active' },
        { status: 403 }
      );
    }

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
