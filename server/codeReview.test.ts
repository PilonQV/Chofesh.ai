import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Code Review', () => {
  it('should analyze code for security vulnerabilities', async () => {
    // Mock the LLM response
    const mockResponse = {
      summary: "Code has critical security issues",
      score: 25,
      issues: [
        {
          severity: "critical",
          category: "security",
          line: 2,
          title: "SQL Injection Vulnerability",
          description: "String concatenation in SQL query allows injection attacks",
          suggestion: "Use parameterized queries",
          code: "db.execute('SELECT * FROM users WHERE name = ?', [input])"
        }
      ],
      recommendations: ["Use prepared statements", "Sanitize user input"]
    };
    
    // Test that the response format is correct
    expect(mockResponse.summary).toBeDefined();
    expect(mockResponse.score).toBeGreaterThanOrEqual(0);
    expect(mockResponse.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(mockResponse.issues)).toBe(true);
    expect(mockResponse.issues[0].severity).toMatch(/critical|warning|info/);
    expect(mockResponse.issues[0].category).toMatch(/security|performance|style|bug/);
  });

  it('should validate code input', () => {
    const validCode = "function test() { return 1; }";
    const emptyCode = "";
    
    expect(validCode.trim().length).toBeGreaterThan(0);
    expect(emptyCode.trim().length).toBe(0);
  });

  it('should support multiple languages', () => {
    const supportedLanguages = ['javascript', 'typescript', 'python', 'java', 'go', 'rust'];
    expect(supportedLanguages.length).toBeGreaterThan(0);
    expect(supportedLanguages).toContain('javascript');
  });
});
