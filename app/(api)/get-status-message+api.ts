// File: /app/api/transporters/get-status-updates+api.ts
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    
    // Parse the request payload
    const { orderId } = await request.json();

    console.log("Fetching status updates for order ID:", orderId);

    // Validate orderId
    if (!orderId) {
      return Response.json({ error: "Missing order ID" }, { status: 400 });
    }

    // Fetch all status updates for the given orderId
    const statusUpdates = await sql`
      SELECT status_message, status_time FROM status_updates
      WHERE order_id = ${orderId}
      ORDER BY status_time DESC;
    `;

    // If no status updates are found
    if (statusUpdates.length === 0) {
      return Response.json({ message: "No status updates found for this order" }, { status: 404 });
    }

    console.log("Status updates retrieved:", statusUpdates);

    // Return the status updates
    return new Response(JSON.stringify({ message: "Status updates fetched successfully", data: statusUpdates }), { status: 200 });

  } catch (error) {
    console.error("Error fetching status updates:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
