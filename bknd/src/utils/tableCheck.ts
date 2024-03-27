import { Pool } from 'pg'

const pool = new Pool({
    user: 'your_username',
    host: 'localhost',
    database: 'userdb',
    password: 'your_password',
    port: 5433,
  })

export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const connection = await pool.connect();
    const result = await connection.query(`
        SELECT EXISTS (
            SELECT * FROM information_schema.tables
            WHERE table_name = $1
        ) AS exists;
    `, [tableName]);

    connection.release();
    return result.rows[0].exists;
  } catch (err) {
    console.error('Error checking table existence:', err);
    return false; // Handle potential errors gracefully
  }
}

export async function createUsersTable() {
  try {
    const connection = await pool.connect();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_2fa_enabled BOOLEAN DEFAULT FALSE,
        secret_key VARCHAR(255)
      );
    `;
    await connection.query(createTableQuery);
    connection.release();
  } catch (err) {
    console.error('Error creating users table:', err);
  }
}

export async function createSessionTable() {
    try {
        const connection = await pool.connect();
        const createTableQuery = `
        CREATE TABLE IF NOT EXISTS session (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            accessToken TEXT NOT NULL
        );
    `;
    await connection.query(createTableQuery);
    connection.release();
    } catch (err) {
        console.log('Error creating session table',err)
    }
}