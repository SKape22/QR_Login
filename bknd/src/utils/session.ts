import { Pool } from 'pg'
import { createSessionTable, tableExists } from './tableCheck';

const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'userdb',
  password: 'your_password',
  port: 5433,
})

export async function isSessionActive(username: string): Promise<boolean> {
  try {
    if (!(await tableExists('session'))) {
      await createSessionTable();
    }    

    const connection = await pool.connect();
    const result = await connection.query(`
      SELECT COUNT(*) FROM session
      WHERE username = $1
    `, [username])
    
    connection.release();
    return result.rows[0].count > 0;
  } catch (err) {
    console.error('Error checking existing session:', err);
    return false;
  }
}

export async function invalidateSession(username: string): Promise<void> {
  try {
    const connection = await pool.connect();
    await connection.query(`
        DELETE FROM session WHERE username = $1
    `, [username])
    
    connection.release()
  } catch (err) {
    console.error(err);
  }
}