import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test suite for invokeKimi error handling improvements
 * 
 * This tests the fix for the "Cannot read properties of undefined (reading '0')" error
 * by ensuring proper defensive checks are in place.
 */

describe('invokeKimi Error Handling', () => {
  const aiProvidersPath = path.join(__dirname, '_core/aiProviders.ts');
  
  it('should have defensive check for undefined choices array', () => {
    const content = fs.readFileSync(aiProvidersPath, 'utf-8');
    
    // Find the invokeKimi function
    const invokeKimiMatch = content.match(/export async function invokeKimi[\s\S]{1,3000}/);
    expect(invokeKimiMatch).toBeTruthy();
    
    // Verify defensive check exists
    expect(content).toContain('if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0)');
  });
  
  it('should log API response for debugging', () => {
    const content = fs.readFileSync(aiProvidersPath, 'utf-8');
    
    // Verify logging exists
    expect(content).toContain('[Kimi] API Response:');
    expect(content).toContain('JSON.stringify(data, null, 2)');
  });
  
  it('should throw descriptive error when response structure is invalid', () => {
    const content = fs.readFileSync(aiProvidersPath, 'utf-8');
    
    // Verify error throwing exists
    expect(content).toContain('throw new Error(`Kimi API returned invalid response structure');
  });
  
  it('should have fallback values for optional fields', () => {
    const content = fs.readFileSync(aiProvidersPath, 'utf-8');
    
    // Verify fallback values exist
    expect(content).toContain("id: data.id || 'unknown'");
    expect(content).toContain('promptTokens: data.usage.prompt_tokens || 0');
    expect(content).toContain('completionTokens: data.usage.completion_tokens || 0');
    expect(content).toContain('totalTokens: data.usage.total_tokens || 0');
  });
  
  it('should still use optional chaining for content extraction', () => {
    const content = fs.readFileSync(aiProvidersPath, 'utf-8');
    
    // Verify optional chaining is still used after defensive checks
    expect(content).toContain('data.choices[0]?.message?.content');
  });
});
