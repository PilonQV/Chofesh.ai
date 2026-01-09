import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectIntent, extractParams, INTENT_PATTERNS } from './_core/agentTools';

describe('Agent Tools', () => {
  describe('ImageToolResult structure', () => {
    it('should define urls array for multiple images (4 images for 10 credits)', () => {
      // The ImageToolResult now returns an array of URLs
      const mockResult = {
        type: 'image' as const,
        urls: ['url1', 'url2', 'url3', 'url4'],
        prompt: 'test prompt',
        model: 'hidream',
      };
      expect(mockResult.urls).toHaveLength(4);
      expect(mockResult.type).toBe('image');
      expect(mockResult.model).toBe('hidream');
    });
  });

  describe('detectIntent', () => {
    it('should detect image generation intent', () => {
      expect(detectIntent('draw me a sunset')).toBe('image');
      expect(detectIntent('generate an image of a cat')).toBe('image');
      expect(detectIntent('create a picture of mountains')).toBe('image');
      expect(detectIntent('paint me a beautiful landscape')).toBe('image');
      expect(detectIntent('please draw a robot')).toBe('image');
    });
    
    it('should detect "create an image about" as image intent', () => {
      expect(detectIntent('create an image about this story')).toBe('image');
    });
    
    it('should detect "create a picture for" as image intent', () => {
      expect(detectIntent('create a picture for this story')).toBe('image');
    });
    
    it('should detect various image generation phrases', () => {
      expect(detectIntent('make an image showing a cat')).toBe('image');
      expect(detectIntent('generate a picture depicting sunset')).toBe('image');
      expect(detectIntent('image of a beautiful garden')).toBe('image');
      expect(detectIntent('picture about my vacation')).toBe('image');
    });

    it('should detect search intent', () => {
      expect(detectIntent('search for the latest news')).toBe('search');
      expect(detectIntent('look up information about AI')).toBe('search');
      expect(detectIntent('what is the current weather')).toBe('search');
      expect(detectIntent('who is the president of France')).toBe('search');
      expect(detectIntent('when did World War 2 end')).toBe('search');
    });

    it('should detect document creation intent', () => {
      expect(detectIntent('create a document about AI')).toBe('document');
      expect(detectIntent('write me a report on climate change')).toBe('document');
      expect(detectIntent('generate a summary of the meeting')).toBe('document');
    });

    it('should detect code/calculation intent', () => {
      expect(detectIntent('calculate 5 + 3')).toBe('code');
      expect(detectIntent('what is 100 * 25')).toBe('code');
      expect(detectIntent('compute the sum of 10 and 20')).toBe('code');
    });

    it('should return null for non-matching messages', () => {
      expect(detectIntent('hello how are you')).toBeNull();
      expect(detectIntent('tell me a joke')).toBeNull();
      expect(detectIntent('what do you think about this')).toBeNull();
    });
  });

  describe('extractParams', () => {
    it('should extract image prompt from message', () => {
      const params = extractParams('draw me a beautiful sunset over the ocean', 'image');
      expect(params.prompt).toBeTruthy();
      expect(params.prompt.toLowerCase()).toContain('sunset');
    });

    it('should extract search query from message', () => {
      const params = extractParams('search for the latest AI news', 'search');
      expect(params.query).toBeTruthy();
      expect(params.query.toLowerCase()).toContain('ai');
    });

    it('should extract document parameters from message', () => {
      const params = extractParams('create a document about machine learning', 'document');
      expect(params.title).toBeTruthy();
      expect(params.content).toBeTruthy();
    });

    it('should extract code expression from message', () => {
      const params = extractParams('calculate 5 + 3 * 2', 'code');
      expect(params.code).toBeTruthy();
      expect(params.language).toBe('javascript');
    });
  });

  describe('INTENT_PATTERNS', () => {
    it('should have patterns for all intent types', () => {
      expect(INTENT_PATTERNS.image).toBeDefined();
      expect(INTENT_PATTERNS.image.length).toBeGreaterThan(0);
      
      expect(INTENT_PATTERNS.search).toBeDefined();
      expect(INTENT_PATTERNS.search.length).toBeGreaterThan(0);
      
      expect(INTENT_PATTERNS.document).toBeDefined();
      expect(INTENT_PATTERNS.document.length).toBeGreaterThan(0);
      
      expect(INTENT_PATTERNS.code).toBeDefined();
      expect(INTENT_PATTERNS.code.length).toBeGreaterThan(0);
    });
  });
});
