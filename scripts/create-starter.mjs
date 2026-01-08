import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createStarterPack() {
  const pack = {
    name: 'starter',
    displayName: 'Starter Pack',
    credits: 300,
    priceUsd: 500,
    description: '300 credits - Perfect for trying out Chofesh.ai'
  };
  
  const product = await stripe.products.create({
    name: `Chofesh.ai ${pack.displayName}`,
    description: pack.description,
    metadata: {
      type: 'credit_pack',
      pack_name: pack.name,
      credits: pack.credits.toString()
    }
  });
  
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
  console.log(`INSERT INTO credit_packs (name, displayName, credits, priceUsd, stripePriceId, isActive, sortOrder) VALUES ('${pack.name}', '${pack.displayName}', ${pack.credits}, ${pack.priceUsd}, '${price.id}', true, 0);`);
}

createStarterPack().catch(console.error);
