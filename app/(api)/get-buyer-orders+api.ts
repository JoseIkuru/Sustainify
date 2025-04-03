import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { buyerName } = await request.json(); // Expecting buyer name in the request body

    console.log("Fetching order details for buyer:", buyerName);

    // Validate buyerName
    if (!buyerName) {
      return Response.json({ error: "Missing buyer name" }, { status: 400 });
    }

    // Query to get the required order details based on buyer name and status 'accepted'
    const orders = await sql`
      SELECT id,buyer_name, seller_name, seller_location, transporter_name, price, created_at, status, buyer_location
      FROM orders
      WHERE LOWER(buyer_name) = LOWER(${buyerName}) AND status = 'accepted';
    `;

    if (orders.length === 0) {
      return Response.json({ message: "No orders found for this buyer with accepted status" }, { status: 404 });
    }

    console.log("Fetched orders:", orders);

    return new Response(JSON.stringify({ data: orders }), { status: 200 });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
