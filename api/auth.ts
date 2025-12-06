import { VercelRequest, VercelResponse } from '@vercel/node';
import { executeQuery } from './db';
import { User, AuthenticatedRequest } from './types';

interface AuthResult {
  authenticated: boolean;
  user: User | null;
}

// Basic Authentication
export async function authenticate(
  req: VercelRequest,
  res: VercelResponse
): Promise<AuthResult> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return { authenticated: false, user: null };
    }

    // Decode Basic Auth credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return { authenticated: false, user: null };
    }

    // Query database for user
    const query = `
      SELECT id, email, role, companyName, contactNumber, address, isActive, isVerified, subscriptionId, createdAt
      FROM Users
      WHERE email = @email AND password = @password AND isActive = 1
    `;

    const result = await executeQuery<User>(query, { email, password });

    if (result.recordset.length === 0) {
      return { authenticated: false, user: null };
    }

    const user = result.recordset[0];
    return { authenticated: true, user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { authenticated: false, user: null };
  }
}

// Middleware to protect routes
export async function requireAuth(
  req: AuthenticatedRequest,
  res: VercelResponse,
  next: () => void
): Promise<VercelResponse | void> {
  const { authenticated, user } = await authenticate(req, res);

  if (!authenticated) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Attach user to request
  req.user = user!;
  next();
}

// Check if user has specific role
export function requireRole(role: 'super_admin' | 'client') {
  return async (
    req: AuthenticatedRequest,
    res: VercelResponse,
    next: () => void
  ): Promise<VercelResponse | void> => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}
