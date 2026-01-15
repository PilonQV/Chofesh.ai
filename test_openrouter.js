/**
 * OpenRouter Integration End-to-End Test
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function testOpenRouterAuth() {
  console.log("\n🔑 Testing OpenRouter Authentication...");
  
  if (!OPENROUTER_API_KEY) {
    console.log("❌ OPENROUTER_API_KEY not set");
    return false;
  }
  
  console.log(`✅ API Key found: ${OPENROUTER_API_KEY.substring(0, 10)}...${OPENROUTER_API_KEY.slice(-6)}`);
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Authentication successful");
      console.log(`   Account: ${JSON.stringify(data, null, 2)}`);
      return true;
    } else {
      console.log(`❌ Authentication failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Authentication error: ${error.message}`);
    return false;
  }
}

async function testModel(modelId, modelName, testPrompt = "Say 'Hello from Chofesh.ai!' in one sentence.") {
  console.log(`\n🤖 Testing ${modelName} (${modelId})...`);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chofesh.ai",
        "X-Title": "Chofesh.ai Test",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: testPrompt }],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Failed: ${response.status} - ${errorText.substring(0, 200)}`);
      return false;
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";
    const tokens = data.usage?.total_tokens || 0;
    
    console.log(`✅ Success (${duration}ms, ${tokens} tokens)`);
    console.log(`   Response: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  OpenRouter Integration End-to-End Test                 ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  
  // Test 1: Authentication
  const authSuccess = await testOpenRouterAuth();
  if (!authSuccess) {
    console.log("\n❌ Authentication failed. Cannot proceed with model tests.");
    process.exit(1);
  }
  
  // Test 2: Free Models
  console.log("\n\n📦 Testing Free Models...");
  
  const models = [
    { id: "deepseek/deepseek-r1-0528:free", name: "DeepSeek R1" },
    { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", name: "Venice Uncensored" },
    { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B" },
    { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B" },
    { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1" },
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const model of models) {
    const success = await testModel(model.id, model.name);
    if (success) successCount++;
    else failCount++;
    
    // Small delay between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test 3: Reasoning Query
  console.log("\n\n🧠 Testing Reasoning Query (DeepSeek R1)...");
  await testModel(
    "deepseek/deepseek-r1-0528:free",
    "DeepSeek R1 (Reasoning)",
    "What is 15 * 23? Show your calculation."
  );
  
  // Summary
  console.log("\n\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  Test Summary                                            ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Success Rate: ${((successCount / (successCount + failCount)) * 100).toFixed(1)}%`);
  
  if (failCount === 0) {
    console.log("\n🎉 All tests passed! OpenRouter integration is working perfectly.");
  } else if (successCount > 0) {
    console.log("\n⚠️  Some tests failed, but OpenRouter integration is partially working.");
  } else {
    console.log("\n❌ All tests failed. OpenRouter integration needs attention.");
  }
}

runTests().catch(console.error);
