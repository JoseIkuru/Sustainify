import Stripe from 'stripe';
const stripe = new Stripe("sk_test_51Qzu2R2V8S747Q12VYYpTagFBYbCQzvpNG2EW2iCQxxRt9aXnqfOtUrii7wmkMrhFzq06eChSeJqEllOotMSa5RH00YjvqPOF9", { apiVersion: '2025-02-24.acacia' });

export async function POST(request: Request) {
  try {
    const { email, name, clerkId } = await request.json();
    // Create an Express connected account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      business_type: 'individual',
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      // Additional optional info, e.g., individual details
    });
    
    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://sustainify.com/reauth',    // URL to use if onboarding is canceled
      return_url: 'https://sustainify.com/stripe-onboard-complete', // URL after successful onboarding
      type: 'account_onboarding',
    });
    // console.log("Account Link Response:", accountLink);
    // console.log("Account Response:", account.id);
    // console.log("Exiting")
    return new Response(
      JSON.stringify({ accountLink: accountLink.url, connectedAccountId: account.id }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating transporter account:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}