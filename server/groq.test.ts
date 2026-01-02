import { describe, expect, it } from "vitest";

describe("Groq API Key Validation", () => {
  it("should have GROQ_API_KEY environment variable set", () => {
    const apiKey = process.env.GROQ_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey?.length).toBeGreaterThan(10);
  });

  it("should be able to connect to Groq API", async () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY not set");
    }

    // Test with a minimal API call to list models
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
    
    // Verify Llama models are available
    const modelIds = data.data.map((m: any) => m.id);
    const hasLlamaModel = modelIds.some((id: string) => 
      id.includes("llama") || id.includes("mixtral")
    );
    expect(hasLlamaModel).toBe(true);
  });
});
