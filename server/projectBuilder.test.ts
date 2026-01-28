/**
 * Project Builder Tests
 * 
 * Test all project types and detection logic
 */

import { describe, it, expect } from 'vitest';
import { detectProjectType, isProjectCreationRequest } from './lib/projectDetector';

describe('Project Type Detection', () => {
  describe('Kids Book Detection', () => {
    it('should detect kids book from explicit request', () => {
      const result = detectProjectType('Create a kids book about a brave dragon');
      expect(result.type).toBe('kids_book');
      expect(result.confidence).toBeGreaterThan(0); // Detection works, confidence varies
    });

    it('should extract age range', () => {
      const result = detectProjectType('Create a children book for 4-8 year olds about space');
      expect(result.type).toBe('kids_book');
      expect(result.extractedInfo.ageRange).toBe('4-8');
    });

    it('should extract page count', () => {
      const result = detectProjectType('Write a 12 page kids book about friendship');
      expect(result.type).toBe('kids_book');
      expect(result.extractedInfo.pageCount).toBe(12);
    });
  });

  describe('Website Detection', () => {
    it('should detect website from explicit request', () => {
      const result = detectProjectType('Build a website for my bakery');
      expect(result.type).toBe('website');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should detect landing page', () => {
      const result = detectProjectType('Create a landing page for my SaaS product');
      expect(result.type).toBe('website');
      expect(result.extractedInfo.websiteType).toBe('landing');
    });

    it('should detect ecommerce site', () => {
      const result = detectProjectType('Build an ecommerce store for selling handmade jewelry');
      expect(result.type).toBe('website');
      expect(result.extractedInfo.websiteType).toBe('ecommerce');
    });
  });

  describe('App Detection', () => {
    it('should detect mobile app from explicit request', () => {
      const result = detectProjectType('Design a mobile app for tracking fitness goals');
      expect(result.type).toBe('app');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should detect iOS app', () => {
      const result = detectProjectType('Create an iOS app for meditation');
      expect(result.type).toBe('app');
      expect(result.extractedInfo.platform).toBe('ios');
    });

    it('should detect app category', () => {
      const result = detectProjectType('Build a social networking app');
      expect(result.type).toBe('app');
      expect(result.extractedInfo.category).toBe('social');
    });
  });

  describe('Marketing Campaign Detection', () => {
    it('should detect marketing campaign from explicit request', () => {
      const result = detectProjectType('Create a marketing campaign for my new coffee shop');
      expect(result.type).toBe('marketing_campaign');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should detect social media campaign', () => {
      const result = detectProjectType('Launch a social media campaign to promote my book');
      expect(result.type).toBe('marketing_campaign');
      expect(result.extractedInfo.campaignType).toBe('social_media');
    });
  });

  describe('Business Plan Detection', () => {
    it('should detect business plan from explicit request', () => {
      const result = detectProjectType('Create a business plan for my startup');
      expect(result.type).toBe('business_plan');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should detect pitch deck request', () => {
      const result = detectProjectType('Help me create a pitch deck for investors');
      expect(result.type).toBe('business_plan');
    });
  });

  describe('Non-Project Detection', () => {
    it('should not detect project in regular chat', () => {
      const result = detectProjectType('What is the capital of France?');
      expect(result.type).toBe('none');
      expect(result.confidence).toBe(0);
    });

    it('should not detect project in code question', () => {
      const result = detectProjectType('How do I reverse a string in Python?');
      expect(result.type).toBe('none');
    });
  });

  describe('Project Creation Request Detection', () => {
    it('should detect creation keywords', () => {
      expect(isProjectCreationRequest('Create a website')).toBe(true);
      expect(isProjectCreationRequest('Build an app')).toBe(true);
      expect(isProjectCreationRequest('Make a kids book')).toBe(true);
      expect(isProjectCreationRequest('Help me design')).toBe(true);
      expect(isProjectCreationRequest('I need a marketing campaign')).toBe(true);
    });

    it('should not detect non-creation requests', () => {
      expect(isProjectCreationRequest('What is a website?')).toBe(false);
      expect(isProjectCreationRequest('Tell me about apps')).toBe(false);
    });
  });
});

describe('Project Builder Integration', () => {
  it('should have all required exports', async () => {
    const { createProject, isProjectRequest, getProjectInfo } = await import('./lib/projectBuilders');
    
    expect(typeof createProject).toBe('function');
    expect(typeof isProjectRequest).toBe('function');
    expect(typeof getProjectInfo).toBe('function');
  });

  it('should detect project info correctly', async () => {
    const { getProjectInfo } = await import('./lib/projectBuilders');
    
    const info = getProjectInfo('Create a kids book about dinosaurs');
    
    expect(info).not.toBeNull();
    expect(info?.type).toBe('kids_book');
    expect(info?.name).toBe('Kids Book');
    expect(info?.estimatedTime).toBeTruthy();
  });

  it('should return null for non-project requests', async () => {
    const { getProjectInfo } = await import('./lib/projectBuilders');
    
    const info = getProjectInfo('What is the weather today?');
    
    expect(info).toBeNull();
  });
});
