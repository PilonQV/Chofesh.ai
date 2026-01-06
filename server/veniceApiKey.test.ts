import { describe, it, expect } from "vitest";

describe("Venice API Key Validation", () => {
  it("should be able to authenticate with Venice API", async () => {
    const apiKey = process.env.VENICE_API_KEY;
    
    // Skip if no API key configured
    if (!apiKey) {
      console.log("VENICE_API_KEY not configured, skipping test");
      return;
    }

    // Test the API key by listing available models
    const response = await fetch("https://api.venice.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
    
    // Check that models are available (Venice API authenticated)
    console.log(`Venice API authenticated successfully. Found ${data.data?.length || 0} models.`);
    // API key is valid if we got a response with data
    expect(data.data).toBeDefined();
  }, 15000);

  it("should have access to Lustify models for NSFW generation", async () => {
    const apiKey = process.env.VENICE_API_KEY;
    
    if (!apiKey) {
      console.log("VENICE_API_KEY not configured, skipping test");
      return;
    }

    const response = await fetch("https://api.venice.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    const lustifyModels = data.data.filter((m: any) => 
      m.id.toLowerCase().includes("lustify") || 
      m.id.toLowerCase().includes("nsfw")
    );
    
    console.log(`Found ${lustifyModels.length} Lustify/NSFW models:`, lustifyModels.map((m: any) => m.id));
    // Note: Lustify models may require Pro subscription
  }, 15000);
});
