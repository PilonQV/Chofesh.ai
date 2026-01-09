// Node 22 has native fetch
const videoId = 'u8KfUzV7_lU';

async function test() {
  const baseUrl = process.env.BUILT_IN_FORGE_API_URL;
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  
  console.log('API URL:', baseUrl ? 'Set' : 'Not set');
  console.log('API Key:', apiKey ? 'Set' : 'Not set');
  
  if (!baseUrl || !apiKey) {
    console.log('Missing env vars');
    return;
  }
  
  const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const fullUrl = url + 'webdevtoken.v1.WebDevService/CallApi';
  
  console.log('Calling:', fullUrl);
  
  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'connect-protocol-version': '1',
        authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        apiId: 'Youtube/videos',
        query: {
          part: 'snippet,contentDetails',
          id: videoId,
        },
      }),
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.slice(0, 1000));
    
    if (response.ok) {
      const json = JSON.parse(text);
      if (json.jsonData) {
        const data = JSON.parse(json.jsonData);
        console.log('\\nParsed data:', JSON.stringify(data, null, 2).slice(0, 500));
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
