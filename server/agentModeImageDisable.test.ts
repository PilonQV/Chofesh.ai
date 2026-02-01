import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test suite for agent mode disabling when images are present
 * 
 * This tests the critical fix for the bug where ReAct agent was bypassing
 * vision model selection, causing uploaded images to be ignored.
 */

describe('Agent Mode Image Upload Fix', () => {
  const routersPath = path.join(__dirname, 'routers.ts');
  
  it('should check for uploaded images before running agent mode', () => {
    const content = fs.readFileSync(routersPath, 'utf-8');
    
    // Find the agent mode section
    const agentModeMatch = content.match(/if \(input\.agentMode && promptContent\)/);
    expect(agentModeMatch).toBeTruthy();
    
    // Verify that there's a check for hasUploadedImages BEFORE the agent mode check
    const hasUploadedImagesCheck = content.indexOf('const hasUploadedImages = !!(input.imageUrls && input.imageUrls.length > 0)');
    const agentModeCheckPos = content.indexOf('if (input.agentMode && promptContent)');
    
    expect(hasUploadedImagesCheck).toBeGreaterThan(0);
    expect(agentModeCheckPos).toBeGreaterThan(0);
    expect(hasUploadedImagesCheck).toBeLessThan(agentModeCheckPos);
  });
  
  it('should disable agent mode when images are present', () => {
    const content = fs.readFileSync(routersPath, 'utf-8');
    
    // Find the logic that disables agent mode for images
    const disableAgentMatch = content.match(/if \(hasUploadedImages && input\.agentMode\) \{[\s\S]{0,200}input\.agentMode = false;/);
    expect(disableAgentMatch).toBeTruthy();
  });
  
  it('should log when agent mode is disabled for images', () => {
    const content = fs.readFileSync(routersPath, 'utf-8');
    
    // Verify logging exists
    expect(content).toContain('Disabling agent mode - images require vision model');
  });
  
  it('should have comment explaining why agent mode is disabled for images', () => {
    const content = fs.readFileSync(routersPath, 'utf-8');
    
    // Verify explanatory comment exists
    expect(content).toContain("agent doesn't support vision");
  });
  
  it('should use different variable name to avoid conflict with later hasImages declaration', () => {
    const content = fs.readFileSync(routersPath, 'utf-8');
    
    // Verify we use hasUploadedImages (not hasImages) to avoid conflict
    const hasUploadedImagesCount = (content.match(/hasUploadedImages/g) || []).length;
    expect(hasUploadedImagesCount).toBeGreaterThanOrEqual(2); // At least declaration and usage
  });
});
