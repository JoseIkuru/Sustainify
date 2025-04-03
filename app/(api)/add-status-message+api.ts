// File: /app/api/transporters/add-status-message+api.ts
import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    // Connect to Neon using your DATABASE_URL
    const sql = neon(`${process.env.DATABASE_URL}`);
    
    // Parse the status update data
    const { orderId, statusMessage } = await request.json();

    console.log("Received status update payload:", { orderId, statusMessage });


    
    // Validate required fields
    if (!orderId || !statusMessage) {
      console.error("Invalid payload:", { orderId, statusMessage});
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const statusTime = new Date().toISOString();

    // Insert the new status update into the status_updates table
    const newStatusUpdate = await sql`
      INSERT INTO status_updates (order_id, status_message,status_time)
      VALUES (${orderId}, ${statusMessage}, ${statusTime})
      RETURNING *;
    `;
    
    console.log("New status update:", newStatusUpdate);

    // Return the newly created status update
    return new Response(JSON.stringify({ data: newStatusUpdate }), { status: 200 });
  } catch (error) {
    // Catch and log any errors
    console.error("Error adding status update:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
