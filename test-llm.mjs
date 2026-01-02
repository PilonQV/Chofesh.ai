const apiUrl = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im';
const apiKey = process.env.BUILT_IN_FORGE_API_KEY;

console.log('API URL:', apiUrl);
console.log('API Key present:', !!apiKey);

const response = await fetch(apiUrl + '/v1/chat/completions', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'authorization': 'Bearer ' + apiKey
  },
  body: JSON.stringify({
    model: 'gemini-2.5-flash',
    messages: [{role: 'user', content: 'Say hello'}],
    max_tokens: 100
  })
});

const data = await response.json();
console.log('Response status:', response.status);
console.log('Response:', JSON.stringify(data, null, 2));
