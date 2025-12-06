import { VercelRequest, VercelResponse } from '@vercel/node';
import { executeQuery } from '../db';
import { User, LoginRequest, ApiResponse, AuthResponse } from '../types';

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
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      return res.status(400).json<ApiResponse>({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Query user
    const query = `
      SELECT id, email, role, companyName, contactNumber, address, isActive, isVerified, subscriptionId, createdAt
      FROM Users
      WHERE email = @email AND password = @password
    `;

    const result = await executeQuery<User>(query, { email, password });

    if (result.recordset.length === 0) {
      return res.status(401).json<ApiResponse>({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = result.recordset[0];

    if (!user.isActive) {
      return res.status(403).json<ApiResponse>({
        success: false,
        message: 'Account is not active. Please contact administrator.',
      });
    }

    // Return user data
    return res.status(200).json<ApiResponse<AuthResponse>>({
      success: true,
      message: 'Login successful',
      data: {
        user,
        // For Basic Auth, frontend will store credentials in localStorage
        authHeader: `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json<ApiResponse>({
      success: false,
      message: 'Internal server error',
    });
  }
}
