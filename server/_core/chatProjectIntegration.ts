/**
 * Chat-Project Integration
 * 
 * Automatically detects and saves projects created in chat conversations
 */

import { runMalenaAgent } from "./malenaAgent";
import { isProjectCreationRequest, detectProjectType } from "../lib/projectDetector";

export interface ChatProjectResult {
  projectCreated: boolean;
  projectId?: string;
  projectType?: string;
  message: string;
}

/**
 * Check if a chat message is a project creation request and handle it
 */
export async function handleChatProjectCreation(
  userMessage: string,
  userId: number,
  conversationId: string
): Promise<ChatProjectResult | null> {
  // Check if this is a project creation request
  if (!isProjectCreationRequest(userMessage)) {
    return null;
  }

  const detection = detectProjectType(userMessage);
  
  if (detection.type === 'none' || detection.confidence < 0.4) {
    return null;
  }

  console.log(`[Chat-Project Integration] Detected ${detection.type} project request (confidence: ${detection.confidence})`);

  try {
    // Run Malena agent to create the project
    const result = await runMalenaAgent({
      userMessage,
      userId,
      conversationId,
      conversationHistory: [],
    });

    if (result.projectId) {
      return {
        projectCreated: true,
        projectId: result.projectId,
        projectType: result.taskType,
        message: `${result.answer}\n\n[View in My Projects](/projects/${result.projectId})`,
      };
    }

    return null;
  } catch (error) {
    console.error('[Chat-Project Integration] Error:', error);
    return null;
  }
}

/**
 * Add project creation detection to chat response
 * This can be called after the AI generates a response to check if it created a project
 */
export function detectProjectInResponse(aiResponse: string): {
  hasProject: boolean;
  projectType?: string;
} {
  // Check for common project creation patterns in AI responses
  const projectPatterns = [
    /created.*kids book/i,
    /generated.*website/i,
    /designed.*app/i,
    /created.*marketing campaign/i,
    /built.*business plan/i,
  ];

  for (const pattern of projectPatterns) {
    if (pattern.test(aiResponse)) {
      return {
        hasProject: true,
        projectType: pattern.source.match(/(kids book|website|app|marketing campaign|business plan)/i)?.[1],
      };
    }
  }

  return { hasProject: false };
}
