// Test the enhanced web search functionality

async function testEnhancedSearch() {
  const queries = [
    'bitcoin price today',
    'silver price USD',
    'gold price current',
    'latest news AI',
  ];

  for (const query of queries) {
    console.log(`\n=== Testing: "${query}" ===`);
    
    try {
      // Test DuckDuckGo JSON API
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Chofesh.ai/1.0 (AI Assistant)',
        },
      });
      
      if (!response.ok) {
        console.log(`  Error: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      console.log(`  Abstract: ${data.AbstractText ? data.AbstractText.substring(0, 100) + '...' : 'None'}`);
      console.log(`  Answer: ${data.Answer || 'None'}`);
      console.log(`  Related Topics: ${data.RelatedTopics?.length || 0}`);
      console.log(`  Results: ${data.Results?.length || 0}`);
      
      // Check if we got any useful data
      const hasData = data.AbstractText || data.Answer || data.RelatedTopics?.length > 0 || data.Results?.length > 0;
      console.log(`  Has useful data: ${hasData}`);
      
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
}

testEnhancedSearch();
