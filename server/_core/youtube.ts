/**
 * YouTube Video Helper
 * Fetches video metadata and generates summaries
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
  viewCount?: string;
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
 * Fetch video information using YouTube Search API
 */
export async function getVideoInfo(videoId: string): Promise<YouTubeVideoInfo | null> {
  try {
    // Use search API to find the video by ID
    const result = await callDataApi("Youtube/search", {
      query: {
        q: videoId,
        hl: "en",
        gl: "US",
      },
    }) as any;

    // Find the exact video in search results
    const contents = result?.contents || [];
    for (const content of contents) {
      if (content?.type === 'video' && content?.video?.videoId === videoId) {
        const video = content.video;
        return {
          videoId,
          title: video.title || 'Unknown Title',
          description: video.descriptionSnippet || video.description || '',
          channelTitle: video.channelTitle || 'Unknown Channel',
          publishedAt: video.publishedTimeText || '',
          thumbnail: video.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          duration: video.lengthText || '',
          viewCount: video.viewCountText || '',
        };
      }
    }

    // If not found in search, return basic info with thumbnail
    return {
      videoId,
      title: 'YouTube Video',
      description: '',
      channelTitle: 'Unknown',
      publishedAt: '',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch (error) {
    console.error("Failed to fetch YouTube video info:", error);
    // Return basic info even on error
    return {
      videoId,
      title: 'YouTube Video',
      description: '',
      channelTitle: 'Unknown',
      publishedAt: '',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
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

  // Build content to summarize from available info
  const contentParts: string[] = [];
  if (videoInfo.title && videoInfo.title !== 'YouTube Video') {
    contentParts.push(`Title: ${videoInfo.title}`);
  }
  if (videoInfo.channelTitle && videoInfo.channelTitle !== 'Unknown') {
    contentParts.push(`Channel: ${videoInfo.channelTitle}`);
  }
  if (videoInfo.description) {
    contentParts.push(`Description: ${videoInfo.description}`);
  }
  if (videoInfo.viewCount) {
    contentParts.push(`Views: ${videoInfo.viewCount}`);
  }
  if (videoInfo.duration) {
    contentParts.push(`Duration: ${videoInfo.duration}`);
  }

  const contentToSummarize = contentParts.join('\n');

  if (!contentToSummarize || contentToSummarize.length < 20) {
    // Return basic info without summary if we don't have enough content
    return {
      videoInfo,
      summary: "Unable to generate summary - limited video information available. The video may be private, age-restricted, or the API couldn't retrieve its details.",
      keyPoints: [],
      topics: [],
    };
  }

  // Generate summary using LLM
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a video summarization assistant. Based on the available video information, provide:
1. A concise summary describing what this video is likely about
2. Key points that can be inferred from the title and description
3. Main topics covered

Note: You only have the title and description, not the full transcript. Make reasonable inferences but acknowledge limitations.

Respond in JSON format:
{
  "summary": "...",
  "keyPoints": ["point1", "point2", ...],
  "topics": ["topic1", "topic2", ...]
}`
        },
        {
          role: "user",
          content: `Please analyze this video information:\n\n${contentToSummarize}`
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
  } catch (error) {
    console.error("Failed to generate summary:", error);
    return {
      videoInfo,
      summary: "Failed to generate summary due to an error.",
      keyPoints: [],
      topics: [],
    };
  }
}
