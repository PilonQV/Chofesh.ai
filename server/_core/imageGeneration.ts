/**
 * Image generation helper using Runware API
 *
 * Example usage:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 *
 * For editing:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "Add a rainbow to this landscape",
 *     originalImages: [{
 *       url: "https://example.com/original.jpg",
 *       mimeType: "image/jpeg"
 *     }]
 *   });
 */
import { storagePut } from "../storage";
import { ENV } from "./env";
import { randomUUID } from "crypto";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

/**
 * Generate image using Runware API (FLUX.2 [klein] 4B model)
 * - Model: runware:400@4
 * - Cost: $0.0019 per image (95% cheaper than previous)
 * - Includes automatic prompt enhancement
 */
async function generateImageRunware(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!ENV.runwareApiKey) {
    throw new Error("RUNWARE_API_KEY is not configured");
  }

  const taskUUID = randomUUID();
  const apiUrl = "https://api.runware.ai/v1";

  // Step 1: Enhance prompt if enabled (default: true)
  let enhancedPrompt = options.prompt;
  const shouldEnhancePrompt = true; // Can be made configurable
  
  if (shouldEnhancePrompt && options.prompt.length > 10) {
    try {
      const enhancePayload = {
        taskType: "promptEnhance",
        taskUUID: randomUUID(),
        prompt: options.prompt,
        promptVersions: 1,
      };
      
      const enhanceResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.runwareApiKey}`,
        },
        body: JSON.stringify([enhancePayload]),
      });
      
      if (enhanceResponse.ok) {
        const enhanceResult = await enhanceResponse.json();
        if (enhanceResult.data && enhanceResult.data.length > 0) {
          enhancedPrompt = enhanceResult.data[0].enhancedPrompt || options.prompt;
          console.log("[Image Generation] Prompt enhanced:", {
            original: options.prompt,
            enhanced: enhancedPrompt,
          });
        }
      }
    } catch (error) {
      console.warn("[Image Generation] Prompt enhancement failed, using original:", error);
      // Continue with original prompt if enhancement fails
    }
  }

  // Step 2: Prepare the image generation request payload
  const payload: any = {
    taskType: "imageInference",
    taskUUID,
    model: "runware:400@4", // FLUX.2 [klein] 4B - 95% cost reduction!
    positivePrompt: enhancedPrompt,
    width: 1024,
    height: 1024,
    steps: 4,
    numberResults: 1,
    includeCost: true, // Track costs
  };

  // If original images are provided, use image-to-image mode
  if (options.originalImages && options.originalImages.length > 0) {
    const originalImage = options.originalImages[0];
    if (originalImage.url) {
      payload.inputImage = originalImage.url;
    }
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.runwareApiKey}`,
    },
    body: JSON.stringify([payload]),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Runware image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = await response.json();

  // Check for errors in response
  if (result.errors && result.errors.length > 0) {
    const error = result.errors[0];
    throw new Error(
      `Runware API error: ${error.message || error.code || "Unknown error"}`
    );
  }

  // Extract image URL from response
  if (result.data && result.data.length > 0) {
    const imageData = result.data[0];
    if (imageData.imageURL) {
      // Download the image from Runware's temporary URL and upload to S3 for permanent storage
      try {
        console.log("[Image Generation] Downloading image from Runware:", imageData.imageURL);
        const imageResponse = await fetch(imageData.imageURL);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }
        
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const fileName = `generated/${Date.now()}-${randomUUID()}.png`;
        
        console.log("[Image Generation] Uploading to S3:", fileName);
        const { url: permanentUrl } = await storagePut(
          fileName,
          imageBuffer,
          "image/png"
        );
        
        console.log("[Image Generation] Image stored permanently:", permanentUrl);
        return {
          url: permanentUrl,
        };
      } catch (error) {
        console.error("[Image Generation] Failed to store image permanently:", error);
        // Fall back to temporary URL if storage fails
        return {
          url: imageData.imageURL,
        };
      }
    }
  }

  throw new Error("No image URL returned from Runware API");
}

/**
 * Generate image using legacy Forge API (fallback)
 */
async function generateImageForge(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  // Build the full URL by appending the service path to the base URL
  const baseUrl = ENV.forgeApiUrl.endsWith("/")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL(
    "images.v1.ImageService/GenerateImage",
    baseUrl
  ).toString();

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: options.originalImages || [],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    image: {
      b64Json: string;
      mimeType: string;
    };
  };
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, "base64");

  // Save to S3
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    result.image.mimeType
  );
  return {
    url,
  };
}

/**
 * Main image generation function with provider selection
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  // Use Runware if API key is configured, otherwise fall back to Forge
  const useRunware = !!ENV.runwareApiKey;

  try {
    if (useRunware) {
      console.log("[Image Generation] Using Runware API");
      return await generateImageRunware(options);
    } else {
      console.log("[Image Generation] Using Forge API (fallback)");
      return await generateImageForge(options);
    }
  } catch (error) {
    console.error(`[Image Generation] Error with ${useRunware ? "Runware" : "Forge"}:`, error);
    
    // If Runware fails and Forge is available, try falling back
    if (useRunware && ENV.forgeApiUrl && ENV.forgeApiKey) {
      console.log("[Image Generation] Falling back to Forge API");
      return await generateImageForge(options);
    }
    
    throw error;
  }
}
