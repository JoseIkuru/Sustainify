import { neon } from '@neondatabase/serverless';

export async function GET(request: Request) {
  try {
    // Ensure DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return new Response(JSON.stringify({ error: "DATABASE_URL is missing" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    // Fetch only orders with status = 'pending'
    const orders = await sql`
      SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC;
    `;

    return new Response(JSON.stringify({ data: orders }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error fetching pending orders:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
