/**
 * NSFW Content Detector
 * 
 * Detects when user queries require uncensored/adult content
 * to automatically trigger age verification flow
 */

export interface NSFWDetectionResult {
  isNSFW: boolean;
  confidence: 'high' | 'medium' | 'low';
  category?: 'explicit_chat' | 'adult_image' | 'mature_content';
}

/**
 * Detect if a query requires NSFW/uncensored content
 */
export function detectNSFWQuery(query: string): NSFWDetectionResult {
  const lowerQuery = query.toLowerCase();
  
  // High confidence NSFW keywords
  const explicitKeywords = [
    'nsfw', 'nude', 'naked', 'sex', 'porn', 'xxx', 'erotic', 'explicit',
    'adult content', 'uncensored', '18+', 'mature content'
  ];
  
  // Medium confidence - context-dependent
  const suggestiveKeywords = [
    'sexy', 'hot', 'intimate', 'sensual', 'provocative', 'risque'
  ];
  
  // Image generation NSFW indicators
  const imageNSFWKeywords = [
    'generate nude', 'create naked', 'draw nude', 'image of nude',
    'picture of naked', 'photo of nude'
  ];
  
  // Check for high confidence NSFW
  const hasExplicit = explicitKeywords.some(keyword => lowerQuery.includes(keyword));
  if (hasExplicit) {
    return {
      isNSFW: true,
      confidence: 'high',
      category: 'explicit_chat'
    };
  }
  
  // Check for NSFW image generation
  const hasImageNSFW = imageNSFWKeywords.some(keyword => lowerQuery.includes(keyword));
  if (hasImageNSFW) {
    return {
      isNSFW: true,
      confidence: 'high',
      category: 'adult_image'
    };
  }
  
  // Check for medium confidence suggestive content
  const hasSuggestive = suggestiveKeywords.some(keyword => lowerQuery.includes(keyword));
  if (hasSuggestive) {
    return {
      isNSFW: true,
      confidence: 'medium',
      category: 'mature_content'
    };
  }
  
  return {
    isNSFW: false,
    confidence: 'low'
  };
}

/**
 * Generate age verification prompt for users
 */
export function generateAgeVerificationPrompt(category?: string): string {
  const baseMessage = "This content requires age verification (18+).";
  
  switch (category) {
    case 'adult_image':
      return `${baseMessage} To generate adult/NSFW images, please verify your age. Go to **Settings > AI Settings** and enable **Uncensored Mode** after confirming you're 18+.`;
    case 'explicit_chat':
      return `${baseMessage} To access uncensored chat responses, please verify your age. Go to **Settings > AI Settings** and enable **Uncensored Mode** after confirming you're 18+.`;
    case 'mature_content':
      return `${baseMessage} To access mature content, please verify your age. Go to **Settings > AI Settings** and enable **Uncensored Mode** after confirming you're 18+.`;
    default:
      return `${baseMessage} Please verify your age in **Settings > AI Settings** to access uncensored features.`;
  }
}
