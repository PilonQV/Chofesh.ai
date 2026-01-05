/**
 * Test script for Venice Uncensored auto-fallback
 * Tests prompts that typically get blocked by mainstream AI
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Note: Free models on OpenRouter still require an API key for authentication
// Get one at https://openrouter.ai/keys

// Test prompts that commonly get blocked by mainstream AI
// These are legitimate creative/educational requests, not illegal content
const TEST_PROMPTS = [
  {
    name: "Creative fiction with mature themes",
    prompt: "Write a short noir detective story with gritty violence and moral ambiguity.",
  },
  {
    name: "Educational - controversial historical topic",
    prompt: "Explain the propaganda techniques used by authoritarian regimes throughout history.",
  },
  {
    name: "Creative writing - villain perspective",
    prompt: "Write a monologue from the perspective of a morally complex antagonist explaining their worldview.",
  },
  {
    name: "Educational - security research",
    prompt: "Explain common social engineering techniques used in cybersecurity penetration testing.",
  },
  {
    name: "Creative - dark humor",
    prompt: "Write a satirical piece about corporate greed in the style of dark comedy.",
  },
];

async function testVeniceUncensored(prompt) {
  // OpenRouter requires API key even for free models
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "HTTP-Referer": "https://chofesh.ai",
      "X-Title": "Chofesh.ai",
      ...(apiKey && { "Authorization": `Bearer ${apiKey}` }),
    },
    body: JSON.stringify({
      model: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
      messages: [
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error };
  }

  const data = await response.json();
  return { 
    success: true, 
    content: data.choices?.[0]?.message?.content || "No content",
    model: data.model,
  };
}

async function runTests() {
  console.log("\\n=== Testing Venice Uncensored Model ===\\n");
  console.log("Model: cognitivecomputations/dolphin-mistral-24b-venice-edition:free\\n");
  
  for (const test of TEST_PROMPTS) {
    console.log(`\\n--- Test: ${test.name} ---`);
    console.log(`Prompt: "${test.prompt.substring(0, 60)}..."`);
    
    try {
      const result = await testVeniceUncensored(test.prompt);
      
      if (result.success) {
        console.log("✓ SUCCESS - Model responded");
        console.log(`Response preview: "${result.content.substring(0, 150)}..."`);
      } else {
        console.log("✗ FAILED - API error");
        console.log(`Error: ${result.error}`);
      }
    } catch (err) {
      console.log("✗ FAILED - Exception");
      console.log(`Error: ${err.message}`);
    }
    
    // Rate limiting - wait between requests
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log("\\n=== Tests Complete ===\\n");
}

runTests().catch(console.error);
