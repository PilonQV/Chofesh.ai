import Stripe from 'stripe';

// Use the LIVE secret key
const stripe = new Stripe(process.env.Secretkey_live_stripe);

const creditPacks = [
  {
    name: 'starter',
    displayName: 'Starter Pack',
    credits: 300,
    priceUsd: 500,
    description: '300 credits - Perfect for trying out Chofesh.ai'
  },
  {
    name: 'standard',
    displayName: 'Standard Pack',
    credits: 1000,
    priceUsd: 1200,
    description: '1,000 credits - Best value for regular users'
  },
  {
    name: 'pro',
    displayName: 'Pro Pack',
    credits: 3500,
    priceUsd: 3500,
    description: '3,500 credits - For power users'
  },
  {
    name: 'power',
    displayName: 'Power Pack',
    credits: 12000,
    priceUsd: 9900,
    description: '12,000 credits - Maximum value for heavy users'
  }
];

async function createProducts() {
  console.log('Creating LIVE Stripe products for credit packs...\n');
  console.log('Using key starting with:', process.env.Secretkey_live_stripe?.substring(0, 12) + '...\n');
  
  const results = [];
  
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
      
      results.push({
        name: pack.name,
        displayName: pack.displayName,
        credits: pack.credits,
        priceUsd: pack.priceUsd,
        productId: product.id,
        priceId: price.id
      });
      
    } catch (error) {
      console.error(`✗ Failed to create ${pack.displayName}:`, error.message);
    }
  }
  
  console.log('\n=== SQL to update credit_packs table ===\n');
  console.log('DELETE FROM credit_packs;');
  for (const result of results) {
    console.log(`INSERT INTO credit_packs (name, displayName, credits, priceUsd, stripePriceId, isActive, sortOrder) VALUES ('${result.name}', '${result.displayName}', ${result.credits}, ${result.priceUsd}, '${result.priceId}', true, ${results.indexOf(result)});`);
  }
  
  return results;
}

createProducts().catch(console.error);
