import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const creditPacks = [
  {
    name: 'starter',
    displayName: 'Starter Pack',
    credits: 300,
    priceUsd: 500, // $5.00
    description: '300 credits - Perfect for trying out Chofesh.ai'
  },
  {
    name: 'standard',
    displayName: 'Standard Pack',
    credits: 1000,
    priceUsd: 1200, // $12.00
    description: '1,000 credits - Best value for regular users'
  },
  {
    name: 'pro',
    displayName: 'Pro Pack',
    credits: 3500,
    priceUsd: 3500, // $35.00
    description: '3,500 credits - For power users'
  },
  {
    name: 'power',
    displayName: 'Power Pack',
    credits: 12000,
    priceUsd: 9900, // $99.00
    description: '12,000 credits - Maximum value for heavy users'
  }
];

async function createProducts() {
  console.log('Creating Stripe products for credit packs...\n');
  
  for (const pack of creditPacks) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: `Chofesh.ai ${pack.displayName}`,
        description: pack.description,
        metadata: {
          type: 'credit_pack',
          pack_name: pack.name,
          credits: pack.credits.toString()
        }
      });
      
      // Create price (one-time payment)
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.priceUsd,
        currency: 'usd',
        metadata: {
          pack_name: pack.name,
          credits: pack.credits.toString()
        }
      });
      
      console.log(`✓ ${pack.displayName}`);
      console.log(`  Product ID: ${product.id}`);
      console.log(`  Price ID: ${price.id}`);
      console.log(`  Credits: ${pack.credits}`);
      console.log(`  Price: $${(pack.priceUsd / 100).toFixed(2)}`);
      console.log('');
      
      // Output for database seeding
      console.log(`-- SQL for ${pack.name}:`);
      console.log(`INSERT INTO credit_packs (name, displayName, credits, priceUsd, stripePriceId, isActive, sortOrder) VALUES ('${pack.name}', '${pack.displayName}', ${pack.credits}, ${pack.priceUsd}, '${price.id}', true, ${creditPacks.indexOf(pack)});`);
      console.log('');
      
    } catch (error) {
      console.error(`✗ Failed to create ${pack.displayName}:`, error.message);
    }
  }
}

createProducts().catch(console.error);
