/**
 * Groq Whisper V3 Turbo transcription helper
 * 64% cheaper than standard Whisper: $0.04 per hour vs $0.111 per hour
 */
import { TRPCError } from "@trpc/server";

export type GroqTranscribeOptions = {
  audioUrl: string;
  language?: string;
  prompt?: string;
  apiKey?: string;
};

export type GroqWhisperSegment = {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
};

export type GroqWhisperResponse = {
  task: "transcribe";
  language: string;
  duration: number;
  text: string;
  segments: GroqWhisperSegment[];
};

/**
 * Transcribe audio using Groq Whisper V3 Turbo
 */
export async function transcribeWithGroq(
  options: GroqTranscribeOptions
): Promise<GroqWhisperResponse | { error: string; code: string; details?: string }> {
  const apiKey = options.apiKey || process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    return {
      error: "Groq API key not configured",
      code: "MISSING_API_KEY",
    };
  }

  try {
    // Step 1: Download audio from URL
    const audioResponse = await fetch(options.audioUrl);
    if (!audioResponse.ok) {
      return {
        error: "Failed to download audio file",
        code: "DOWNLOAD_FAILED",
        details: `${audioResponse.status} ${audioResponse.statusText}`,
      };
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const mimeType = audioResponse.headers.get("content-type") || "audio/mpeg";

    // Step 2: Create FormData for Groq API
    const formData = new FormData();
    
    const filename = `audio.${getFileExtension(mimeType)}`;
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    formData.append("file", audioBlob, filename);
    
    // Use Whisper V3 Turbo model
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "verbose_json");
    
    if (options.language) {
      formData.append("language", options.language);
    }
    
    if (options.prompt) {
      formData.append("prompt", options.prompt);
    }

    // Step 3: Call Groq Whisper API
    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        error: "Groq Whisper transcription failed",
        code: "TRANSCRIPTION_FAILED",
        details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`,
      };
    }

    // Step 4: Parse and return result
    const result = await response.json() as GroqWhisperResponse;
    
    if (!result.text || typeof result.text !== 'string') {
      return {
        error: "Invalid transcription response",
        code: "SERVICE_ERROR",
        details: "Groq returned an invalid response format",
      };
    }

    return result;

  } catch (error) {
    return {
      error: "Voice transcription failed",
      code: "UNEXPECTED_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/x-wav": "wav",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/flac": "flac",
    "audio/m4a": "m4a",
    "audio/mp4": "m4a",
  };
  return mimeToExt[mimeType.toLowerCase()] || "mp3";
}
