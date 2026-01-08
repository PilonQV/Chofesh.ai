import Stripe from 'stripe';

const stripe = new Stripe(process.env.Secretkey_live_stripe);

async function checkAccount() {
  try {
    const account = await stripe.accounts.retrieve();
    console.log('Account ID:', account.id);
    console.log('Business Name:', account.business_profile?.name);
    console.log('Email:', account.email);
    console.log('Country:', account.country);
  } catch (error) {
    // If we can't retrieve account info, try to get it from a balance call
    try {
      const balance = await stripe.balance.retrieve();
      console.log('Balance retrieved successfully - key is valid');
      console.log('Available:', balance.available);
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

checkAccount();
