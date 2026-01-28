/**
 * Project Type Detector
 * 
 * Analyzes user input to determine what type of project they want to create.
 * Supports: Kids Book, Website, App, Marketing Campaign, Business Plan
 */

export type ProjectType = 
  | 'kids_book'
  | 'website'
  | 'app'
  | 'marketing_campaign'
  | 'business_plan'
  | 'none';

export interface ProjectDetectionResult {
  type: ProjectType;
  confidence: number;
  reasoning: string;
  extractedInfo: Record<string, any>;
}

/**
 * Keywords and patterns for each project type
 */
const PROJECT_PATTERNS = {
  kids_book: {
    keywords: [
      'kids book', 'children book', 'story book', 'picture book',
      'bedtime story', 'fairy tale', 'children story', 'illustrated book',
      'storybook', 'book for kids', 'book for children'
    ],
    patterns: [
      /create.*book.*kid/i,
      /write.*children.*book/i,
      /illustrat.*story/i,
      /book.*\d+.*pages/i,
    ]
  },
  website: {
    keywords: [
      'website', 'web site', 'landing page', 'web page', 'homepage',
      'portfolio site', 'business site', 'company website', 'blog',
      'ecommerce', 'online store', 'web app'
    ],
    patterns: [
      /build.*website/i,
      /create.*landing.*page/i,
      /design.*website/i,
      /need.*website.*for/i,
    ]
  },
  app: {
    keywords: [
      'mobile app', 'app idea', 'application', 'ios app', 'android app',
      'app design', 'app concept', 'software', 'saas', 'platform'
    ],
    patterns: [
      /build.*app/i,
      /create.*application/i,
      /app.*for.*(ios|android|mobile)/i,
      /design.*app/i,
    ]
  },
  marketing_campaign: {
    keywords: [
      'marketing campaign', 'ad campaign', 'social media campaign',
      'marketing strategy', 'advertising', 'promotion', 'brand campaign',
      'launch campaign', 'marketing plan', 'content strategy'
    ],
    patterns: [
      /marketing.*campaign/i,
      /social.*media.*strategy/i,
      /launch.*product/i,
      /promote.*business/i,
    ]
  },
  business_plan: {
    keywords: [
      'business plan', 'startup plan', 'business proposal',
      'pitch deck', 'investor pitch', 'business model',
      'financial projections', 'market analysis'
    ],
    patterns: [
      /business.*plan/i,
      /pitch.*deck/i,
      /startup.*plan/i,
      /investor.*pitch/i,
    ]
  }
};

/**
 * Detect project type from user message
 */
export function detectProjectType(message: string): ProjectDetectionResult {
  const lowerMessage = message.toLowerCase();
  const scores: Record<ProjectType, number> = {
    kids_book: 0,
    website: 0,
    app: 0,
    marketing_campaign: 0,
    business_plan: 0,
    none: 0
  };

  // Score each project type based on keywords and patterns
  for (const [type, config] of Object.entries(PROJECT_PATTERNS)) {
    const projectType = type as Exclude<ProjectType, 'none'>;
    
    // Check keywords
    for (const keyword of config.keywords) {
      if (lowerMessage.includes(keyword)) {
        scores[projectType] += 2;
      }
    }
    
    // Check patterns
    for (const pattern of config.patterns) {
      if (pattern.test(message)) {
        scores[projectType] += 3;
      }
    }
  }

  // Find highest scoring type
  const entries = Object.entries(scores) as [ProjectType, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [topType, topScore] = sorted[0];

  // If no clear match, return 'none'
  if (topScore === 0) {
    return {
      type: 'none',
      confidence: 0,
      reasoning: 'No project type detected in message',
      extractedInfo: {}
    };
  }

  // Calculate confidence (0-1)
  const confidence = Math.min(topScore / 10, 1);

  // Extract relevant info based on type
  const extractedInfo = extractProjectInfo(topType, message);

  return {
    type: topType,
    confidence,
    reasoning: `Detected ${topType.replace('_', ' ')} project with ${topScore} matching signals`,
    extractedInfo
  };
}

/**
 * Extract specific information based on project type
 */
function extractProjectInfo(type: ProjectType, message: string): Record<string, any> {
  const info: Record<string, any> = {};

  switch (type) {
    case 'kids_book':
      // Extract age range
      const ageMatch = message.match(/(\d+)[-\s]?(?:to|-)[-\s]?(\d+)[-\s]?(?:year|yr)/i);
      if (ageMatch) {
        info.ageRange = `${ageMatch[1]}-${ageMatch[2]}`;
      }
      
      // Extract page count
      const pageMatch = message.match(/(\d+)[-\s]?pages?/i);
      if (pageMatch) {
        info.pageCount = parseInt(pageMatch[1]);
      }
      
      // Extract theme/topic
      const aboutMatch = message.match(/about\s+([^.,!?]+)/i);
      if (aboutMatch) {
        info.theme = aboutMatch[1].trim();
      }
      break;

    case 'website':
      // Extract website type
      if (/portfolio/i.test(message)) info.websiteType = 'portfolio';
      else if (/ecommerce|store|shop/i.test(message)) info.websiteType = 'ecommerce';
      else if (/blog/i.test(message)) info.websiteType = 'blog';
      else if (/landing/i.test(message)) info.websiteType = 'landing';
      else info.websiteType = 'business';
      
      // Extract business type
      const forMatch = message.match(/(?:for|website for)\s+(?:a|an|my)?\s*([^.,!?]+)/i);
      if (forMatch) {
        info.businessType = forMatch[1].trim();
      }
      break;

    case 'app':
      // Extract platform
      if (/ios/i.test(message)) info.platform = 'ios';
      else if (/android/i.test(message)) info.platform = 'android';
      else if (/web/i.test(message)) info.platform = 'web';
      else info.platform = 'mobile';
      
      // Extract app category
      if (/social/i.test(message)) info.category = 'social';
      else if (/fitness|health/i.test(message)) info.category = 'health';
      else if (/game/i.test(message)) info.category = 'game';
      else if (/productivity/i.test(message)) info.category = 'productivity';
      else if (/ecommerce|shopping/i.test(message)) info.category = 'ecommerce';
      break;

    case 'marketing_campaign':
      // Extract campaign type
      if (/social media/i.test(message)) info.campaignType = 'social_media';
      else if (/email/i.test(message)) info.campaignType = 'email';
      else if (/launch/i.test(message)) info.campaignType = 'product_launch';
      else info.campaignType = 'general';
      
      // Extract target audience
      const audienceMatch = message.match(/(?:for|target|audience)\s+([^.,!?]+)/i);
      if (audienceMatch) {
        info.targetAudience = audienceMatch[1].trim();
      }
      break;

    case 'business_plan':
      // Extract business stage
      if (/startup|new business/i.test(message)) info.stage = 'startup';
      else if (/expansion|grow/i.test(message)) info.stage = 'growth';
      else info.stage = 'startup';
      
      // Extract industry
      const industryMatch = message.match(/(?:in|for)\s+(?:the\s+)?([a-z]+)\s+industry/i);
      if (industryMatch) {
        info.industry = industryMatch[1];
      }
      break;
  }

  return info;
}

/**
 * Check if message is asking to create a project
 */
export function isProjectCreationRequest(message: string): boolean {
  const creationKeywords = [
    'create', 'build', 'make', 'generate', 'design', 'develop',
    'write', 'help me', 'i need', 'i want', 'can you'
  ];
  
  const lowerMessage = message.toLowerCase();
  return creationKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Get user-friendly project type name
 */
export function getProjectTypeName(type: ProjectType): string {
  const names: Record<ProjectType, string> = {
    kids_book: 'Kids Book',
    website: 'Website',
    app: 'App Design',
    marketing_campaign: 'Marketing Campaign',
    business_plan: 'Business Plan',
    none: 'None'
  };
  return names[type];
}

/**
 * Get project type description
 */
export function getProjectTypeDescription(type: ProjectType): string {
  const descriptions: Record<ProjectType, string> = {
    kids_book: 'Complete illustrated children\'s book with story, characters, and images',
    website: 'Full website with HTML/CSS/JS code ready to deploy',
    app: 'App design with wireframes, user flows, and technical specifications',
    marketing_campaign: 'Complete marketing campaign with social posts, ads, and email sequences',
    business_plan: 'Investor-ready business plan with financials and market analysis',
    none: 'No project detected'
  };
  return descriptions[type];
}

/**
 * Get estimated time for project completion
 */
export function getEstimatedTime(type: ProjectType): string {
  const times: Record<ProjectType, string> = {
    kids_book: '5-10 minutes',
    website: '3-7 minutes',
    app: '4-8 minutes',
    marketing_campaign: '3-6 minutes',
    business_plan: '5-10 minutes',
    none: 'N/A'
  };
  return times[type];
}
