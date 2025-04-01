import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    // Connect to Neon using your DATABASE_URL
    const sql = neon(`${process.env.DATABASE_URL}`);

    // Parse request body
    const { orderId } = await request.json();

    console.log("Received orderId:", orderId);

    // Validate required field
    if (!orderId) {
      return Response.json({ error: "Missing required field: orderId" }, { status: 400 });
    }

    // Fetch the price from the database
    const order = await sql`
      SELECT price FROM orders WHERE id = ${orderId} LIMIT 1;
    `;

    if (!order || order.length === 0) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("Fetched order price:", order[0].price);

    return Response.json({ price: order[0].price }, { status: 200 });

  } catch (error) {
    console.error("Error fetching order price:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
