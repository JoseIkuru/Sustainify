import Stripe from 'stripe';
const stripe = new Stripe("sk_test_51Qzu2R2V8S747Q12VYYpTagFBYbCQzvpNG2EW2iCQxxRt9aXnqfOtUrii7wmkMrhFzq06eChSeJqEllOotMSa5RH00YjvqPOF9");

export async function POST(request: Request) {
  try {
    // Expecting amount (in cents) from the request
    const { amount } = await request.json();

    // Create PaymentIntent with calculated amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in smallest currency unit (e.g. cents)
      currency: 'usd',
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
