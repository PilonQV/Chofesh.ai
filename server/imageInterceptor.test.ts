/**
 * Tests for Enhanced Image URL Interceptor
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { interceptAndGenerateImages } from "./_core/imageUrlInterceptorEnhanced";

// Mock dependencies
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    url: "https://cdn.example.com/stored-image.png",
  }),
}));

vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({
    url: "https://cdn.example.com/generated-image.png",
  }),
}));

describe("Enhanced Image URL Interceptor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should detect and replace fake OpenAI placeholder URLs", async () => {
    const input = `Here is a book:
![A beautiful sunset](https://api.openai.com/v1/images/abcd-1234)
More text here.`;

    const result = await interceptAndGenerateImages(input);

    expect(result).toContain("https://cdn.example.com/generated-image.png");
    expect(result).not.toContain("https://api.openai.com/v1/images/abcd-1234");
  });

  it("should handle multiple fake URLs in the same text", async () => {
    const input = `
![Image 1](https://api.openai.com/v1/images/abcd-1234)
Some text
![Image 2](https://api.openai.com/v1/images/efgh-5678)
`;

    const result = await interceptAndGenerateImages(input);

    expect(result).toContain("https://cdn.example.com/generated-image.png");
    expect(result).not.toContain("https://api.openai.com/v1/images/");
  });

  it("should preserve alt text when replacing URLs", async () => {
    const input = `![A beautiful sunset over mountains](https://api.openai.com/v1/images/abcd-1234)`;

    const result = await interceptAndGenerateImages(input);

    expect(result).toContain("![A beautiful sunset over mountains]");
  });

  it("should not modify text without image URLs", async () => {
    const input = "This is just plain text without any images.";

    const result = await interceptAndGenerateImages(input);

    expect(result).toBe(input);
  });

  it("should not modify permanent image URLs", async () => {
    const input = `![Permanent image](https://cdn.example.com/permanent.png)`;

    const result = await interceptAndGenerateImages(input);

    expect(result).toBe(input);
  });

  it("should handle mixed fake and permanent URLs", async () => {
    const input = `
![Fake URL](https://api.openai.com/v1/images/abcd-1234)
![Permanent URL](https://cdn.example.com/permanent.png)
`;

    const result = await interceptAndGenerateImages(input);

    expect(result).toContain("https://cdn.example.com/generated-image.png");
    expect(result).toContain("https://cdn.example.com/permanent.png");
    expect(result).not.toContain("https://api.openai.com/v1/images/");
  });

  it("should catch /v1/files/ URLs", async () => {
    const input = `![Generated image](https://api.openai.com/v1/files/image-23456)`;

    const result = await interceptAndGenerateImages(input);

    expect(result).toContain("https://cdn.example.com/generated-image.png");
    expect(result).not.toContain("https://api.openai.com/v1/files/");
  });

  it("should catch all OpenAI API URL patterns", async () => {
    const input = `
![Image 1](https://api.openai.com/v1/images/img-abc123)
![Image 2](https://api.openai.com/v1/files/image-23456)
![Image 3](https://api.openai.com/v1/anything/else)
`;

    const result = await interceptAndGenerateImages(input);

    expect(result).not.toContain("https://api.openai.com/");
    const matches = result.match(/https:\/\/cdn\.example\.com\/generated-image\.png/g);
    expect(matches).toHaveLength(3);
  });
});
