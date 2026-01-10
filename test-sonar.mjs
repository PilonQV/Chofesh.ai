// Test Perplexity Sonar via OpenRouter

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
console.log('API Key present:', !!OPENROUTER_API_KEY);
console.log('Key prefix:', OPENROUTER_API_KEY.substring(0, 10) + '...');

async function testSonar() {
  console.log('\nTesting Perplexity Sonar via OpenRouter...\n');
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://chofesh.ai',
      'X-Title': 'Chofesh.ai',
    },
    body: JSON.stringify({
      model: 'perplexity/sonar',
      messages: [
        { role: 'user', content: 'What is the current silver price per ounce?' }
      ],
      temperature: 0.1,
      max_tokens: 512,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log('Error:', response.status, errorText);
    return;
  }
  
  const data = await response.json();
  console.log('Model used:', data.model);
  console.log('Response:', data.choices?.[0]?.message?.content);
}

testSonar().catch(console.error);
