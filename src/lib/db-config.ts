import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER || '',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Singleton connection pool
let pool: sql.ConnectionPool | null = null;

export async function connectDB() {
  try {
    if (pool && pool.connected) {
      return pool;
    }

    if (pool && pool.connecting) {
      // Wait for existing connection attempt to complete
      return await new Promise<sql.ConnectionPool>((resolve, reject) => {
        const checkConnection = setInterval(() => {
          if (pool && pool.connected) {
            clearInterval(checkConnection);
            resolve(pool);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkConnection);
          reject(new Error('Connection timeout'));
        }, 10000);
      });
    }

    pool = new sql.ConnectionPool(config);
    await pool.connect();

    pool.on('error', err => {
      console.error('Database pool error:', err);
      pool = null;
    });

    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    pool = null;
    throw error;
  }
}

export async function closeDB() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}
