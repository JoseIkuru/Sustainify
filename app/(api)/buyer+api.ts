import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { buyerName, wasteType, requestedWeight, location, additionalReq, buyerId } = await request.json();

    console.log("Received payload:", { buyerName, wasteType, requestedWeight, location, additionalReq, buyerId });

    // Validate required fields
    if (!buyerName || !wasteType || !requestedWeight || !location || !buyerId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await sql`
      INSERT INTO buyers (
        buyer_name,
        waste_type,
        requested_weight,
        location,
        additional_req,
        buyer_id
      )
      VALUES (
        ${buyerName},
        ${wasteType},
        ${requestedWeight},
        ${location},
        ${additionalReq},
        ${buyerId}
      );
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating buyer request:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
