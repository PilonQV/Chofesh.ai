/**
 * Test image generation with S3 storage
 */
import { generateImage } from './server/_core/imageGeneration.ts';

async function testImageStorage() {
  console.log('Testing image generation with S3 storage...\n');
  
  try {
    console.log('Generating test image...');
    const result = await generateImage({
      prompt: 'A cute cartoon dragon reading a book'
    });
    
    console.log('\n✅ Image generated successfully!');
    console.log('URL:', result.url);
    
    // Check if URL is permanent (S3) or temporary
    if (result.url?.includes('s3') || result.url?.includes('storage')) {
      console.log('✅ Image stored in S3 (permanent storage)');
    } else {
      console.log('⚠️  Image URL appears to be temporary');
    }
    
    // Test if URL is accessible
    console.log('\nTesting URL accessibility...');
    const response = await fetch(result.url);
    if (response.ok) {
      console.log('✅ Image URL is accessible');
      console.log('Content-Type:', response.headers.get('content-type'));
      console.log('Content-Length:', response.headers.get('content-length'), 'bytes');
    } else {
      console.log('❌ Image URL returned:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testImageStorage();
