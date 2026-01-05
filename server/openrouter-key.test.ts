import { describe, it, expect } from "vitest";

describe("OpenRouter API Key Validation", () => {
  it("should have a valid OpenRouter API key configured", async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    // Check that the key exists
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey?.length).toBeGreaterThan(10);
  });

  it("should be able to authenticate with OpenRouter API", async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.log("Skipping API test - no key configured");
      return;
    }

    // Test the key by checking account info (lightweight endpoint)
    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    // The key info endpoint returns data about the key
    expect(data).toBeDefined();
    console.log("OpenRouter API key validated successfully");
  });

  it("should be able to call Venice Uncensored model", async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.log("Skipping model test - no key configured");
      return;
    }

    // Make a minimal test call to Venice Uncensored
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://chofesh.ai",
        "X-Title": "Chofesh.ai",
      },
      body: JSON.stringify({
        model: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
        messages: [
          { role: "user", content: "Say 'test successful' in exactly two words." },
        ],
        max_tokens: 10,
      }),
    });

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.choices).toBeDefined();
    expect(data.choices.length).toBeGreaterThan(0);
    expect(data.choices[0].message.content).toBeDefined();
    
    console.log("Venice Uncensored model test response:", data.choices[0].message.content);
  }, 30000); // 30 second timeout for API call
});
