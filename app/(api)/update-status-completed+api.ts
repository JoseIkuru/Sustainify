import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { orderId } = await request.json();

    console.log("Updating order status for ID:", orderId);

    // Validate orderId
    if (!orderId) {
      return Response.json({ error: "Missing order ID" }, { status: 400 });
    }

    // Update order status to 'completed'
    const result = await sql`
      UPDATE orders
      SET status = 'completed'
      WHERE id = ${orderId}
      RETURNING *;
    `;

    if (result.length === 0) {
      return Response.json({ message: "Order not found or already completed" }, { status: 404 });
    }

    console.log("Order updated:", result);

    return new Response(JSON.stringify({ message: "Order marked as completed", data: result }), { status: 200 });

  } catch (error) {
    console.error("Error updating order:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
