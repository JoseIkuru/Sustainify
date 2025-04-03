import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { email } = await request.json();

    console.log("Fetching completed orders for:", email);

    // Validate email
    if (!email) {
      return Response.json({ error: "Missing email" }, { status: 400 });
    }

    // Fetch completed orders for the user (buyer, seller, or transporter)
    const orders = await sql`
      SELECT 
        id, 
        buyer_name, 
        seller_name, 
        buyer_location, 
        seller_location, 
        waste_type,
        waste_size,
        transporter_name,
        transporter_email,
        price, 
        created_at
      FROM orders
      WHERE status = 'completed'
      AND (transporter_email = ${email});
    `;

    if (orders.length === 0) {
      return Response.json({ message: "No completed orders found" }, { status: 404 });
    }

    console.log("Completed orders retrieved:", orders);

    return new Response(JSON.stringify({ data: orders }), { status: 200 });

  } catch (error) {
    console.error("Error fetching completed orders:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
