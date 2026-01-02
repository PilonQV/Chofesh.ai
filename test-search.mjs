const ENV = {
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL,
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY
};

async function testSearch() {
  const baseUrl = ENV.forgeApiUrl.endsWith('/') ? ENV.forgeApiUrl : ENV.forgeApiUrl + '/';
  const fullUrl = new URL('webdevtoken.v1.WebDevService/CallApi', baseUrl).toString();
  
  console.log('Testing URL:', fullUrl);
  console.log('API Key present:', !!ENV.forgeApiKey);
  
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'connect-protocol-version': '1',
      authorization: 'Bearer ' + ENV.forgeApiKey,
    },
    body: JSON.stringify({
      apiId: 'BraveSearch/web_search',
      query: { q: 'silver price today January 2026', count: '5' },
    }),
  });
  
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2).slice(0, 3000));
}

testSearch().catch(e => console.error('Error:', e.message));
