/**
 * Cerebras API Key Validation Tests
 */

import { describe, it, expect } from "vitest";

describe("Cerebras API Key Validation", () => {
  it("should have CEREBRAS_API_KEY environment variable set", () => {
    const apiKey = process.env.CEREBRAS_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey?.length).toBeGreaterThan(10);
  });

  it("should be able to authenticate with Cerebras API", async () => {
    const apiKey = process.env.CEREBRAS_API_KEY;
    
    if (!apiKey) {
      throw new Error("CEREBRAS_API_KEY not set");
    }

    // Test with a simple models list request
    const response = await fetch("https://api.cerebras.ai/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("should be able to call Llama 3.3 70B model", async () => {
    const apiKey = process.env.CEREBRAS_API_KEY;
    
    if (!apiKey) {
      throw new Error("CEREBRAS_API_KEY not set");
    }

    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b",
        messages: [
          { role: "user", content: "What is 2+2? Answer with just the number." }
        ],
        max_tokens: 10,
        temperature: 0,
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.choices).toBeDefined();
    expect(data.choices[0]?.message?.content).toBeDefined();
    console.log("Cerebras Llama 3.3 70B response:", data.choices[0]?.message?.content);
  });
});
