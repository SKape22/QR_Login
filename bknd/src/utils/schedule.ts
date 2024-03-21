import { Pool } from "pg";
import { tableExists, createChallengeTable } from "./tableCheck";

const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'userdb',
  password: 'your_password',
  port: 5433,
})

async function deleteExpiredChallenges() {
  try {
    if (!(await tableExists('challenge'))) {
      await createChallengeTable();
    }

    const connection = await pool.connect();
    const result = await connection.query(  
      'DELETE FROM challenge WHERE CURRENT_TIMESTAMP - created_at >= interval \'5 minute\''); // Adjust interval
    connection.release();
    console.log("expired challenges deleted")
  } catch (err) {
    console.error('Error deleting expired challenges:', err);
  }
}

// Remove the line: deleteExpiredChallenges().then(() => process.exit(0));

export default deleteExpiredChallenges; // Optional for future use