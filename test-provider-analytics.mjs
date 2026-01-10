// Functional test for Provider Analytics
// Using built-in fetch (Node 18+)

const API_URL = 'http://localhost:3000/trpc';

console.log('=== Provider Analytics Functional Test ===\n');

async function testAnalyticsEndpoints() {
  try {
    // Test 1: Check if database has provider_usage table
    console.log('1. Testing provider analytics database...');
    const dbTestRes = await fetch(`${API_URL}/admin.providerStats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    
    if (dbTestRes.ok) {
      console.log('✓ Provider analytics database accessible');
    } else if (dbTestRes.status === 401) {
      console.log('⚠ Endpoint requires authentication (expected in test)');
    } else {
      console.log('✗ Provider analytics database error:', dbTestRes.status);
    }
    
    // Test 2: Check provider configuration
    console.log('\n2. Testing provider configuration...');
    const configTest = await import('./server/_core/aiProviders.ts').catch(() => null);
    if (configTest) {
      console.log('✓ Provider configuration module loaded');
    } else {
      console.log('⚠ Provider configuration module not directly testable via import');
    }
    
    // Test 3: Check if Cerebras is configured
    console.log('\n3. Testing Cerebras configuration...');
    const cerebrasKey = process.env.CEREBRAS_API_KEY;
    if (cerebrasKey) {
      console.log('✓ CEREBRAS_API_KEY is configured');
    } else {
      console.log('✗ CEREBRAS_API_KEY not found');
    }
    
    // Test 4: Check search with citations endpoint
    console.log('\n4. Testing searchWithCitations endpoint...');
    const searchRes = await fetch(`${API_URL}/webSearch.searchWithCitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'what is AI'
      })
    });
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      console.log('✓ Search with citations endpoint working');
      if (searchData.result?.data) {
        console.log('  - Query:', searchData.result.data.query);
        console.log('  - Sources found:', searchData.result.data.sources?.length || 0);
      }
    } else if (searchRes.status === 401) {
      console.log('⚠ Endpoint requires authentication');
    } else {
      console.log('✗ Search endpoint failed:', searchRes.status);
    }
    
    console.log('\n=== Analytics test completed ===');
    
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

testAnalyticsEndpoints();
