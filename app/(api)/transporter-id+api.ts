import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    // Ensure DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return new Response(JSON.stringify({ error: "DATABASE_URL is missing" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    // Parse the incoming JSON request body
    const { clerkId } = await request.json();

    if (!clerkId) {
      return new Response(JSON.stringify({ error: "clerkId is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Query to fetch transporterId based on the clerkId
    const result = await sql`
      SELECT transporter_id 
      FROM transporter
      WHERE clerk_id = ${clerkId}
      LIMIT 1;
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Transporter not found for the given clerkId" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send back the transporterId
    return new Response(JSON.stringify({ transporterId: result[0].transporter_id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error fetching transporterId:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
