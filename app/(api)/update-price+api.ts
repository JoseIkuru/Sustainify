import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { orderId, price } = await request.json();

    console.log("Received payload for updating price:", { orderId, price });

    // Validate required fields
    if (!orderId || !price) {
      return Response.json({ error: "Missing orderId or price" }, { status: 400 });
    }

    // Update the price once status is 'accepted'
    const order = await sql`
      SELECT status FROM orders WHERE id = ${orderId};
    `;

    if (order.length === 0) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    if (order[0].status !== 'accepted') {
      return Response.json({ error: "Order not accepted yet" }, { status: 400 });
    }

    // Now update the price for the order
    const updatedOrder = await sql`
      UPDATE orders 
      SET price = ${price}
      WHERE id = ${orderId}
      RETURNING *;
    `;

    if (updatedOrder.length === 0) {
      return Response.json({ error: "Failed to update order" }, { status: 500 });
    }

    console.log("Order updated with new price:", updatedOrder);

    return new Response(JSON.stringify({ data: updatedOrder }), { status: 200 });

  } catch (error) {
    console.error("Error updating order price:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
