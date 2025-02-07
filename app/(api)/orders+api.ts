import { neon } from '@neondatabase/serverless';

export async function GET(request: Request) {
  try {
    // Initialize the Neon connection using your DATABASE_URL
    const sql = neon(`${process.env.DATABASE_URL}`);

    // Get query parameters (for example, filtering by status)
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // e.g., 'pending'

    let orders;
    if (status) {
      orders = await sql`
        SELECT *
        FROM orders
        WHERE status = ${status}
        ORDER BY created_at DESC;
      `;
    } else {
      orders = await sql`
        SELECT *
        FROM orders
        ORDER BY created_at DESC;
      `;
    }

    return new Response(JSON.stringify({ data: orders }), { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
