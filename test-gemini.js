import { searchWithGemini } from './server/_core/geminiSearch.ts';

async function test() {
  try {
    console.log('Testing Gemini search with: "silver price today"');
    const result = await searchWithGemini('what is the current silver price today?');
    console.log('Success!');
    console.log('Result:', result.text);
    console.log('Grounding metadata:', result.groundingMetadata);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
