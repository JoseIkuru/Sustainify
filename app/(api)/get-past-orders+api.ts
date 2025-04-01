import { neon } from '@neondatabase/serverless';

export async function GET(request: Request) {
  try {
    // Ensure DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return new Response(JSON.stringify({ error: "DATABASE_URL is missing" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    // Get query parameters
    const { orderId,userEmail } = await request.json();
    

    if (!orderId || !userEmail) {
      return new Response(JSON.stringify({ error: "Missing orderId or userEmail" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch order details
    const orders = await sql`
      SELECT buyer_name, seller_name, price, waste_type, created_at, transporter_email
      FROM orders
      WHERE id = ${orderId};
    `;

    if (orders.length === 0) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const order = orders[0];

    // Check if userEmail matches transporter_email
    if (order.transporter_email !== userEmail) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: order }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error verifying order email:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
