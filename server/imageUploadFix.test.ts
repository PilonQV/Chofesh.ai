/**
 * Tests for Image Upload Vision Model Selection Fix
 * 
 * This test suite verifies that when images are uploaded:
 * 1. selectModel() receives the hasImages parameter
 * 2. Vision-capable models are selected automatically
 * 3. Simple queries like "what is this" work with images
 */

import { describe, it, expect } from 'vitest';
import { selectModel, AVAILABLE_MODELS } from './modelRouter';

describe('Image Upload Vision Model Selection Fix', () => {
  it('should select vision model when hasImages=true is passed explicitly', () => {
    const model = selectModel('simple', 'auto', undefined, undefined, true);
    expect(model.supportsVision).toBe(true);
  });

  it('should select vision model even with simple text like "what is this"', () => {
    const messages = [{ role: 'user', content: 'what is this' }];
    const model = selectModel('simple', 'auto', undefined, messages, true);
    expect(model.supportsVision).toBe(true);
  });

  it('should select vision model with generic queries when hasImages=true', () => {
    const queries = ['this', 'tell me about it', '?', 'what?', 'explain'];
    
    queries.forEach(query => {
      const messages = [{ role: 'user', content: query }];
      const model = selectModel('simple', 'auto', undefined, messages, true);
      expect(model.supportsVision).toBe(true);
    });
  });

  it('should prefer Kimi K2.5 for vision tasks (cost optimization)', () => {
    const model = selectModel('simple', 'auto', undefined, undefined, true);
    // Should be Kimi K2.5 or another vision model
    expect(model.supportsVision).toBe(true);
    // Kimi K2.5 should be preferred for cost savings
    expect(['kimi-k2.5', 'gpt-4o', 'puter-gpt-4o'].includes(model.id)).toBe(true);
  });

  it('should work correctly when hasImages=false is explicitly passed', () => {
    const messages = [{ role: 'user', content: 'what is the capital of France?' }];
    const model = selectModel('simple', 'auto', undefined, messages, false);
    // Model should be selected based on complexity, vision capability is optional
    // (using a vision model for non-vision tasks is fine, just means extra capability)
    expect(model).toBeDefined();
    expect(model.tier).toBeDefined();
  });

  it('should fall back to text heuristics when hasImages is undefined', () => {
    const messagesWithImageKeyword = [{ role: 'user', content: 'analyze this image please' }];
    const model = selectModel('simple', 'auto', undefined, messagesWithImageKeyword, undefined);
    // Should detect vision need from text
    expect(model.supportsVision).toBe(true);
  });

  it('should select non-vision model for text-only queries when hasImages is undefined', () => {
    const messages = [{ role: 'user', content: 'what is 2+2?' }];
    const model = selectModel('simple', 'auto', undefined, messages, undefined);
    // Should NOT select vision model for simple math
    expect(model.supportsVision).toBe(false);
  });

  it('should have Kimi K2.5 marked as vision-capable in AVAILABLE_MODELS', () => {
    const kimiK25 = AVAILABLE_MODELS.find(m => m.id === 'kimi-k2.5');
    expect(kimiK25).toBeDefined();
    expect(kimiK25?.supportsVision).toBe(true);
  });

  it('should select vision model for complex queries with images', () => {
    const messages = [
      { role: 'user', content: 'Analyze this screenshot and tell me what programming language is being used' }
    ];
    const model = selectModel('complex', 'auto', undefined, messages, true);
    expect(model.supportsVision).toBe(true);
  });

  it('should handle manual mode with vision models', () => {
    const model = selectModel('simple', 'manual', 'kimi-k2.5', undefined, true);
    expect(model.id).toBe('kimi-k2.5');
    expect(model.supportsVision).toBe(true);
  });
});
