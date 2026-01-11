import { describe, it, expect, vi } from 'vitest';
import { 
  getAllVoices, 
  getVoicesForLanguage, 
  getDefaultVoice,
  EDGE_TTS_VOICES,
  splitTextIntoChunks
} from './_core/edgeTTS';
import {
  splitTextIntoChunks as chromaSplit,
  buildRAGContext,
} from './_core/chromaDB';

describe('Edge TTS Service', () => {
  describe('Voice Configuration', () => {
    it('should have voices for multiple languages', () => {
      const voices = getAllVoices();
      expect(voices.length).toBeGreaterThan(20);
      
      // Check for key languages
      const languages = new Set(voices.map(v => v.language));
      expect(languages.has('en-US')).toBe(true);
      expect(languages.has('he-IL')).toBe(true);
      expect(languages.has('es-ES')).toBe(true);
      expect(languages.has('fr-FR')).toBe(true);
      expect(languages.has('de-DE')).toBe(true);
      expect(languages.has('zh-CN')).toBe(true);
      expect(languages.has('ja-JP')).toBe(true);
    });

    it('should return voices for specific language', () => {
      const enVoices = getVoicesForLanguage('en-US');
      expect(enVoices.length).toBeGreaterThan(0);
      expect(enVoices.every(v => v.id.startsWith('en-US'))).toBe(true);
      
      const heVoices = getVoicesForLanguage('he-IL');
      expect(heVoices.length).toBeGreaterThan(0);
      expect(heVoices.every(v => v.id.startsWith('he-IL'))).toBe(true);
    });

    it('should return empty array for unknown language', () => {
      const voices = getVoicesForLanguage('xx-XX');
      expect(voices).toEqual([]);
    });

    it('should have voice metadata', () => {
      const voices = getAllVoices();
      for (const voice of voices) {
        expect(voice.id).toBeTruthy();
        expect(voice.name).toBeTruthy();
        expect(['male', 'female']).toContain(voice.gender);
        expect(voice.style).toBeTruthy();
        expect(voice.language).toBeTruthy();
      }
    });
  });

  describe('Default Voice Selection', () => {
    it('should detect Hebrew text', () => {
      const voice = getDefaultVoice('שלום עולם');
      expect(voice).toBe('he-IL-HilaNeural');
    });

    it('should detect Chinese text', () => {
      const voice = getDefaultVoice('你好世界');
      expect(voice).toBe('zh-CN-XiaoxiaoNeural');
    });

    it('should detect Japanese text', () => {
      const voice = getDefaultVoice('こんにちは');
      expect(voice).toBe('ja-JP-NanamiNeural');
    });

    it('should detect Korean text', () => {
      const voice = getDefaultVoice('안녕하세요');
      expect(voice).toBe('ko-KR-SunHiNeural');
    });

    it('should detect Arabic text', () => {
      const voice = getDefaultVoice('مرحبا بالعالم');
      expect(voice).toBe('ar-SA-ZariyahNeural');
    });

    it('should detect Russian text', () => {
      const voice = getDefaultVoice('Привет мир');
      expect(voice).toBe('ru-RU-SvetlanaNeural');
    });

    it('should default to English for Latin text', () => {
      const voice = getDefaultVoice('Hello world');
      expect(voice).toBe('en-US-AriaNeural');
    });

    it('should default to English for mixed text', () => {
      const voice = getDefaultVoice('Hello world 123!');
      expect(voice).toBe('en-US-AriaNeural');
    });
  });
});

describe('ChromaDB Service', () => {
  describe('Text Chunking', () => {
    it('should split text into chunks', () => {
      const text = `First paragraph here.

Second paragraph here.

Third paragraph here.`;
      
      const chunks = chromaSplit(text, { chunkSize: 100, chunkOverlap: 20 });
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.every(c => c.length > 0)).toBe(true);
    });

    it('should handle empty text', () => {
      const chunks = chromaSplit('');
      expect(chunks).toEqual([]);
    });

    it('should handle single paragraph', () => {
      const text = 'This is a single paragraph without any breaks.';
      const chunks = chromaSplit(text);
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe(text);
    });

    it('should respect chunk size limits', () => {
      const longText = 'A'.repeat(500) + '\n\n' + 'B'.repeat(500) + '\n\n' + 'C'.repeat(500);
      const chunks = chromaSplit(longText, { chunkSize: 600, chunkOverlap: 50 });
      
      // Most chunks should be under the limit (allowing some flexibility)
      const oversizedChunks = chunks.filter(c => c.length > 900);
      expect(oversizedChunks.length).toBeLessThanOrEqual(1);
    });
  });

  describe('RAG Context Building', () => {
    it('should build context from search results', () => {
      const results = [
        { text: 'First relevant chunk', score: 0.95, metadata: { filename: 'doc1.txt' } },
        { text: 'Second relevant chunk', score: 0.85, metadata: { filename: 'doc2.txt' } },
      ];
      
      const context = buildRAGContext(results);
      expect(context).toContain('Relevant Context');
      expect(context).toContain('First relevant chunk');
      expect(context).toContain('Second relevant chunk');
      expect(context).toContain('doc1.txt');
      expect(context).toContain('95%');
    });

    it('should handle empty results', () => {
      const context = buildRAGContext([]);
      expect(context).toBe('');
    });

    it('should respect token limits', () => {
      const results = Array(20).fill(null).map((_, i) => ({
        text: 'A'.repeat(500),
        score: 0.9 - i * 0.01,
        metadata: { filename: `doc${i}.txt` },
      }));
      
      const context = buildRAGContext(results, 500); // ~2000 chars
      expect(context.length).toBeLessThan(3000);
    });

    it('should include relevance scores', () => {
      const results = [
        { text: 'Test chunk', score: 0.87, metadata: { filename: 'test.txt' } },
      ];
      
      const context = buildRAGContext(results);
      expect(context).toContain('87%');
    });
  });
});

describe('Voice Router Endpoints', () => {
  it('should have correct voice structure', () => {
    const voices = EDGE_TTS_VOICES['en-US'];
    expect(voices).toBeDefined();
    expect(voices.length).toBeGreaterThan(0);
    
    const firstVoice = voices[0];
    expect(firstVoice).toHaveProperty('id');
    expect(firstVoice).toHaveProperty('name');
    expect(firstVoice).toHaveProperty('gender');
    expect(firstVoice).toHaveProperty('style');
  });

  it('should have Hebrew voices', () => {
    const heVoices = EDGE_TTS_VOICES['he-IL'];
    expect(heVoices).toBeDefined();
    expect(heVoices.length).toBeGreaterThanOrEqual(2);
    
    const maleVoice = heVoices.find(v => v.gender === 'male');
    const femaleVoice = heVoices.find(v => v.gender === 'female');
    expect(maleVoice).toBeDefined();
    expect(femaleVoice).toBeDefined();
  });
});
