import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const {companyName , wasteType, weight, pickupDate, location, specialReq, sellerId } = await request.json();
    console.log("Received payload:", {companyName , wasteType, weight, pickupDate, location, specialReq, sellerId }); // Log incoming data

    if (!companyName || !wasteType || !weight || !pickupDate || !location || !sellerId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const response = await sql`
      INSERT INTO sellers (
        company_name,
        waste_type, 
        weight, 
        pickup_date, 
        location, 
        special_req,
        seller_id
      )
      VALUES (
        ${companyName},
        ${wasteType},
        ${weight},
        ${pickupDate},
        ${location},
        ${specialReq},
        ${sellerId}
      );
    `;

    return new Response(JSON.stringify({ data: response }), { status: 201 });
  } catch (error) {
    console.error("Error creating waste listing:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
