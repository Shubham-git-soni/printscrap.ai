// Register API - Next.js App Router + Database
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
    const { email, password, companyName, contactNumber, address } = await request.json();

    if (!email || !password || !companyName) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and company name are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Check if user exists
      const checkResult = await transaction
        .request()
        .input('email', sql.NVarChar, email)
        .query('SELECT id FROM Users WHERE email = @email');

      if (checkResult.recordset.length > 0) {
        await transaction.rollback();
        await pool.close();
        return NextResponse.json(
          { success: false, message: 'User with this email already exists' },
          { status: 400 }
        );
      }

      // Insert user
      const userResult = await transaction
        .request()
        .input('email', sql.NVarChar, email)
        .input('password', sql.NVarChar, password)
        .input('companyName', sql.NVarChar, companyName)
        .input('contactNumber', sql.NVarChar, contactNumber || null)
        .input('address', sql.NVarChar, address || null)
        .query(`
          INSERT INTO Users (email, password, role, companyName, contactNumber, address, isActive, isVerified)
          OUTPUT INSERTED.id
          VALUES (@email, @password, 'client', @companyName, @contactNumber, @address, 1, 0)
        `);

      const userId = userResult.recordset[0].id;

      // Create 1-day trial subscription
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 1);

      const subResult = await transaction
        .request()
        .input('userId', sql.Int, userId)
        .input('planId', sql.Int, 1)
        .input('startDate', sql.DateTime, now)
        .input('endDate', sql.DateTime, trialEnd)
        .query(`
          INSERT INTO Subscriptions (userId, planId, status, startDate, endDate, autoRenew)
          OUTPUT INSERTED.id
          VALUES (@userId, @planId, 'trial', @startDate, @endDate, 0)
        `);

      const subscriptionId = subResult.recordset[0].id;

      // Update user with subscription ID
      await transaction
        .request()
        .input('userId', sql.Int, userId)
        .input('subscriptionId', sql.Int, subscriptionId)
        .query('UPDATE Users SET subscriptionId = @subscriptionId WHERE id = @userId');

      await transaction.commit();

      // Fetch created user
      const userDataResult = await pool
        .request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT id, email, role, companyName, contactNumber, address,
                 isActive, isVerified, subscriptionId, createdAt
          FROM Users
          WHERE id = @userId
        `);

      await pool.close();

      const user = userDataResult.recordset[0];
      const authHeader = `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`;

      console.log('✅ User registered successfully:', email);

      return NextResponse.json({
        success: true,
        message: 'Registration successful. You have been granted a 1-day trial.',
        data: { user, authHeader },
      });
    } catch (txError: any) {
      console.error('❌ Transaction error:', txError);
      await transaction.rollback();
      await pool.close();
      throw txError;
    }
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Database error', error: error.message },
      { status: 500 }
    );
  }
}
