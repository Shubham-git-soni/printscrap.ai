import { VercelRequest, VercelResponse } from '@vercel/node';
import { executeQuery, getConnection, sql } from '../db';
import { User, RegisterRequest, ApiResponse, AuthResponse } from '../types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json<ApiResponse>({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { email, password, companyName, contactNumber, address } = req.body as RegisterRequest;

    if (!email || !password || !companyName) {
      return res.status(400).json<ApiResponse>({
        success: false,
        message: 'Email, password, and company name are required',
      });
    }

    // Check if user already exists
    const checkQuery = 'SELECT id FROM Users WHERE email = @email';
    const existingUser = await executeQuery(checkQuery, { email });

    if (existingUser.recordset.length > 0) {
      return res.status(400).json<ApiResponse>({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create user with transaction
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Insert user
      const insertUserQuery = `
        INSERT INTO Users (email, password, role, companyName, contactNumber, address, isActive, isVerified)
        OUTPUT INSERTED.id
        VALUES (@email, @password, 'client', @companyName, @contactNumber, @address, 1, 0)
      `;

      const userResult = await transaction.request()
        .input('email', sql.NVarChar, email)
        .input('password', sql.NVarChar, password)
        .input('companyName', sql.NVarChar, companyName)
        .input('contactNumber', sql.NVarChar, contactNumber || null)
        .input('address', sql.NVarChar, address || null)
        .query(insertUserQuery);

      const userId = userResult.recordset[0].id;

      // Create 1-day trial subscription
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 1);

      const insertSubQuery = `
        INSERT INTO Subscriptions (userId, planId, status, startDate, endDate, autoRenew)
        OUTPUT INSERTED.id
        VALUES (@userId, 0, 'trial', @startDate, @endDate, 0)
      `;

      const subResult = await transaction.request()
        .input('userId', sql.Int, userId)
        .input('startDate', sql.DateTime, now)
        .input('endDate', sql.DateTime, trialEnd)
        .query(insertSubQuery);

      const subscriptionId = subResult.recordset[0].id;

      // Update user with subscription ID
      const updateUserQuery = `
        UPDATE Users
        SET subscriptionId = @subscriptionId
        WHERE id = @userId
      `;

      await transaction.request()
        .input('userId', sql.Int, userId)
        .input('subscriptionId', sql.Int, subscriptionId)
        .query(updateUserQuery);

      await transaction.commit();

      // Fetch the created user
      const getQuery = `
        SELECT id, email, role, companyName, contactNumber, address, isActive, isVerified, subscriptionId, createdAt
        FROM Users
        WHERE id = @userId
      `;

      const createdUser = await executeQuery<User>(getQuery, { userId });

      return res.status(201).json<ApiResponse<AuthResponse>>({
        success: true,
        message: 'Registration successful. You have been granted a 1-day trial.',
        data: {
          user: createdUser.recordset[0],
          authHeader: `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`,
        },
      });
    } catch (txError) {
      await transaction.rollback();
      throw txError;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json<ApiResponse>({
      success: false,
      message: 'Internal server error',
    });
  }
}
