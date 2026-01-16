/**
 * Venice AI Video Generation Service
 * Handles text-to-video, image-to-video, and video-to-video generation
 * using the Venice AI API
 */

import { ENV } from "./env";

export interface VeniceVideoQueueRequest {
  model: string;
  prompt: string;
  duration?: "5s" | "10s";
  imageUrl?: string; // For image-to-video
  negativePrompt?: string;
  aspectRatio?: string;
  resolution?: "480p" | "720p" | "1080p";
  audio?: boolean;
  audioUrl?: string;
  videoUrl?: string; // For video-to-video
}

export interface VeniceVideoQueueResponse {
  model: string;
  queue_id: string;
}

export interface VeniceVideoRetrieveResponse {
  status: "pending" | "processing" | "completed" | "failed";
  video_url?: string;
  error?: string;
  progress?: number;
}

export interface VeniceVideoQuoteResponse {
  estimated_cost: number;
  currency: string;
  estimated_time_seconds: number;
}

const VENICE_API_BASE = "https://api.venice.ai/api/v1";

/**
 * Queue a video generation request
 */
export async function queueVideoGeneration(
  request: VeniceVideoQueueRequest
): Promise<VeniceVideoQueueResponse> {
  if (!ENV.veniceApiKey) {
    throw new Error("VENICE_API_KEY is not configured");
  }

  const body: any = {
    model: request.model,
    prompt: request.prompt,
    duration: request.duration || "10s",
    resolution: request.resolution || "720p",
    audio: request.audio !== false, // Default to true
  };

  // Add optional parameters
  if (request.imageUrl) {
    body.image_url = request.imageUrl;
  }
  if (request.negativePrompt) {
    body.negative_prompt = request.negativePrompt;
  }
  if (request.aspectRatio) {
    body.aspect_ratio = request.aspectRatio;
  }
  if (request.audioUrl) {
    body.audio_url = request.audioUrl;
  }
  if (request.videoUrl) {
    body.video_url = request.videoUrl;
  }

  const response = await fetch(`${VENICE_API_BASE}/video/queue`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.veniceApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Venice video queue failed (${response.status}): ${errorText}`
    );
  }

  return await response.json();
}

/**
 * Retrieve video generation status and result
 */
export async function retrieveVideo(
  queueId: string
): Promise<VeniceVideoRetrieveResponse> {
  if (!ENV.veniceApiKey) {
    throw new Error("VENICE_API_KEY is not configured");
  }

  const response = await fetch(`${VENICE_API_BASE}/video/retrieve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.veniceApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ queue_id: queueId }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Venice video retrieve failed (${response.status}): ${errorText}`
    );
  }

  return await response.json();
}

/**
 * Get a price quote for video generation
 */
export async function quoteVideoGeneration(
  request: VeniceVideoQueueRequest
): Promise<VeniceVideoQuoteResponse> {
  if (!ENV.veniceApiKey) {
    throw new Error("VENICE_API_KEY is not configured");
  }

  const body: any = {
    model: request.model,
    prompt: request.prompt,
    duration: request.duration || "10s",
    resolution: request.resolution || "720p",
  };

  if (request.imageUrl) {
    body.image_url = request.imageUrl;
  }

  const response = await fetch(`${VENICE_API_BASE}/video/quote`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.veniceApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Venice video quote failed (${response.status}): ${errorText}`
    );
  }

  return await response.json();
}

/**
 * Available Venice video models
 */
export const VENICE_VIDEO_MODELS = [
  {
    id: "wan-2.5-preview-image-to-video",
    name: "Wan 2.5 (Image to Video)",
    type: "image-to-video",
    description: "Convert static images into dynamic videos",
  },
] as const;

/**
 * Video generation durations
 */
export const VIDEO_DURATIONS = ["5s", "10s"] as const;

/**
 * Video resolutions
 */
export const VIDEO_RESOLUTIONS = ["480p", "720p", "1080p"] as const;

/**
 * Video aspect ratios
 */
export const VIDEO_ASPECT_RATIOS = [
  { id: "16:9", name: "Landscape (16:9)" },
  { id: "9:16", name: "Portrait (9:16)" },
  { id: "1:1", name: "Square (1:1)" },
  { id: "4:3", name: "Standard (4:3)" },
  { id: "21:9", name: "Ultrawide (21:9)" },
] as const;
