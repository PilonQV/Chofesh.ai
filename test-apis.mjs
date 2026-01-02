// Test different API endpoints to see what's available
const ENV = {
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL,
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY
};

const apisToTest = [
  'BraveSearch/web_search',
  'Google/search',
  'Bing/search',
  'DuckDuckGo/search',
  'Serper/search',
  'SerpApi/search',
  'Tavily/search',
  'Yahoo/search',
];

async function testApi(apiId) {
  const baseUrl = ENV.forgeApiUrl.endsWith('/') ? ENV.forgeApiUrl : ENV.forgeApiUrl + '/';
  const fullUrl = new URL('webdevtoken.v1.WebDevService/CallApi', baseUrl).toString();
  
  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'connect-protocol-version': '1',
        authorization: 'Bearer ' + ENV.forgeApiKey,
      },
      body: JSON.stringify({
        apiId: apiId,
        query: { q: 'test' },
      }),
    });
    
    const data = await response.json();
    return { apiId, status: response.status, available: response.status !== 404, message: data.message || 'OK' };
  } catch (e) {
    return { apiId, status: 'error', available: false, message: e.message };
  }
}

async function main() {
  console.log('Testing available APIs...\n');
  
  for (const api of apisToTest) {
    const result = await testApi(api);
    console.log(`${result.apiId}: ${result.available ? '✓ Available' : '✗ Not found'} (${result.status}) - ${result.message}`);
  }
}

main();
