// Test SearXNG integration

const SEARXNG_INSTANCES = [
  'https://searx.tiekoetter.com',
  'https://paulgo.io',
  'https://search.rhscz.eu',
  'https://priv.au',
  'https://search.inetol.net',
];

async function testSearXNG() {
  const queries = [
    'bitcoin price today',
    'silver price USD',
    'latest AI news',
    'weather new york',
  ];

  for (const query of queries) {
    console.log(`\n=== Testing: "${query}" ===`);
    
    for (const instance of SEARXNG_INSTANCES.slice(0, 3)) {
      try {
        const encodedQuery = encodeURIComponent(query);
        const url = `${instance}/search?q=${encodedQuery}&format=json&categories=general`;
        
        console.log(`  Trying ${instance}...`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Chofesh.ai/1.0 (AI Assistant)',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          console.log(`    Error: ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          console.log(`    ✅ Got ${data.results.length} results!`);
          console.log(`    First result: ${data.results[0].title}`);
          console.log(`    URL: ${data.results[0].url}`);
          console.log(`    Description: ${data.results[0].content?.substring(0, 100)}...`);
          break; // Success, move to next query
        } else {
          console.log(`    No results`);
        }
        
      } catch (error) {
        console.log(`    Error: ${error.message}`);
      }
    }
  }
}

testSearXNG();
