import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // You can add more options here if needed
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
