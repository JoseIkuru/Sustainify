import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { orderId } = await request.json();

    console.log("Received payload to check order status:", { orderId });

    // Validate orderId
    if (!orderId) {
      return Response.json({ error: "Missing orderId" }, { status: 400 });
    }

    // Query the orders table to get the status based on the orderId
    const order = await sql`
      SELECT status FROM orders WHERE id = ${orderId};
    `;

    if (order.length === 0) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const orderStatus = order[0].status;
    console.log("Order status:", orderStatus);

    // Return the status in the response
    return new Response(JSON.stringify({ status: orderStatus }), { status: 200 });

  } catch (error) {
    console.error("Error fetching order status:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
