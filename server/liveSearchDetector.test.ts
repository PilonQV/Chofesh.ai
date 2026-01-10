import { describe, it, expect } from 'vitest';
import { needsRealtimeSearch, extractSearchQuery, getRealtimeQueryType } from './_core/liveSearchDetector';

describe('Live Search Detector', () => {
  describe('needsRealtimeSearch', () => {
    // Price queries
    it('should detect price queries', () => {
      expect(needsRealtimeSearch('What is the price of gold today?')).toBe(true);
      expect(needsRealtimeSearch('Silver price today')).toBe(true);
      expect(needsRealtimeSearch('How much does bitcoin cost?')).toBe(true);
      expect(needsRealtimeSearch('Bitcoin price')).toBe(true);
      expect(needsRealtimeSearch('What is ETH worth?')).toBe(true);
      expect(needsRealtimeSearch('Stock price of Apple')).toBe(true);
    });

    // Crypto queries
    it('should detect cryptocurrency queries', () => {
      expect(needsRealtimeSearch('Bitcoin price')).toBe(true);
      expect(needsRealtimeSearch('What is BTC trading at?')).toBe(true);
      expect(needsRealtimeSearch('Ethereum market cap')).toBe(true);
      expect(needsRealtimeSearch('Crypto market today')).toBe(true);
    });

    // News queries
    it('should detect news queries', () => {
      expect(needsRealtimeSearch('What is happening in the news today?')).toBe(true);
      expect(needsRealtimeSearch('Latest news about AI')).toBe(true);
      expect(needsRealtimeSearch('Breaking news')).toBe(true);
      expect(needsRealtimeSearch('Current events')).toBe(true);
    });

    // Weather queries
    it('should detect weather queries', () => {
      expect(needsRealtimeSearch('Weather in New York')).toBe(true);
      expect(needsRealtimeSearch('What is the temperature today?')).toBe(true);
      expect(needsRealtimeSearch('Will it rain tomorrow?')).toBe(true);
      expect(needsRealtimeSearch('Weather forecast for this week')).toBe(true);
    });

    // Sports queries
    it('should detect sports queries', () => {
      expect(needsRealtimeSearch('Who won the NBA game last night?')).toBe(true);
      expect(needsRealtimeSearch('NFL scores today')).toBe(true);
      expect(needsRealtimeSearch('Premier League results')).toBe(true);
      expect(needsRealtimeSearch('Champions League score')).toBe(true);
    });

    // Time-sensitive queries
    it('should detect time-sensitive queries', () => {
      expect(needsRealtimeSearch('What is happening right now?')).toBe(true);
      expect(needsRealtimeSearch('Current status of the election')).toBe(true);
      expect(needsRealtimeSearch('Today\'s headlines')).toBe(true);
    });

    // Non-realtime queries (should return false)
    it('should NOT detect non-realtime queries', () => {
      expect(needsRealtimeSearch('How to make a cake')).toBe(false);
      expect(needsRealtimeSearch('What is a variable in programming?')).toBe(false);
      expect(needsRealtimeSearch('Explain quantum physics')).toBe(false);
      expect(needsRealtimeSearch('Write me a poem about love')).toBe(false);
      expect(needsRealtimeSearch('Tell me a joke')).toBe(false);
      expect(needsRealtimeSearch('Help me understand recursion')).toBe(false);
    });

    // Edge cases
    it('should handle edge cases', () => {
      expect(needsRealtimeSearch('')).toBe(false);
      expect(needsRealtimeSearch('hello')).toBe(false);
      expect(needsRealtimeSearch('What is 2 + 2?')).toBe(false);
    });
  });

  describe('extractSearchQuery', () => {
    it('should extract clean search queries', () => {
      expect(extractSearchQuery('What is the price of gold?')).toBe('the price of gold today');
      expect(extractSearchQuery('Tell me about bitcoin price')).toBe('bitcoin price today');
      expect(extractSearchQuery('Silver price today')).toBe('Silver price today');
    });

    it('should remove question marks', () => {
      expect(extractSearchQuery('Bitcoin price???')).toBe('Bitcoin price today');
    });

    it('should handle short queries', () => {
      const result = extractSearchQuery('BTC');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getRealtimeQueryType', () => {
    it('should identify price queries', () => {
      expect(getRealtimeQueryType('Bitcoin price')).toBe('price');
      expect(getRealtimeQueryType('Gold price today')).toBe('price');
      expect(getRealtimeQueryType('Stock market')).toBe('price');
    });

    it('should identify weather queries', () => {
      expect(getRealtimeQueryType('Weather in NYC')).toBe('weather');
      expect(getRealtimeQueryType('Temperature forecast')).toBe('weather');
    });

    it('should identify sports queries', () => {
      expect(getRealtimeQueryType('NBA scores')).toBe('sports');
      expect(getRealtimeQueryType('Who won the game?')).toBe('sports');
    });

    it('should identify news queries', () => {
      expect(getRealtimeQueryType('Latest news')).toBe('news');
      expect(getRealtimeQueryType('Breaking headlines')).toBe('news');
    });

    it('should default to general for ambiguous queries', () => {
      // 'happening' is correctly detected as news
      expect(getRealtimeQueryType('What is happening today?')).toBe('news');
      // Truly ambiguous query
      expect(getRealtimeQueryType('Current status of the project')).toBe('general');
    });
  });
});
