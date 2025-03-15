// File: /app/api/buyer/match.ts
import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    // Connect to Neon using your DATABASE_URL
    const sql = neon(`${process.env.DATABASE_URL}`);
    
    // Parse the buyer's submission
    const {
      buyerName,
      wasteType,
      requestedWeight,
      location,
      additionalReq,
      buyerId,
    } = await request.json();

    console.log("Received buyer payload:", { buyerName, wasteType, requestedWeight, location, additionalReq, buyerId });
    
    // Validate required fields
    if (!buyerName || !wasteType || !requestedWeight || !location || !buyerId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find a matching seller listing
    // For example, matching waste type, weight within 10% tolerance, and exact location.
    const sellerListings = await sql`
      SELECT *
      FROM sellers
    `;
    
    if (!sellerListings || sellerListings.length === 0) {
      return Response.json({ error: "No matching seller listing found" }, { status: 404 });
    }
    
    const seller = sellerListings[0];
    console.log(seller)
    
    // Create an order in the orders table linking buyer and seller
    const orders = await sql`
      INSERT INTO orders (
        seller_listing_id,
        buyer_name,
        seller_name,
        waste_type,
        waste_size,
        buyer_location,
        seller_location,
        status
      )
      VALUES (
        ${seller.id},
        ${buyerName},
        ${seller.company_name},
        ${wasteType},
        ${seller.weight},
        ${location},
        ${seller.location},
        'pending'
      )
      RETURNING *;
    `;
    
    
    console.log("Order created:", orders);
    return new Response(JSON.stringify({ data: orders }), { status: 201 });
  } catch (error) {
    console.error("Error matching buyer with seller:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
