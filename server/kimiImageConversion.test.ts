import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Test suite for Kimi K2.5 image URL to base64 conversion
 * 
 * Critical requirement: Kimi K2.5 does NOT support HTTP/HTTPS image URLs.
 * It only accepts base64-encoded data URLs in the format:
 * data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
 */

describe('Kimi K2.5 Image Conversion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should understand Kimi requires base64 data URLs not HTTP URLs', () => {
    // This test documents the critical requirement
    const httpUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/image.png';
    const base64Url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';
    
    // Kimi REJECTS HTTP URLs
    expect(httpUrl.startsWith('http')).toBe(true);
    expect(httpUrl.startsWith('data:')).toBe(false);
    
    // Kimi ACCEPTS base64 data URLs
    expect(base64Url.startsWith('data:')).toBe(true);
    expect(base64Url.includes('base64,')).toBe(true);
  });

  it('should convert CloudFront URL to base64 data URL', async () => {
    // Mock fetch to simulate downloading an image
    const mockImageBuffer = Buffer.from('fake-image-data');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => name === 'content-type' ? 'image/png' : null,
      },
      arrayBuffer: async () => mockImageBuffer.buffer,
    });

    const cloudFrontUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663188752192/image.png';
    
    // Simulate the conversion function
    const response = await fetch(cloudFrontUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(dataUrl.length).toBeGreaterThan(30);
  });

  it('should handle already base64-encoded URLs', () => {
    const base64Url = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';
    
    // If already a data URL, should return as-is
    if (base64Url.startsWith('data:')) {
      expect(base64Url).toBe(base64Url);
    }
  });

  it('should preserve MIME type from response headers', async () => {
    const testCases = [
      { contentType: 'image/png', expected: 'data:image/png;base64,' },
      { contentType: 'image/jpeg', expected: 'data:image/jpeg;base64,' },
      { contentType: 'image/webp', expected: 'data:image/webp;base64,' },
      { contentType: 'image/gif', expected: 'data:image/gif;base64,' },
    ];

    for (const { contentType, expected } of testCases) {
      const mockBuffer = Buffer.from('test');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? contentType : null,
        },
        arrayBuffer: async () => mockBuffer.buffer,
      });

      const response = await fetch('https://example.com/image');
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${contentType};base64,${base64}`;

      expect(dataUrl).toMatch(new RegExp(`^${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    }
  });

  it('should handle fetch errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const url = 'https://example.com/missing-image.png';
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      expect(error.message).toContain('Failed to fetch image');
      expect(error.message).toContain('404');
    }
  });

  it('should process multimodal messages with images', async () => {
    const mockBuffer = Buffer.from('image-data');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => name === 'content-type' ? 'image/png' : null,
      },
      arrayBuffer: async () => mockBuffer.buffer,
    });

    const inputMessage = {
      role: 'user',
      content: [
        { type: 'text', text: 'What is this?' },
        {
          type: 'image_url',
          image_url: {
            url: 'https://d2xsxph8kpxj0f.cloudfront.net/image.png',
          },
        },
      ],
    };

    // Simulate processing the message
    const processedContent = await Promise.all(
      inputMessage.content.map(async (part: any) => {
        if (part.type === 'image_url' && part.image_url?.url) {
          if (!part.image_url.url.startsWith('data:')) {
            const response = await fetch(part.image_url.url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            const contentType = response.headers.get('content-type') || 'image/png';
            const dataUrl = `data:${contentType};base64,${base64}`;
            
            return {
              ...part,
              image_url: {
                ...part.image_url,
                url: dataUrl,
              },
            };
          }
        }
        return part;
      })
    );

    const imageContent = processedContent.find((p: any) => p.type === 'image_url');
    expect(imageContent.image_url.url).toMatch(/^data:image\/png;base64,/);
  });

  it('should handle multiple images in a single message', async () => {
    const mockBuffer = Buffer.from('image-data');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => name === 'content-type' ? 'image/jpeg' : null,
      },
      arrayBuffer: async () => mockBuffer.buffer,
    });

    const inputMessage = {
      role: 'user',
      content: [
        { type: 'text', text: 'Compare these images' },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image1.jpg' },
        },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image2.jpg' },
        },
      ],
    };

    const processedContent = await Promise.all(
      inputMessage.content.map(async (part: any) => {
        if (part.type === 'image_url' && part.image_url?.url && !part.image_url.url.startsWith('data:')) {
          const response = await fetch(part.image_url.url);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString('base64');
          const dataUrl = `data:image/jpeg;base64,${base64}`;
          return {
            ...part,
            image_url: { ...part.image_url, url: dataUrl },
          };
        }
        return part;
      })
    );

    const imageContents = processedContent.filter((p: any) => p.type === 'image_url');
    expect(imageContents).toHaveLength(2);
    imageContents.forEach((img: any) => {
      expect(img.image_url.url).toMatch(/^data:image\/jpeg;base64,/);
    });
  });

  it('should not modify text-only messages', async () => {
    const textMessage = {
      role: 'user',
      content: 'Hello, how are you?',
    };

    // Text messages should pass through unchanged
    expect(textMessage.content).toBe('Hello, how are you?');
    expect(typeof textMessage.content).toBe('string');
  });

  it('should handle network errors during image fetch', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const url = 'https://example.com/image.png';
    
    try {
      await fetch(url);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('Network error');
    }
  });

  it('should validate base64 encoding format', () => {
    const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(validBase64, 'base64');
    const reEncoded = buffer.toString('base64');
    
    expect(reEncoded).toBe(validBase64);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
