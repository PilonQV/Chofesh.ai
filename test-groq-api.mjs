/**
 * Test script for Groq API integration
 * Tests direct API calls to verify the integration works
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY not found in environment");
  process.exit(1);
}

console.log("🧪 Testing Groq API Integration\n");

// Test 1: Llama 3.3 70B
async function testLlama33() {
  console.log("📝 Test 1: Llama 3.3 70B via Groq");
  
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: "What is 2+2? Answer in one word." }
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    console.log(`   ✅ Response: "${content}"`);
    console.log(`   ✅ Model: ${data.model}`);
    console.log(`   ✅ Tokens: ${data.usage?.total_tokens || 'N/A'}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Test 2: Gemma 2 9B
async function testGemma2() {
  console.log("\n📝 Test 2: Gemma 2 9B via Groq");
  
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma2-9b-it",
        messages: [
          { role: "user", content: "Name one planet in our solar system." }
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    console.log(`   ✅ Response: "${content}"`);
    console.log(`   ✅ Model: ${data.model}`);
    console.log(`   ✅ Tokens: ${data.usage?.total_tokens || 'N/A'}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Test 3: Mixtral 8x7B
async function testMixtral() {
  console.log("\n📝 Test 3: Mixtral 8x7B via Groq");
  
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "user", content: "What color is the sky? One word answer." }
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    console.log(`   ✅ Response: "${content}"`);
    console.log(`   ✅ Model: ${data.model}`);
    console.log(`   ✅ Tokens: ${data.usage?.total_tokens || 'N/A'}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = [];
  
  results.push(await testLlama33());
  results.push(await testGemma2());
  results.push(await testMixtral());
  
  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Results Summary");
  console.log("=".repeat(50));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`   Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log("\n✅ All Groq API tests passed!");
  } else {
    console.log(`\n⚠️  ${total - passed} test(s) failed`);
  }
}

runTests();
