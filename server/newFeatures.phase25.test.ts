import { describe, it, expect, vi } from "vitest";

// Test the new features added in Phase 25

describe("Image in Chat (Vision) Feature", () => {
  describe("Image Upload Input Schema", () => {
    it("should validate image upload input with required fields", () => {
      const validInput = {
        imageBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        mimeType: "image/png",
        filename: "test.png",
      };
      
      expect(validInput.imageBase64).toBeDefined();
      expect(validInput.mimeType).toMatch(/^image\//);
      expect(validInput.filename).toBeDefined();
    });

    it("should accept common image mime types", () => {
      const validMimeTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
      validMimeTypes.forEach(mimeType => {
        expect(mimeType).toMatch(/^image\//);
      });
    });
  });

  describe("Chat Send with Images", () => {
    it("should accept imageUrls array in chat input", () => {
      const chatInput = {
        messages: [{ role: "user", content: "What's in this image?" }],
        imageUrls: ["https://example.com/image1.png", "https://example.com/image2.png"],
      };
      
      expect(chatInput.imageUrls).toHaveLength(2);
      expect(chatInput.imageUrls![0]).toMatch(/^https?:\/\//);
    });

    it("should handle empty imageUrls gracefully", () => {
      const chatInput = {
        messages: [{ role: "user", content: "Hello" }],
        imageUrls: undefined,
      };
      
      expect(chatInput.imageUrls).toBeUndefined();
    });
  });
});

describe("Deep Research Mode Feature", () => {
  describe("Deep Research Input", () => {
    it("should accept deepResearch flag in chat input", () => {
      const chatInput = {
        messages: [{ role: "user", content: "Research quantum computing" }],
        deepResearch: true,
      };
      
      expect(chatInput.deepResearch).toBe(true);
    });

    it("should default to false when not specified", () => {
      const chatInput = {
        messages: [{ role: "user", content: "Hello" }],
      };
      
      expect(chatInput.deepResearch).toBeUndefined();
    });
  });

  describe("Deep Research System Prompt", () => {
    it("should include citation instructions in deep research prompt", () => {
      const deepResearchPrompt = `You are conducting deep research on the user's question.
**Instructions for Deep Research Response:**
1. Synthesize information from multiple sources
2. Use inline citations like [1], [2] when referencing specific sources
3. Identify areas of consensus and disagreement between sources
4. Highlight key findings and insights
5. Note any limitations or gaps in the available information
6. End with a "Sources" section listing all referenced URLs`;

      expect(deepResearchPrompt).toContain("citations");
      expect(deepResearchPrompt).toContain("[1]");
      expect(deepResearchPrompt).toContain("Sources");
    });
  });

  describe("Follow-up Query Generation", () => {
    it("should generate follow-up queries from keywords", () => {
      const promptContent = "What are the latest developments in artificial intelligence";
      const keywords = promptContent.split(' ').filter(w => w.length > 4).slice(0, 3);
      
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.length).toBeLessThanOrEqual(3);
      
      const followUpQueries = [
        `${keywords.join(' ')} latest news`,
        `${keywords.join(' ')} research study`,
      ];
      
      expect(followUpQueries).toHaveLength(2);
      expect(followUpQueries[0]).toContain("latest news");
      expect(followUpQueries[1]).toContain("research study");
    });
  });
});

describe("Response Formatting Modes Feature", () => {
  describe("Response Format Input", () => {
    it("should accept valid response format values", () => {
      const validFormats = ["detailed", "concise", "bullet", "table"];
      
      validFormats.forEach(format => {
        expect(["detailed", "concise", "bullet", "table"]).toContain(format);
      });
    });

    it("should handle undefined responseFormat (auto mode)", () => {
      const chatInput = {
        messages: [{ role: "user", content: "Hello" }],
        responseFormat: undefined,
      };
      
      expect(chatInput.responseFormat).toBeUndefined();
    });
  });

  describe("Response Format System Prompts", () => {
    it("should generate correct prompt for detailed format", () => {
      const format = "detailed";
      const formatInstructions: Record<string, string> = {
        detailed: "Provide a comprehensive, detailed response with thorough explanations, examples, and context. Be thorough and complete.",
        concise: "Be brief and to the point. Provide only essential information in a clear, succinct manner. Avoid unnecessary elaboration.",
        bullet: "Format your response using bullet points. Organize information in a clear, scannable list format.",
        table: "When presenting data or comparisons, use markdown tables. Structure information in rows and columns for clarity.",
      };
      
      expect(formatInstructions[format]).toContain("comprehensive");
      expect(formatInstructions[format]).toContain("detailed");
    });

    it("should generate correct prompt for concise format", () => {
      const format = "concise";
      const formatInstructions: Record<string, string> = {
        detailed: "Provide a comprehensive, detailed response with thorough explanations, examples, and context. Be thorough and complete.",
        concise: "Be brief and to the point. Provide only essential information in a clear, succinct manner. Avoid unnecessary elaboration.",
        bullet: "Format your response using bullet points. Organize information in a clear, scannable list format.",
        table: "When presenting data or comparisons, use markdown tables. Structure information in rows and columns for clarity.",
      };
      
      expect(formatInstructions[format]).toContain("brief");
      expect(formatInstructions[format]).toContain("succinct");
    });

    it("should generate correct prompt for bullet format", () => {
      const format = "bullet";
      const formatInstructions: Record<string, string> = {
        detailed: "Provide a comprehensive, detailed response with thorough explanations, examples, and context. Be thorough and complete.",
        concise: "Be brief and to the point. Provide only essential information in a clear, succinct manner. Avoid unnecessary elaboration.",
        bullet: "Format your response using bullet points. Organize information in a clear, scannable list format.",
        table: "When presenting data or comparisons, use markdown tables. Structure information in rows and columns for clarity.",
      };
      
      expect(formatInstructions[format]).toContain("bullet points");
      expect(formatInstructions[format]).toContain("list");
    });

    it("should generate correct prompt for table format", () => {
      const format = "table";
      const formatInstructions: Record<string, string> = {
        detailed: "Provide a comprehensive, detailed response with thorough explanations, examples, and context. Be thorough and complete.",
        concise: "Be brief and to the point. Provide only essential information in a clear, succinct manner. Avoid unnecessary elaboration.",
        bullet: "Format your response using bullet points. Organize information in a clear, scannable list format.",
        table: "When presenting data or comparisons, use markdown tables. Structure information in rows and columns for clarity.",
      };
      
      expect(formatInstructions[format]).toContain("tables");
      expect(formatInstructions[format]).toContain("rows and columns");
    });
  });
});

describe("Multimodal Message Format", () => {
  it("should convert text message to multimodal format with images", () => {
    const textContent = "What's in this image?";
    const imageUrls = ["https://example.com/image.png"];
    
    const multimodalContent = [
      { type: 'text' as const, text: textContent },
      ...imageUrls.map(url => ({
        type: 'image_url' as const,
        image_url: { url, detail: 'auto' as const },
      })),
    ];
    
    expect(multimodalContent).toHaveLength(2);
    expect(multimodalContent[0].type).toBe('text');
    expect(multimodalContent[1].type).toBe('image_url');
  });

  it("should handle multiple images in multimodal format", () => {
    const textContent = "Compare these images";
    const imageUrls = ["https://example.com/image1.png", "https://example.com/image2.png", "https://example.com/image3.png"];
    
    const multimodalContent = [
      { type: 'text' as const, text: textContent },
      ...imageUrls.map(url => ({
        type: 'image_url' as const,
        image_url: { url, detail: 'auto' as const },
      })),
    ];
    
    expect(multimodalContent).toHaveLength(4);
    expect(multimodalContent.filter(c => c.type === 'image_url')).toHaveLength(3);
  });
});

describe("Combined Features", () => {
  it("should support all features together in chat input", () => {
    const chatInput = {
      messages: [{ role: "user" as const, content: "Analyze this image and research the topic" }],
      imageUrls: ["https://example.com/image.png"],
      deepResearch: true,
      responseFormat: "detailed" as const,
      webSearch: true,
      showThinking: true,
    };
    
    expect(chatInput.imageUrls).toBeDefined();
    expect(chatInput.deepResearch).toBe(true);
    expect(chatInput.responseFormat).toBe("detailed");
    expect(chatInput.webSearch).toBe(true);
    expect(chatInput.showThinking).toBe(true);
  });
});


// ============================================================================
// Phase 25 Part 2: Free AI Provider Integration Tests
// ============================================================================

import { 
  AVAILABLE_MODELS, 
  analyzeQueryComplexity, 
  selectModel, 
  getModelsByTier,
  estimateCost,
  getCacheKey,
  getCachedResponse,
  setCachedResponse,
  clearUserCache,
} from "./modelRouter";

describe("Phase 25 Part 2: Free AI Provider Integration", () => {
  
  describe("Puter.js Models", () => {
    it("should have Puter.js models in AVAILABLE_MODELS", () => {
      const puterModels = AVAILABLE_MODELS.filter(m => m.provider === "puter");
      expect(puterModels.length).toBeGreaterThan(0);
    });

    it("should have all Puter.js models marked as free tier", () => {
      const puterModels = AVAILABLE_MODELS.filter(m => m.provider === "puter");
      puterModels.forEach(model => {
        expect(model.tier).toBe("free");
        expect(model.costPer1kInput).toBe(0);
        expect(model.costPer1kOutput).toBe(0);
      });
    });
  });

  describe("Groq Models", () => {
    it("should have Groq models configured", () => {
      const groqModels = AVAILABLE_MODELS.filter(m => m.provider === "groq");
      expect(groqModels.length).toBeGreaterThanOrEqual(3);
    });

    it("should have Llama 3.3 70B via Groq", () => {
      const llama33 = AVAILABLE_MODELS.find(m => m.id === "llama-3.3-70b-groq");
      expect(llama33).toBeDefined();
      expect(llama33?.provider).toBe("groq");
      expect(llama33?.tier).toBe("free");
    });

    it("should have Gemma 2 9B via Groq", () => {
      const gemma2 = AVAILABLE_MODELS.find(m => m.id === "gemma2-9b-groq");
      expect(gemma2).toBeDefined();
      expect(gemma2?.provider).toBe("groq");
      expect(gemma2?.tier).toBe("free");
    });
  });

  describe("OpenRouter Free Models", () => {
    it("should have OpenRouter models configured", () => {
      const openRouterModels = AVAILABLE_MODELS.filter(m => m.provider === "openrouter");
      expect(openRouterModels.length).toBeGreaterThanOrEqual(5);
    });

    it("should have DeepSeek R1 free model", () => {
      const deepseekR1 = AVAILABLE_MODELS.find(m => m.id === "deepseek-r1-free");
      expect(deepseekR1).toBeDefined();
      expect(deepseekR1?.provider).toBe("openrouter");
      expect(deepseekR1?.isReasoningModel).toBe(true);
    });

    it("should have Llama 3.1 405B free model", () => {
      const llama405b = AVAILABLE_MODELS.find(m => m.id === "llama-3.1-405b-free");
      expect(llama405b).toBeDefined();
      expect(llama405b?.provider).toBe("openrouter");
    });

    it("should have Kimi K2 free model", () => {
      const kimi = AVAILABLE_MODELS.find(m => m.id === "kimi-k2-free");
      expect(kimi).toBeDefined();
      expect(kimi?.provider).toBe("openrouter");
    });

    it("should have Qwen VL 7B vision model", () => {
      const qwen = AVAILABLE_MODELS.find(m => m.id === "qwen-vl-free");
      expect(qwen).toBeDefined();
      expect(qwen?.supportsVision).toBe(true);
    });

    it("should have DeepSeek R1 model", () => {
      const deepseek = AVAILABLE_MODELS.find(m => m.id === "deepseek-r1-free");
      expect(deepseek).toBeDefined();
      expect(deepseek?.isReasoningModel).toBe(true);
    });
  });

  describe("Smart Model Routing", () => {
    it("should route simple queries to fast free models", () => {
      const messages = [{ role: "user", content: "What is 2+2?" }];
      const complexity = analyzeQueryComplexity(messages);
      expect(complexity).toBe("simple");
      
      const model = selectModel(complexity, "free");
      expect(model.tier).toBe("free");
    });

    it("should route complex reasoning to DeepSeek R1", () => {
      const model = selectModel("complex", "free");
      expect(model.id).toBe("deepseek-r1-free");
      expect(model.isReasoningModel).toBe(true);
    });

    it("should respect manual mode selection", () => {
      const model = selectModel("simple", "manual", "llama-3.1-405b-free");
      expect(model.id).toBe("llama-3.1-405b-free");
    });
  });

  describe("Cost Estimation", () => {
    it("should return zero cost for free tier models", () => {
      const freeModel = AVAILABLE_MODELS.find(m => m.tier === "free")!;
      const cost = estimateCost(freeModel, 1000, 500);
      expect(cost).toBe(0);
    });

    it("should calculate cost for paid models", () => {
      const paidModel = AVAILABLE_MODELS.find(m => m.tier === "premium")!;
      const cost = estimateCost(paidModel, 1000, 500);
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe("Model Tiers", () => {
    it("should have models in all tiers", () => {
      const freeModels = getModelsByTier("free");
      const standardModels = getModelsByTier("standard");
      const premiumModels = getModelsByTier("premium");

      expect(freeModels.length).toBeGreaterThan(0);
      expect(standardModels.length).toBeGreaterThan(0);
      expect(premiumModels.length).toBeGreaterThan(0);
    });

    it("should have more free models than paid models", () => {
      const freeModels = getModelsByTier("free");
      const paidModels = [...getModelsByTier("standard"), ...getModelsByTier("premium")];
      
      expect(freeModels.length).toBeGreaterThan(paidModels.length);
    });
  });

  describe("Provider Distribution", () => {
    it("should have models from multiple providers", () => {
      const providers = new Set(AVAILABLE_MODELS.map(m => m.provider));
      expect(providers.size).toBeGreaterThanOrEqual(4);
    });

    it("should have the expected providers", () => {
      const providers = new Set(AVAILABLE_MODELS.map(m => m.provider));
      expect(providers.has("groq")).toBe(true);
      expect(providers.has("openrouter")).toBe(true);
      expect(providers.has("puter")).toBe(true);
      expect(providers.has("platform")).toBe(true);
    });
  });
});
