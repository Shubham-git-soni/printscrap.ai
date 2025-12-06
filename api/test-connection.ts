// Test database connection
import 'dotenv/config';
import { getConnection, closeConnection } from './db';

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log('Configuration:');
    console.log('  - Server:', process.env.DB_SERVER || 'localhost');
    console.log('  - Port:', process.env.DB_PORT || '1433');
    console.log('  - Database:', process.env.DB_NAME || 'printscrap_db');
    console.log('  - User:', process.env.DB_USER || 'N/A');
    console.log('');

    const pool = await getConnection();
    console.log('✅ Database connection successful!');
    console.log('');

    // Test query
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log('📊 Database Version:');
    console.log(result.recordset[0].version);
    console.log('');

    // List tables
    const tables = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    console.log('📋 Database Tables:');
    if (tables.recordset.length > 0) {
      tables.recordset.forEach((table: any, index: number) => {
        console.log(`  ${index + 1}. ${table.TABLE_NAME}`);
      });
    } else {
      console.log('  ⚠️  No tables found. Run schema.sql to create tables.');
    }
    console.log('');

    await closeConnection();
    console.log('✅ Connection test completed successfully!');
  } catch (error: any) {
    console.error('❌ Database connection failed!');
    console.error('');
    console.error('Error details:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('');
    console.error('Common issues:');
    console.error('  1. Check your .env file has correct credentials');
    console.error('  2. Ensure SQL Server is running');
    console.error('  3. Verify network connectivity to the server');
    console.error('  4. Check if port 1433 is accessible');
    console.error('  5. Confirm database name is correct');
    console.error('');
    process.exit(1);
  }
}

// Run the test
testConnection();
