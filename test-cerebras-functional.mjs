// Functional test for Cerebras API
const apiKey = process.env.CEREBRAS_API_KEY;

console.log('=== Cerebras API Functional Test ===');
console.log('API Key present:', !!apiKey);

if (!apiKey) {
  console.error('ERROR: CEREBRAS_API_KEY not set');
  process.exit(1);
}

async function testCerebras() {
  try {
    // Test 1: List models
    console.log('\n1. Testing models endpoint...');
    const modelsRes = await fetch('https://api.cerebras.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const models = await modelsRes.json();
    console.log('Available models:', models.data?.map(m => m.id).join(', ') || 'None');
    
    // Test 2: Chat completion with Llama 3.3 70B
    console.log('\n2. Testing chat completion with llama-3.3-70b...');
    const startTime = Date.now();
    const chatRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b',
        messages: [{ role: 'user', content: 'What is 2+2? Reply with just the number.' }],
        max_tokens: 10,
        temperature: 0
      })
    });
    const latency = Date.now() - startTime;
    const chatData = await chatRes.json();
    
    if (chatData.choices?.[0]?.message?.content) {
      console.log('SUCCESS: Chat completion working');
      console.log('Response:', chatData.choices[0].message.content);
      console.log('Latency:', latency + 'ms');
      console.log('Tokens used:', chatData.usage?.total_tokens || 'N/A');
    } else {
      console.log('ERROR:', JSON.stringify(chatData, null, 2));
    }
    
    // Test 3: Test Llama 3.1 8B (faster model)
    console.log('\n3. Testing chat completion with llama3.1-8b...');
    const start8b = Date.now();
    const chat8bRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: [{ role: 'user', content: 'Say hi' }],
        max_tokens: 10,
        temperature: 0
      })
    });
    const latency8b = Date.now() - start8b;
    const chat8bData = await chat8bRes.json();
    
    if (chat8bData.choices?.[0]?.message?.content) {
      console.log('SUCCESS: Llama 3.1 8B working');
      console.log('Response:', chat8bData.choices[0].message.content);
      console.log('Latency:', latency8b + 'ms');
    } else {
      console.log('ERROR:', JSON.stringify(chat8bData, null, 2));
    }
    
    console.log('\n=== All Cerebras tests completed ===');
    
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

testCerebras();
