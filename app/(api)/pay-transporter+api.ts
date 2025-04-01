import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    const stripe = new Stripe("sk_test_51Qzu2R2V8S747Q12VYYpTagFBYbCQzvpNG2EW2iCQxxRt9aXnqfOtUrii7wmkMrhFzq06eChSeJqEllOotMSa5RH00YjvqPOF9");
      // Initialize Stripe with your secret key

      const { stripeAccountId, amount } = await request.json();
      console.log("Received payload:", { stripeAccountId, amount }); // Log incoming data
  
      // Validate input
      if (!stripeAccountId || !amount || isNaN(amount) || amount <= 0) {
        return Response.json({ error: "Invalid stripeAccountId or amount" }, { status: 400 });
      }
  
      console.log(`Initiating transfer: $${amount / 100} to ${stripeAccountId}`);
  
      // Create a transfer to the connected Stripe account
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount), // Ensure amount is an integer in cents
        currency: "usd",
        destination: stripeAccountId,
        description: "Payment for completed delivery",
      });
  
      console.log("Transfer successful:", transfer);
  
      return Response.json({ success: true, transferId: transfer.id }, { status: 200 });
  
    } catch (error: any) {
      console.error("Payment error:", error);
      return Response.json({ error: error.message || "Payment failed" }, { status: 500 });
    }
}
