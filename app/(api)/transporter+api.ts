import { neon } from '@neondatabase/serverless';



export async function POST(request: Request) {
    try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const {name, email, clerkId, transporterId} = await request.json();
    console.log("Received payload:", { name, email, clerkId }); // Log incoming data



    if (!name || !email || !clerkId) {
        return Response.json(
          { error: "Missing required fields" },
          { status: 400 },
        );
      }

      const response = await sql`
      INSERT INTO transporter (
        name, 
        email, 
        clerk_id,
        transporter_id
      ) 
      VALUES (
        ${name}, 
        ${email},
        ${clerkId},
        ${transporterId}
     )`;


    return new Response(JSON.stringify({data:response}), {
        status:201,
    })


    }catch(error){
      console.error("Error creating user:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}