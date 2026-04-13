import { neon } from "@neondatabase/serverless";

async function testConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("No DATABASE_URL found");
    return;
  }

  try {
    const sql = neon(url);
    const result = await sql`SELECT 1 as connected`;
    console.log("Database connection successful:", result);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

testConnection();
