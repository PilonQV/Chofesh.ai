/**
 * Test script for the 5 new free OpenRouter models
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const NEW_MODELS = [
  { id: "xiaomi/mimo-v2-flash:free", name: "Xiaomi MiMo-V2-Flash", testPrompt: "Write a simple Python function to calculate factorial." },
  { id: "mistralai/devstral-2-2512:free", name: "Mistral Devstral 2", testPrompt: "Debug this code: def add(a,b): return a+b+1" },
  { id: "tngtech/deepseek-r1t2-chimera:free", name: "TNG DeepSeek R1T2 Chimera", testPrompt: "What is 47 * 89? Show your reasoning." },
  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash Exp", testPrompt: "Explain quantum computing in one sentence." },
  { id: "qwen/qwen3-coder-480b-a35b:free", name: "Qwen3 Coder 480B", testPrompt: "Write a React component for a button." },
];

async function testModel(modelId, modelName, testPrompt) {
  console.log(`\nTesting ${modelName}...`);
  console.log(`Model ID: ${modelId}`);
  console.log(`Prompt: ${testPrompt}`);
  
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
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`FAIL: ${response.status} - ${errorText.substring(0, 300)}`);
      return { success: false, error: `${response.status}: ${errorText.substring(0, 100)}` };
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";
    const tokens = data.usage?.total_tokens || 0;
    
    console.log(`PASS: Response received in ${duration}ms`);
    console.log(`Tokens: ${tokens}`);
    console.log(`Response preview: ${content.substring(0, 150)}...`);
    
    return { success: true, duration, tokens, contentLength: content.length };
  } catch (error) {
    console.log(`FAIL: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log("=".repeat(70));
  console.log("  Testing 5 New Free OpenRouter Models");
  console.log("=".repeat(70));
  
  if (!OPENROUTER_API_KEY) {
    console.log("\nERROR: OPENROUTER_API_KEY not set");
    console.log("Please set it in your environment variables");
    process.exit(1);
  }
  
  console.log(`\nAPI Key: ${OPENROUTER_API_KEY.substring(0, 10)}...${OPENROUTER_API_KEY.slice(-6)}`);
  
  const results = [];
  
  for (const model of NEW_MODELS) {
    const result = await testModel(model.id, model.name, model.testPrompt);
    results.push({ ...model, ...result });
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log("\n\n" + "=".repeat(70));
  console.log("  Test Summary");
  console.log("=".repeat(70));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\nTotal Models Tested: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Success Rate: ${((successful.length / results.length) * 100).toFixed(1)}%`);
  
  if (successful.length > 0) {
    console.log("\n✓ Successful Models:");
    successful.forEach(r => {
      console.log(`  - ${r.name}: ${r.duration}ms, ${r.tokens} tokens`);
    });
  }
  
  if (failed.length > 0) {
    console.log("\n✗ Failed Models:");
    failed.forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  if (failed.length === 0) {
    console.log("\n🎉 SUCCESS: All 5 new models are working perfectly!");
    console.log("Ready to deploy to production.");
  } else if (successful.length > 0) {
    console.log("\n⚠️  WARNING: Some models failed but others are working.");
    console.log("Review failed models before deploying.");
  } else {
    console.log("\n❌ FAILURE: All models failed.");
    console.log("Check API key and OpenRouter service status.");
  }
}

runTests().catch(console.error);
