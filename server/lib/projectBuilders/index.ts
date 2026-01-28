/**
 * Autonomous Project Builder
 * 
 * Main entry point for creating complete projects from simple descriptions.
 * Routes to appropriate builder based on project type detection.
 */

import {
  detectProjectType,
  isProjectCreationRequest,
  getProjectTypeName,
  getProjectTypeDescription,
  getEstimatedTime,
  type ProjectType
} from '../projectDetector';

import { createKidsBook, type KidsBookConfig, type KidsBookResult } from './kidsBookCreator';
import { createWebsite, type WebsiteConfig, type WebsiteResult } from './websiteBuilder';
import { createAppDesign, type AppConfig, type AppResult } from './appDesigner';
import { createMarketingCampaign, type MarketingCampaignConfig, type MarketingCampaignResult } from './marketingCampaignGenerator';

export type ProjectConfig = 
  | { type: 'kids_book'; config: KidsBookConfig }
  | { type: 'website'; config: WebsiteConfig }
  | { type: 'app'; config: AppConfig }
  | { type: 'marketing_campaign'; config: MarketingCampaignConfig };

export type ProjectResult = 
  | { type: 'kids_book'; result: KidsBookResult }
  | { type: 'website'; result: WebsiteResult }
  | { type: 'app'; result: AppResult }
  | { type: 'marketing_campaign'; result: MarketingCampaignResult };

export interface ProjectCreationOptions {
  message: string;
  onProgress?: (step: string, progress: number) => void;
  onDetection?: (type: ProjectType, confidence: number) => void;
}

/**
 * Main function to create any type of project from a user message
 */
export async function createProject(options: ProjectCreationOptions): Promise<ProjectResult | null> {
  const { message, onProgress, onDetection } = options;
  
  // Step 1: Detect project type
  onProgress?.('Analyzing your request...', 5);
  
  const detection = detectProjectType(message);
  
  if (detection.type === 'none' || detection.confidence < 0.3) {
    return null; // Not a project creation request
  }
  
  onDetection?.(detection.type, detection.confidence);
  
  // Step 2: Route to appropriate builder
  switch (detection.type) {
    case 'kids_book':
      return await createKidsBookProject(message, detection.extractedInfo, onProgress);
    
    case 'website':
      return await createWebsiteProject(message, detection.extractedInfo, onProgress);
    
    case 'app':
      return await createAppProject(message, detection.extractedInfo, onProgress);
    
    case 'marketing_campaign':
      return await createMarketingCampaignProject(message, detection.extractedInfo, onProgress);
    
    case 'business_plan':
      // TODO: Implement business plan generator
      onProgress?.('Business plan generator coming soon!', 100);
      return null;
    
    default:
      return null;
  }
}

/**
 * Create kids book project
 */
async function createKidsBookProject(
  message: string,
  extractedInfo: Record<string, any>,
  onProgress?: (step: string, progress: number) => void
): Promise<ProjectResult> {
  const config: KidsBookConfig = {
    theme: extractedInfo.theme || message,
    ageRange: extractedInfo.ageRange,
    pageCount: extractedInfo.pageCount,
    style: 'cartoon' // Default style
  };
  
  const result = await createKidsBook(config, onProgress);
  
  return {
    type: 'kids_book',
    result
  };
}

/**
 * Create website project
 */
async function createWebsiteProject(
  message: string,
  extractedInfo: Record<string, any>,
  onProgress?: (step: string, progress: number) => void
): Promise<ProjectResult> {
  const config: WebsiteConfig = {
    businessType: extractedInfo.businessType || message,
    websiteType: extractedInfo.websiteType,
    style: 'modern' // Default style
  };
  
  const result = await createWebsite(config, onProgress);
  
  return {
    type: 'website',
    result
  };
}

/**
 * Create app project
 */
async function createAppProject(
  message: string,
  extractedInfo: Record<string, any>,
  onProgress?: (step: string, progress: number) => void
): Promise<ProjectResult> {
  const config: AppConfig = {
    concept: message,
    platform: extractedInfo.platform,
    category: extractedInfo.category,
    targetAudience: extractedInfo.targetAudience
  };
  
  const result = await createAppDesign(config, onProgress);
  
  return {
    type: 'app',
    result
  };
}

/**
 * Create marketing campaign project
 */
async function createMarketingCampaignProject(
  message: string,
  extractedInfo: Record<string, any>,
  onProgress?: (step: string, progress: number) => void
): Promise<ProjectResult> {
  // Extract business name and product from message
  const businessMatch = message.match(/for\s+([^,\.]+)/i);
  const productMatch = message.match(/(?:promote|market|sell)\s+([^,\.]+)/i);
  
  const config: MarketingCampaignConfig = {
    businessName: businessMatch?.[1] || 'Your Business',
    product: productMatch?.[1] || message,
    targetAudience: extractedInfo.targetAudience || 'general audience',
    campaignGoal: extractedInfo.campaignType === 'product_launch' ? 'sales' : 'awareness'
  };
  
  const result = await createMarketingCampaign(config, onProgress);
  
  return {
    type: 'marketing_campaign',
    result
  };
}

/**
 * Check if a message is a project creation request
 */
export function isProjectRequest(message: string): boolean {
  return isProjectCreationRequest(message) && detectProjectType(message).confidence > 0.2;
}

/**
 * Get project info without creating it
 */
export function getProjectInfo(message: string) {
  const detection = detectProjectType(message);
  
  if (detection.type === 'none' || detection.confidence < 0.2) {
    return null;
  }
  
  return {
    type: detection.type,
    name: getProjectTypeName(detection.type),
    description: getProjectTypeDescription(detection.type),
    estimatedTime: getEstimatedTime(detection.type),
    confidence: detection.confidence,
    extractedInfo: detection.extractedInfo
  };
}

// Re-export types for convenience
export type {
  ProjectType,
  KidsBookConfig,
  KidsBookResult,
  WebsiteConfig,
  WebsiteResult,
  AppConfig,
  AppResult,
  MarketingCampaignConfig,
  MarketingCampaignResult
};
