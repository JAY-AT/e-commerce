import { getPool } from '../../config/pool.js';

// Trace point: testConnection()
export const testConnection = async () => {
  const pool = getPool();

  try {
    const connection = await pool.getConnection();

    await connection.query('SELECT NOW()');
    connection.release();

    console.log('✅ MySQL Database connected successfully');
  } catch (err) {
    console.error('❌ MySQL Database connection failed:', err);
    throw err;
  }
};