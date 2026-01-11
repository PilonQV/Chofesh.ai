/**
 * Edge TTS Service - Free Text-to-Speech using Microsoft Edge voices
 * 
 * Features:
 * - 100+ high-quality voices in 45+ languages
 * - Completely FREE with no API key required
 * - Supports SSML for advanced control
 * - Multiple voice styles and emotions
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Popular Edge TTS voices organized by language
export const EDGE_TTS_VOICES = {
  // English voices
  'en-US': [
    { id: 'en-US-AriaNeural', name: 'Aria (Female)', gender: 'female', style: 'friendly' },
    { id: 'en-US-GuyNeural', name: 'Guy (Male)', gender: 'male', style: 'newscast' },
    { id: 'en-US-JennyNeural', name: 'Jenny (Female)', gender: 'female', style: 'assistant' },
    { id: 'en-US-ChristopherNeural', name: 'Christopher (Male)', gender: 'male', style: 'professional' },
    { id: 'en-US-EricNeural', name: 'Eric (Male)', gender: 'male', style: 'friendly' },
    { id: 'en-US-MichelleNeural', name: 'Michelle (Female)', gender: 'female', style: 'cheerful' },
    { id: 'en-US-RogerNeural', name: 'Roger (Male)', gender: 'male', style: 'calm' },
    { id: 'en-US-SteffanNeural', name: 'Steffan (Male)', gender: 'male', style: 'newscast' },
  ],
  'en-GB': [
    { id: 'en-GB-SoniaNeural', name: 'Sonia (Female)', gender: 'female', style: 'friendly' },
    { id: 'en-GB-RyanNeural', name: 'Ryan (Male)', gender: 'male', style: 'professional' },
    { id: 'en-GB-LibbyNeural', name: 'Libby (Female)', gender: 'female', style: 'cheerful' },
  ],
  // Hebrew voices
  'he-IL': [
    { id: 'he-IL-AvriNeural', name: 'Avri (Male)', gender: 'male', style: 'professional' },
    { id: 'he-IL-HilaNeural', name: 'Hila (Female)', gender: 'female', style: 'friendly' },
  ],
  // Spanish voices
  'es-ES': [
    { id: 'es-ES-ElviraNeural', name: 'Elvira (Female)', gender: 'female', style: 'friendly' },
    { id: 'es-ES-AlvaroNeural', name: 'Alvaro (Male)', gender: 'male', style: 'professional' },
  ],
  'es-MX': [
    { id: 'es-MX-DaliaNeural', name: 'Dalia (Female)', gender: 'female', style: 'friendly' },
    { id: 'es-MX-JorgeNeural', name: 'Jorge (Male)', gender: 'male', style: 'professional' },
  ],
  // French voices
  'fr-FR': [
    { id: 'fr-FR-DeniseNeural', name: 'Denise (Female)', gender: 'female', style: 'friendly' },
    { id: 'fr-FR-HenriNeural', name: 'Henri (Male)', gender: 'male', style: 'professional' },
  ],
  // German voices
  'de-DE': [
    { id: 'de-DE-KatjaNeural', name: 'Katja (Female)', gender: 'female', style: 'friendly' },
    { id: 'de-DE-ConradNeural', name: 'Conrad (Male)', gender: 'male', style: 'professional' },
  ],
  // Chinese voices
  'zh-CN': [
    { id: 'zh-CN-XiaoxiaoNeural', name: 'Xiaoxiao (Female)', gender: 'female', style: 'friendly' },
    { id: 'zh-CN-YunxiNeural', name: 'Yunxi (Male)', gender: 'male', style: 'professional' },
  ],
  // Japanese voices
  'ja-JP': [
    { id: 'ja-JP-NanamiNeural', name: 'Nanami (Female)', gender: 'female', style: 'friendly' },
    { id: 'ja-JP-KeitaNeural', name: 'Keita (Male)', gender: 'male', style: 'professional' },
  ],
  // Korean voices
  'ko-KR': [
    { id: 'ko-KR-SunHiNeural', name: 'SunHi (Female)', gender: 'female', style: 'friendly' },
    { id: 'ko-KR-InJoonNeural', name: 'InJoon (Male)', gender: 'male', style: 'professional' },
  ],
  // Arabic voices
  'ar-SA': [
    { id: 'ar-SA-ZariyahNeural', name: 'Zariyah (Female)', gender: 'female', style: 'friendly' },
    { id: 'ar-SA-HamedNeural', name: 'Hamed (Male)', gender: 'male', style: 'professional' },
  ],
  // Russian voices
  'ru-RU': [
    { id: 'ru-RU-SvetlanaNeural', name: 'Svetlana (Female)', gender: 'female', style: 'friendly' },
    { id: 'ru-RU-DmitryNeural', name: 'Dmitry (Male)', gender: 'male', style: 'professional' },
  ],
  // Portuguese voices
  'pt-BR': [
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Female)', gender: 'female', style: 'friendly' },
    { id: 'pt-BR-AntonioNeural', name: 'Antonio (Male)', gender: 'male', style: 'professional' },
  ],
  // Italian voices
  'it-IT': [
    { id: 'it-IT-ElsaNeural', name: 'Elsa (Female)', gender: 'female', style: 'friendly' },
    { id: 'it-IT-DiegoNeural', name: 'Diego (Male)', gender: 'male', style: 'professional' },
  ],
  // Hindi voices
  'hi-IN': [
    { id: 'hi-IN-SwaraNeural', name: 'Swara (Female)', gender: 'female', style: 'friendly' },
    { id: 'hi-IN-MadhurNeural', name: 'Madhur (Male)', gender: 'male', style: 'professional' },
  ],
};

// Get all available voices as a flat list
export function getAllVoices() {
  const voices: Array<{
    id: string;
    name: string;
    gender: string;
    style: string;
    language: string;
  }> = [];
  
  for (const [language, voiceList] of Object.entries(EDGE_TTS_VOICES)) {
    for (const voice of voiceList) {
      voices.push({ ...voice, language });
    }
  }
  
  return voices;
}

// Get voices for a specific language
export function getVoicesForLanguage(language: string) {
  return EDGE_TTS_VOICES[language as keyof typeof EDGE_TTS_VOICES] || [];
}

// Default voice selection based on language detection
export function getDefaultVoice(text: string): string {
  // Simple language detection based on character ranges
  if (/[\u0590-\u05FF]/.test(text)) return 'he-IL-HilaNeural'; // Hebrew
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh-CN-XiaoxiaoNeural'; // Chinese
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja-JP-NanamiNeural'; // Japanese
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko-KR-SunHiNeural'; // Korean
  if (/[\u0600-\u06FF]/.test(text)) return 'ar-SA-ZariyahNeural'; // Arabic
  if (/[\u0400-\u04FF]/.test(text)) return 'ru-RU-SvetlanaNeural'; // Russian
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN-SwaraNeural'; // Hindi
  
  // Default to English
  return 'en-US-AriaNeural';
}

interface EdgeTTSOptions {
  voice?: string;
  rate?: string; // e.g., '+10%', '-20%', '1.5'
  pitch?: string; // e.g., '+5Hz', '-10Hz'
  volume?: string; // e.g., '+10%', '-20%'
}

/**
 * Generate speech from text using Edge TTS
 * Returns the path to the generated audio file (MP3)
 */
export async function generateSpeech(
  text: string,
  options: EdgeTTSOptions = {}
): Promise<{ audioPath: string; duration?: number }> {
  const voice = options.voice || getDefaultVoice(text);
  const rate = options.rate || '+0%';
  const pitch = options.pitch || '+0Hz';
  const volume = options.volume || '+0%';
  
  // Create temp file for output
  const tempDir = os.tmpdir();
  const outputPath = path.join(tempDir, `edge-tts-${Date.now()}.mp3`);
  
  return new Promise((resolve, reject) => {
    // Build edge-tts command arguments
    const args = [
      '--voice', voice,
      '--rate', rate,
      '--pitch', pitch,
      '--volume', volume,
      '--text', text,
      '--write-media', outputPath,
    ];
    
    console.log(`[EdgeTTS] Generating speech with voice: ${voice}`);
    
    const process = spawn('edge-tts', args);
    
    let stderr = '';
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', async (code) => {
      if (code !== 0) {
        console.error(`[EdgeTTS] Error: ${stderr}`);
        reject(new Error(`Edge TTS failed with code ${code}: ${stderr}`));
        return;
      }
      
      // Verify file was created
      try {
        await fs.access(outputPath);
        console.log(`[EdgeTTS] Generated audio: ${outputPath}`);
        resolve({ audioPath: outputPath });
      } catch (err) {
        reject(new Error('Edge TTS did not generate output file'));
      }
    });
    
    process.on('error', (err) => {
      reject(new Error(`Failed to spawn edge-tts: ${err.message}`));
    });
  });
}

/**
 * Generate speech and return as base64 encoded audio
 */
export async function generateSpeechBase64(
  text: string,
  options: EdgeTTSOptions = {}
): Promise<{ audio: string; mimeType: string }> {
  const { audioPath } = await generateSpeech(text, options);
  
  try {
    const audioBuffer = await fs.readFile(audioPath);
    const base64Audio = audioBuffer.toString('base64');
    
    // Clean up temp file
    await fs.unlink(audioPath).catch(() => {});
    
    return {
      audio: base64Audio,
      mimeType: 'audio/mpeg',
    };
  } catch (err) {
    throw new Error(`Failed to read generated audio: ${err}`);
  }
}

/**
 * Stream speech generation (for real-time playback)
 * Returns a readable stream of audio data
 */
export function streamSpeech(
  text: string,
  options: EdgeTTSOptions = {}
): NodeJS.ReadableStream {
  const voice = options.voice || getDefaultVoice(text);
  const rate = options.rate || '+0%';
  const pitch = options.pitch || '+0Hz';
  const volume = options.volume || '+0%';
  
  const args = [
    '--voice', voice,
    '--rate', rate,
    '--pitch', pitch,
    '--volume', volume,
    '--text', text,
    '--write-media', '-', // Output to stdout
  ];
  
  console.log(`[EdgeTTS] Streaming speech with voice: ${voice}`);
  
  const process = spawn('edge-tts', args);
  
  process.stderr.on('data', (data) => {
    console.error(`[EdgeTTS] ${data.toString()}`);
  });
  
  return process.stdout;
}

// Check if edge-tts is available
export async function isEdgeTTSAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn('edge-tts', ['--version']);
    
    process.on('close', (code) => {
      resolve(code === 0);
    });
    
    process.on('error', () => {
      resolve(false);
    });
  });
}
