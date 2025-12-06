import sql from 'mssql';

// MSSQL Database Configuration
const config: sql.config = {
  user: process.env.DB_USER || 'your_username',
  password: process.env.DB_PASSWORD || 'your_password',
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'), // Default MSSQL port is 1433
  database: process.env.DB_NAME || 'printscrap_db',
  options: {
    encrypt: true, // Use encryption for Azure SQL (set to false for local SQL Server)
    trustServerCertificate: true, // Set to true for local development
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Connection pool
let pool: sql.ConnectionPool | null = null;

// Get database connection
export async function getConnection(): Promise<sql.ConnectionPool> {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('Database connected successfully');
    }
    return pool;
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}

// Execute query helper
export async function executeQuery<T = any>(
  query: string,
  params: Record<string, any> = {}
): Promise<sql.IResult<T>> {
  try {
    const pool = await getConnection();
    const request = pool.request();

    // Add parameters to request
    Object.keys(params).forEach((key) => {
      request.input(key, params[key]);
    });

    const result = await request.query<T>(query);
    return result;
  } catch (err) {
    console.error('Query execution error:', err);
    throw err;
  }
}

// Close connection (for cleanup)
export async function closeConnection(): Promise<void> {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Database connection closed');
    }
  } catch (err) {
    console.error('Error closing connection:', err);
  }
}

export { sql };
