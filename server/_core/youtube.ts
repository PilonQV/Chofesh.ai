/**
 * YouTube Video Helper
 * Fetches video metadata and transcripts for summarization
 */

import { callDataApi } from "./dataApi";
import { invokeLLM } from "./llm";

export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  duration?: string;
}

export interface YouTubeTranscript {
  text: string;
  segments: Array<{
    text: string;
    start: number;
    duration: number;
  }>;
}

export interface YouTubeSummary {
  videoInfo: YouTubeVideoInfo;
  summary: string;
  keyPoints: string[];
  topics: string[];
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Check if a message contains a YouTube URL
 */
export function containsYouTubeUrl(text: string): boolean {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(text);
}

/**
 * Fetch video information using YouTube Data API via Manus
 */
export async function getVideoInfo(videoId: string): Promise<YouTubeVideoInfo | null> {
  try {
    const result = await callDataApi("Youtube/videos", {
      query: {
        part: "snippet,contentDetails",
        id: videoId,
      },
    }) as any;

    if (!result?.items?.[0]) {
      return null;
    }

    const item = result.items[0];
    const snippet = item.snippet;

    return {
      videoId,
      title: snippet.title,
      description: snippet.description,
      channelTitle: snippet.channelTitle,
      publishedAt: snippet.publishedAt,
      thumbnail: snippet.thumbnails?.maxres?.url || 
                 snippet.thumbnails?.high?.url || 
                 snippet.thumbnails?.medium?.url ||
                 `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      duration: item.contentDetails?.duration,
    };
  } catch (error) {
    console.error("Failed to fetch YouTube video info:", error);
    return null;
  }
}

/**
 * Fetch video transcript/captions
 */
export async function getVideoTranscript(videoId: string): Promise<YouTubeTranscript | null> {
  try {
    // Try to get captions via YouTube API
    const result = await callDataApi("Youtube/captions", {
      query: {
        part: "snippet",
        videoId,
      },
    }) as any;

    // If captions available, try to download them
    if (result?.items?.length > 0) {
      // Find English captions or auto-generated
      const caption = result.items.find((c: any) => 
        c.snippet.language === 'en' || c.snippet.trackKind === 'asr'
      ) || result.items[0];

      if (caption) {
        // Download caption track
        const captionResult = await callDataApi("Youtube/captions/download", {
          pathParams: { id: caption.id },
          query: { tfmt: 'srt' },
        }) as any;

        if (captionResult) {
          return parseTranscript(captionResult);
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch YouTube transcript:", error);
    return null;
  }
}

/**
 * Parse SRT format transcript
 */
function parseTranscript(srtContent: string): YouTubeTranscript {
  const segments: Array<{ text: string; start: number; duration: number }> = [];
  const blocks = srtContent.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 3) {
      const timeLine = lines[1];
      const textLines = lines.slice(2).join(' ');
      
      const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (timeMatch) {
        const startSeconds = 
          parseInt(timeMatch[1]) * 3600 + 
          parseInt(timeMatch[2]) * 60 + 
          parseInt(timeMatch[3]) + 
          parseInt(timeMatch[4]) / 1000;
        
        const endSeconds = 
          parseInt(timeMatch[5]) * 3600 + 
          parseInt(timeMatch[6]) * 60 + 
          parseInt(timeMatch[7]) + 
          parseInt(timeMatch[8]) / 1000;

        segments.push({
          text: textLines.replace(/<[^>]*>/g, '').trim(),
          start: startSeconds,
          duration: endSeconds - startSeconds,
        });
      }
    }
  }

  return {
    text: segments.map(s => s.text).join(' '),
    segments,
  };
}

/**
 * Summarize a YouTube video
 */
export async function summarizeVideo(videoId: string): Promise<YouTubeSummary | null> {
  // Get video info
  const videoInfo = await getVideoInfo(videoId);
  if (!videoInfo) {
    return null;
  }

  // Try to get transcript
  const transcript = await getVideoTranscript(videoId);
  
  // Use description if no transcript available
  const contentToSummarize = transcript?.text || videoInfo.description;

  if (!contentToSummarize || contentToSummarize.length < 50) {
    // Return basic info without summary
    return {
      videoInfo,
      summary: "Unable to generate summary - no transcript or description available.",
      keyPoints: [],
      topics: [],
    };
  }

  // Generate summary using LLM
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a video summarization assistant. Analyze the following video content and provide:
1. A concise summary (2-3 paragraphs)
2. Key points (bullet points)
3. Main topics covered

Video Title: ${videoInfo.title}
Channel: ${videoInfo.channelTitle}

Respond in JSON format:
{
  "summary": "...",
  "keyPoints": ["point1", "point2", ...],
  "topics": ["topic1", "topic2", ...]
}`
      },
      {
        role: "user",
        content: `Please summarize this video content:\n\n${contentToSummarize.slice(0, 15000)}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "video_summary",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            keyPoints: { type: "array", items: { type: "string" } },
            topics: { type: "array", items: { type: "string" } },
          },
          required: ["summary", "keyPoints", "topics"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === 'string' ? rawContent : '';
  
  if (!content) {
    return {
      videoInfo,
      summary: "Failed to generate summary.",
      keyPoints: [],
      topics: [],
    };
  }

  try {
    const parsed = JSON.parse(content);
    return {
      videoInfo,
      summary: parsed.summary,
      keyPoints: parsed.keyPoints,
      topics: parsed.topics,
    };
  } catch {
    return {
      videoInfo,
      summary: content,
      keyPoints: [],
      topics: [],
    };
  }
}
