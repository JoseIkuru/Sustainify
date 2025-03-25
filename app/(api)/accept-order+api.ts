// File: /app/api/transporters/acceptOrder.ts
import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    // Connect to Neon using your DATABASE_URL
    const sql = neon(`${process.env.DATABASE_URL}`);
    
    // Parse the order acceptance data
    const { orderId, transporterName, transporterEmail } = await request.json();

    console.log("Received order acceptance payload:", { orderId, transporterName, transporterEmail });
    
    // Validate required fields
    if (!orderId || !transporterName || !transporterEmail) {
      console.error("Invalid payload:", { orderId, transporterName, transporterEmail });
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update the order status to "accepted" and add transporter details to the order
    const updatedOrder = await sql`
      UPDATE orders
      SET status = 'accepted',
          transporter_name = ${transporterName},
          transporter_email = ${transporterEmail}
      WHERE id = ${orderId}
      RETURNING *;
    `;
    
    console.log("Updated order:", updatedOrder);

    // Check if the order was updated
    if (!updatedOrder || updatedOrder[0].status !== 'accepted') {
      return Response.json({ error: "Order not found or failed to update" }, { status: 404 });
    }

    // Return the updated order
    return new Response(JSON.stringify({ data: updatedOrder }), { status: 200 });
  } catch (error) {
    // Catch and log any errors
    console.error("Error accepting order:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
