import Stripe from 'stripe';

// Get Stripe secret key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

async function createNsfwProduct() {
  try {
    // Create the product
    const product = await stripe.products.create({
      name: 'NSFW Add-on',
      description: 'Uncensored AI image generation - 100 images per month with premium models',
      metadata: {
        type: 'nsfw_addon',
      },
    });

    console.log('Product created:', product.id);

    // Create the price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 799, // $7.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        type: 'nsfw_addon',
      },
    });

    console.log('Price created:', price.id);
    console.log('\n=== NSFW Add-on Product Created ===');
    console.log('Product ID:', product.id);
    console.log('Price ID:', price.id);
    console.log('\nUpdate your code with this price ID!');

  } catch (error) {
    console.error('Error creating product:', error.message);
    process.exit(1);
  }
}

createNsfwProduct();
