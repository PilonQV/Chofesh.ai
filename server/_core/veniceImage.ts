/**
 * Venice AI Image Generation Helper for NSFW/Uncensored Images
 * 
 * Venice provides uncensored image models (Lustify SDXL, Lustify v7)
 * that can generate adult content when moderation is set to "low".
 * 
 * Example usage:
 *   const { url, b64Json } = await generateVeniceImage({
 *     prompt: "Your prompt here",
 *     model: "lustify-sdxl",
 *     nsfw: true
 *   });
 */

import { storagePut } from "../storage";
import { ENV } from "./env";

// Venice API base URL
const VENICE_API_URL = "https://api.venice.ai/api/v1/images/generations";

// Available Venice image models
export const VENICE_IMAGE_MODELS = {
  // NSFW/Uncensored models
  LUSTIFY_SDXL: "lustify-sdxl",
  LUSTIFY_V7: "lustify-v7",
  VENICE_SD35: "venice-sd35",
  // Standard models
  HIDREAM: "hidream",
  FLUX_2_PRO: "flux-2-pro",
  FLUX_2_MAX: "flux-2-max",
  SEEDREAM_V4: "seedream-v4",
  QWEN_IMAGE: "qwen-image",
  ANIME_WAI: "wai-Illustrious",
  Z_IMAGE_TURBO: "z-image-turbo",
} as const;

export type VeniceImageModel = typeof VENICE_IMAGE_MODELS[keyof typeof VENICE_IMAGE_MODELS];

// Available image sizes
export const VENICE_IMAGE_SIZES = [
  "256x256",
  "512x512", 
  "1024x1024",
  "1536x1024",
  "1024x1536",
  "1792x1024",
  "1024x1792",
] as const;

export type VeniceImageSize = typeof VENICE_IMAGE_SIZES[number];

export type VeniceImageOptions = {
  prompt: string;
  model?: VeniceImageModel;
  size?: VeniceImageSize;
  nsfw?: boolean; // If true, uses low moderation
  outputFormat?: "png" | "jpeg" | "webp";
  negativePrompt?: string;
};

export type VeniceImageResponse = {
  url: string;
  b64Json?: string;
  model: string;
  size: string;
  isNsfw: boolean;
};

/**
 * Generate an image using Venice AI API
 * 
 * @param options - Image generation options
 * @returns Generated image URL and metadata
 */
export async function generateVeniceImage(
  options: VeniceImageOptions
): Promise<VeniceImageResponse> {
  const apiKey = ENV.veniceApiKey;
  
  // Debug logging for production troubleshooting
  console.log(`[Venice] API Key configured: ${!!apiKey}, length: ${apiKey?.length || 0}`);
  
  if (!apiKey) {
    console.error("[Venice] ERROR: VENICE_API_KEY is not set in environment variables");
    throw new Error("VENICE_API_KEY is not configured. Please add your Venice API key in Settings.");
  }

  const {
    prompt,
    model = VENICE_IMAGE_MODELS.LUSTIFY_SDXL,
    size = "1024x1024",
    nsfw = false,
    outputFormat = "png",
    negativePrompt,
  } = options;

  // Validate prompt
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt is required for image generation");
  }

  if (prompt.length > 1500) {
    throw new Error("Prompt must be 1500 characters or less");
  }

  // Build the full prompt with negative prompt if provided
  let fullPrompt = prompt;
  if (negativePrompt) {
    // Some models support negative prompts in the prompt itself
    fullPrompt = `${prompt}. Avoid: ${negativePrompt}`;
  }

  // Build request body
  const requestBody = {
    prompt: fullPrompt,
    model,
    moderation: nsfw ? "low" : "auto", // "low" disables content filtering
    size,
    response_format: "b64_json",
    output_format: outputFormat,
    n: 1,
  };

  console.log(`[Venice] Generating image with model: ${model}, nsfw: ${nsfw}`);

  const response = await fetch(VENICE_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    
    // Handle specific error codes
    if (response.status === 401) {
      throw new Error("Invalid Venice API key. Please check your API key in Settings.");
    }
    if (response.status === 402) {
      throw new Error("Insufficient Venice credits. Please add credits to your Venice account.");
    }
    if (response.status === 429) {
      throw new Error("Venice rate limit exceeded. Please try again later.");
    }
    
    throw new Error(
      `Venice image generation failed (${response.status}): ${errorText || response.statusText}`
    );
  }

  const result = await response.json() as {
    created: number;
    data: Array<{ b64_json?: string; url?: string }>;
  };

  if (!result.data || result.data.length === 0) {
    throw new Error("Venice returned no image data");
  }

  const imageData = result.data[0];
  
  if (!imageData.b64_json) {
    throw new Error("Venice returned no base64 image data");
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(imageData.b64_json, "base64");

  // Determine MIME type
  const mimeType = outputFormat === "jpeg" ? "image/jpeg" 
    : outputFormat === "webp" ? "image/webp" 
    : "image/png";

  // Generate unique filename with random suffix
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = outputFormat;
  const filename = `venice/${nsfw ? "nsfw" : "sfw"}/${timestamp}-${randomSuffix}.${extension}`;

  // Save to S3
  const { url } = await storagePut(filename, buffer, mimeType);

  console.log(`[Venice] Image generated successfully: ${url}`);

  return {
    url,
    b64Json: imageData.b64_json,
    model,
    size,
    isNsfw: nsfw,
  };
}

/**
 * Check if a model is an NSFW/uncensored model
 */
export function isNsfwModel(model: string): boolean {
  const nsfwModels: string[] = [
    VENICE_IMAGE_MODELS.LUSTIFY_SDXL,
    VENICE_IMAGE_MODELS.LUSTIFY_V7,
  ];
  return nsfwModels.includes(model);
}

/**
 * Get model pricing in USD
 */
export function getModelPrice(model: string): number {
  const pricing: Record<string, number> = {
    [VENICE_IMAGE_MODELS.LUSTIFY_SDXL]: 0.01,
    [VENICE_IMAGE_MODELS.LUSTIFY_V7]: 0.01,
    [VENICE_IMAGE_MODELS.VENICE_SD35]: 0.01,
    [VENICE_IMAGE_MODELS.HIDREAM]: 0.01,
    [VENICE_IMAGE_MODELS.FLUX_2_PRO]: 0.04,
    [VENICE_IMAGE_MODELS.FLUX_2_MAX]: 0.09,
    [VENICE_IMAGE_MODELS.SEEDREAM_V4]: 0.05,
    [VENICE_IMAGE_MODELS.QWEN_IMAGE]: 0.01,
    [VENICE_IMAGE_MODELS.ANIME_WAI]: 0.01,
    [VENICE_IMAGE_MODELS.Z_IMAGE_TURBO]: 0.01,
  };
  return pricing[model] ?? 0.01;
}
