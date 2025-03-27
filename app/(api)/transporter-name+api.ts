import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);

    // Parse request body
    const { clerkId } = await request.json();

    // Validate input
    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Missing clerkId" }), { status: 400 });
    }

    // Query transporter table for name
    const transporter = await sql`
      SELECT name FROM transporter WHERE clerk_id = ${clerkId} LIMIT 1;
    `;

    if (transporter.length === 0) {
      return new Response(JSON.stringify({ error: "Transporter not found" }), { status: 404 });
    }

    // Return transporter name
    return new Response(JSON.stringify({ transporterName: transporter[0].name }), { status: 200 });
  } catch (error) {
    console.error("Error fetching transporter name:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
