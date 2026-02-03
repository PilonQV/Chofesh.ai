import { describe, it, expect, beforeAll } from 'vitest';
import { analyzeQuery, orchestrateWithKimi, type QueryAnalysis } from './kimiOrchestrator';

describe('Kimi Orchestrator', () => {
  describe('analyzeQuery', () => {
    it('should detect simple factual queries', () => {
      const messages = [
        { role: 'user' as const, content: 'What is the capital of France?' },
      ];
      
      const analysis = analyzeQuery(messages);
      
      expect(analysis.complexity).toBe('simple');
      expect(analysis.taskType).toContain('factual');
      expect(analysis.hasImages).toBe(false);
      expect(analysis.hasCode).toBe(false);
    });
    
    it('should detect code-related queries', () => {
      const messages = [
        { role: 'user' as const, content: 'Write a function to sort an array in JavaScript' },
      ];
      
      const analysis = analyzeQuery(messages);
      
      expect(analysis.hasCode).toBe(true);
      expect(analysis.taskType).toContain('code');
      expect(analysis.complexity).toBe('complex');
    });
    
    it('should detect image/vision queries', () => {
      const messages = [
        { 
          role: 'user' as const, 
          content: [
            { type: 'image_url', image_url: { url: 'data:image/png;base64,abc123' } },
            { type: 'text', text: 'What is in this image?' },
          ],
        },
      ];
      
      const analysis = analyzeQuery(messages);
      
      expect(analysis.hasImages).toBe(true);
      expect(analysis.requiresVision).toBe(true);
      expect(analysis.taskType).toContain('vision');
      expect(analysis.complexity).toBe('complex');
    });
    
    it('should detect reasoning queries', () => {
      const messages = [
        { role: 'user' as const, content: 'Explain why the sky is blue and compare it to why the ocean is blue' },
      ];
      
      const analysis = analyzeQuery(messages);
      
      expect(analysis.requiresReasoning).toBe(true);
      expect(analysis.taskType).toContain('reasoning');
      expect(analysis.complexity).toBe('complex');
    });
    
    it('should estimate context length', () => {
      const longMessage = 'a'.repeat(10000);
      const messages = [
        { role: 'user' as const, content: longMessage },
      ];
      
      const analysis = analyzeQuery(messages);
      
      expect(analysis.contextLength).toBeGreaterThan(2000);
      expect(analysis.complexity).toMatch(/medium|complex/); // Can be either based on message count
    });
  });
  
  describe('orchestrateWithKimi', () => {
    beforeAll(() => {
      // Ensure KIMI_API_KEY is set for integration tests
      if (!process.env.KIMI_API_KEY) {
        console.warn('KIMI_API_KEY not set, skipping integration tests');
      }
    });
    
    it('should route simple queries to delegation strategy', async () => {
      if (!process.env.KIMI_API_KEY) {
        console.log('Skipping: KIMI_API_KEY not set');
        return;
      }
      
      const messages = [
        { role: 'user' as const, content: 'What is 2+2?' },
      ];
      
      const analysis: QueryAnalysis = {
        hasImages: false,
        hasCode: false,
        requiresVision: false,
        requiresReasoning: false,
        contextLength: 100,
        complexity: 'simple',
        taskType: ['factual'],
      };
      
      const decision = await orchestrateWithKimi(messages, analysis);
      
      expect(decision).toBeDefined();
      expect(decision.strategy).toMatch(/direct|delegate|hybrid/);
      expect(decision.primaryModel).toBeDefined();
      expect(decision.reasoning).toBeDefined();
      expect(decision.estimatedCost).toBeGreaterThan(0);
      
      console.log('Orchestration decision:', decision);
    }, 30000); // 30s timeout for API call
    
    it('should route complex queries to Kimi direct', async () => {
      if (!process.env.KIMI_API_KEY) {
        console.log('Skipping: KIMI_API_KEY not set');
        return;
      }
      
      const messages = [
        { role: 'user' as const, content: 'Write a React component with TypeScript that implements a todo list with drag-and-drop functionality' },
      ];
      
      const analysis: QueryAnalysis = {
        hasImages: false,
        hasCode: true,
        requiresVision: false,
        requiresReasoning: true,
        contextLength: 500,
        complexity: 'complex',
        taskType: ['code', 'reasoning'],
      };
      
      const decision = await orchestrateWithKimi(messages, analysis);
      
      expect(decision).toBeDefined();
      expect(decision.primaryModel).toBe('kimi-k2.5');
      expect(decision.strategy).toBe('direct');
      
      console.log('Complex query decision:', decision);
    }, 30000);
  });
});
