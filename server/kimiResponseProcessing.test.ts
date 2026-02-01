import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('Kimi Response Processing Fix', () => {
  it('should handle Kimi custom response format with content field', () => {
    const routersContent = readFileSync('/home/ubuntu/libre-ai/server/routers.ts', 'utf-8');
    
    // Check that response processing handles both formats
    expect(routersContent).toContain("'content' in response && typeof response.content === 'string'");
    expect(routersContent).toContain("rawContent = response.content");
    expect(routersContent).toContain("'choices' in response && Array.isArray(response.choices)");
    expect(routersContent).toContain("rawContent = response.choices[0]?.message?.content");
  });

  it('should have comment explaining different response formats', () => {
    const routersContent = readFileSync('/home/ubuntu/libre-ai/server/routers.ts', 'utf-8');
    
    expect(routersContent).toContain("Handle different response formats");
    expect(routersContent).toContain("Kimi provider returns { content: string, ... }");
    expect(routersContent).toContain("Standard OpenAI format");
  });

  it('should declare rawContent with proper type', () => {
    const routersContent = readFileSync('/home/ubuntu/libre-ai/server/routers.ts', 'utf-8');
    
    expect(routersContent).toContain("let rawContent: string | undefined");
  });

  it('should have fallback for undefined rawContent', () => {
    const routersContent = readFileSync('/home/ubuntu/libre-ai/server/routers.ts', 'utf-8');
    
    expect(routersContent).toContain("let assistantContent = typeof rawContent === 'string' ? rawContent : ''");
  });

  it('should check content field first (Kimi format)', () => {
    const routersContent = readFileSync('/home/ubuntu/libre-ai/server/routers.ts', 'utf-8');
    
    // Ensure Kimi format check comes before OpenAI format check
    const contentCheckIndex = routersContent.indexOf("'content' in response");
    const choicesCheckIndex = routersContent.indexOf("'choices' in response");
    
    expect(contentCheckIndex).toBeGreaterThan(0);
    expect(choicesCheckIndex).toBeGreaterThan(0);
    expect(contentCheckIndex).toBeLessThan(choicesCheckIndex);
  });
});
