import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test suite for Kimi provider handler in routers.ts
 * 
 * This tests the critical fix for image upload bug where Kimi models
 * were not being properly routed to the invokeKimi function.
 */

describe('Kimi Provider Handler - Critical Fix Verification', () => {
  const routersPath = path.join(__dirname, 'routers.ts');
  const aiProvidersPath = path.join(__dirname, '_core', 'aiProviders.ts');
  const modelRouterPath = path.join(__dirname, 'modelRouter.ts');
  const freeModelFallbackPath = path.join(__dirname, '_core', 'freeModelFallback.ts');
  
  it('should have invokeKimi exported from aiProviders.ts', () => {
    const content = fs.readFileSync(aiProvidersPath, 'utf-8');
    expect(content).toContain('export async function invokeKimi');
  });
  
  it('should have invokeKimi imported in routers.ts', () => {
    const content = fs.readFileSync(routersPath, 'utf-8');
    expect(content).toContain('import { invokeKimi } from "./_core/aiProviders"');
  });
  
  it('should have Kimi provider handler in routers.ts', () => {
    const content = fs.readFileSync(routersPath, 'utf-8');
    
    // Check for provider handler
    expect(content).toContain('selectedModel.provider === "kimi"');
    expect(content).toContain('await invokeKimi({');
  });
  
  it('should call invokeKimi with correct parameters', () => {
    const content = fs.readFileSync(routersPath, 'utf-8');
    
    // Find the Kimi provider handler section
    const kimiHandlerMatch = content.match(/selectedModel\.provider === "kimi"[\s\S]{0,500}await invokeKimi\({[\s\S]{0,200}\}\);/);
    expect(kimiHandlerMatch).toBeTruthy();
    
    if (kimiHandlerMatch) {
      const handlerCode = kimiHandlerMatch[0];
      // Verify it passes finalMessages (which includes images)
      expect(handlerCode).toContain('messages: finalMessages');
      expect(handlerCode).toContain('model: selectedModel.id');
      expect(handlerCode).toContain('temperature: input.temperature');
    }
  });
  
  it('should have Kimi handler before default LLM fallback', () => {
    const content = fs.readFileSync(routersPath, 'utf-8');
    
    // Find positions of Kimi handler and default LLM
    const kimiHandlerPos = content.indexOf('selectedModel.provider === "kimi"');
    const defaultLLMPos = content.indexOf('Use default LLM (Manus Forge API)');
    
    expect(kimiHandlerPos).toBeGreaterThan(0);
    expect(defaultLLMPos).toBeGreaterThan(0);
    expect(kimiHandlerPos).toBeLessThan(defaultLLMPos);
  });
  
  it('should have debug logging for Kimi provider', () => {
    const content = fs.readFileSync(routersPath, 'utf-8');
    expect(content).toContain('[Kimi] Using Kimi provider for model:');
  });
  
  it('should have kimi-k2.5 model defined with vision support', () => {
    const content = fs.readFileSync(modelRouterPath, 'utf-8');
    
    // Find kimi-k2.5 model definition
    const kimiK25Match = content.match(/{\s*id:\s*["']kimi-k2\.5["'][\s\S]{0,500}supportsVision:\s*true/);
    expect(kimiK25Match).toBeTruthy();
    
    // Verify provider is "kimi"
    const providerMatch = content.match(/id:\s*["']kimi-k2\.5["'][\s\S]{0,200}provider:\s*["']kimi["']/);
    expect(providerMatch).toBeTruthy();
  });
  
  it('should prioritize kimi-k2.5 for vision tasks in free model fallback', () => {
    const content = fs.readFileSync(freeModelFallbackPath, 'utf-8');
    
    // Find vision priority queue
    const visionQueueMatch = content.match(/vision:\s*\[[\s\S]{0,500}\]/);
    expect(visionQueueMatch).toBeTruthy();
    
    if (visionQueueMatch) {
      const visionQueue = visionQueueMatch[0];
      // Verify kimi-k2.5 is first in the queue
      expect(visionQueue).toContain('"kimi-k2.5"');
      
      // Extract the first model in the array
      const firstModelMatch = visionQueue.match(/vision:\s*\[\s*["']([^"']+)["']/);
      expect(firstModelMatch).toBeTruthy();
      if (firstModelMatch) {
        expect(firstModelMatch[1]).toBe('kimi-k2.5');
      }
    }
  });
  
  it('should have base64 image conversion in invokeKimi', () => {
    const content = fs.readFileSync(aiProvidersPath, 'utf-8');
    
    // Find invokeKimi function
    const invokeKimiMatch = content.match(/export async function invokeKimi[\s\S]{0,2000}convertImageUrlToBase64/);
    expect(invokeKimiMatch).toBeTruthy();
  });
  
  it('should have all three Kimi models defined', () => {
    const content = fs.readFileSync(modelRouterPath, 'utf-8');
    
    // Check for all three Kimi models
    expect(content).toContain('id: "kimi-k2.5"');
    expect(content).toContain('id: "kimi-k2-thinking"');
    expect(content).toContain('id: "kimi-k2-turbo-preview"');
  });
});
