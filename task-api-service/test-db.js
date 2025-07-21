import { pool } from "./db.js";

async function testConnection() {
  const result = await pool.query("SELECT NOW()");
  console.log("DB time:", result.rows[0]);
  pool.end();
}

testConnection().catch(console.error);