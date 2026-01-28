/**
 * Kids Book Creator
 * 
 * Generates complete illustrated children's books:
 * - Story with chapters
 * - Character descriptions
 * - Scene illustrations
 * - PDF with text + images
 */

import { invokeAICompletion } from '../../_core/aiProviders';
import { generateImage } from '../../_core/imageGeneration';

export interface KidsBookConfig {
  theme: string;
  ageRange?: string;
  pageCount?: number;
  style?: 'cartoon' | 'watercolor' | 'digital' | 'realistic';
}

export interface KidsBookResult {
  title: string;
  author: string;
  ageRange: string;
  story: {
    pages: Array<{
      pageNumber: number;
      text: string;
      sceneDescription: string;
      imageUrl?: string;
    }>;
  };
  characters: Array<{
    name: string;
    description: string;
  }>;
  coverImageUrl?: string;
  pdfUrl?: string;
}

/**
 * Create a complete kids book
 */
export async function createKidsBook(
  config: KidsBookConfig,
  onProgress?: (step: string, progress: number) => void
): Promise<KidsBookResult> {
  
  onProgress?.('Planning story structure...', 10);
  
  // Step 1: Generate story outline
  const outline = await generateStoryOutline(config);
  
  onProgress?.('Writing story pages...', 25);
  
  // Step 2: Generate full story with pages
  const story = await generateStoryPages(outline, config);
  
  onProgress?.('Creating character descriptions...', 40);
  
  // Step 3: Extract and enhance character descriptions
  const characters = await generateCharacterDescriptions(story, config);
  
  onProgress?.('Generating illustrations...', 50);
  
  // Step 4: Generate images for each page
  const illustratedPages = await generatePageIllustrations(
    story.pages,
    characters,
    config,
    (pageProgress) => {
      onProgress?.(`Generating illustrations... (${pageProgress}/${story.pages.length})`, 50 + (pageProgress / story.pages.length) * 40);
    }
  );
  
  onProgress?.('Creating cover art...', 90);
  
  // Step 5: Generate cover image
  const coverImageUrl = await generateCoverImage(story.title, characters, config);
  
  onProgress?.('Finalizing book...', 95);
  
  // Step 6: Compile into PDF (future enhancement)
  // const pdfUrl = await compileToPDF(story, illustratedPages, coverImageUrl);
  
  onProgress?.('Complete!', 100);
  
  return {
    title: story.title,
    author: 'Created with Chofesh.ai',
    ageRange: config.ageRange || '4-8 years',
    story: {
      pages: illustratedPages
    },
    characters,
    coverImageUrl,
    // pdfUrl
  };
}

/**
 * Generate story outline
 */
async function generateStoryOutline(config: KidsBookConfig) {
  const pageCount = config.pageCount || 12;
  const ageRange = config.ageRange || '4-8 years';
  
  const prompt = `Create a detailed outline for a children's book with the following requirements:

Theme: ${config.theme}
Age Range: ${ageRange}
Number of Pages: ${pageCount}

Please provide:
1. A catchy title
2. Main characters (2-4 characters with names and brief descriptions)
3. Story arc (beginning, middle, end)
4. Page-by-page outline with key events

Make it age-appropriate, engaging, and educational. Include a positive message or lesson.

Format as JSON:
{
  "title": "Book Title",
  "characters": [{"name": "Character Name", "role": "main character description"}],
  "arc": {"beginning": "...", "middle": "...", "end": "..."},
  "pages": [{"page": 1, "event": "What happens on this page"}]
}`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o', // Use smart model for creative work
  });

  // Extract JSON from response
  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to generate story outline');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate full story pages with text
 */
async function generateStoryPages(outline: any, config: KidsBookConfig) {
  const prompt = `Write the complete story for this children's book based on the outline:

Title: ${outline.title}
Characters: ${outline.characters.map((c: any) => `${c.name} (${c.role})`).join(', ')}
Story Arc: ${JSON.stringify(outline.arc)}

Write engaging, age-appropriate text for each page. Each page should have 1-3 sentences.
Include vivid descriptions that can be illustrated.

Format as JSON:
{
  "title": "${outline.title}",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Once upon a time...",
      "sceneDescription": "Detailed visual description of the scene for illustration"
    }
  ]
}`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
  });

  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to generate story pages');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate character descriptions for consistent illustrations
 */
async function generateCharacterDescriptions(story: any, config: KidsBookConfig) {
  const style = config.style || 'cartoon';
  
  const prompt = `Based on this children's book story, create detailed visual descriptions for each character that will be used to generate consistent illustrations:

Story: ${JSON.stringify(story)}

For each character, provide:
- Name
- Physical appearance (age, height, hair, eyes, clothing)
- Personality traits that should show in illustrations
- Art style notes for ${style} style

Format as JSON array:
[
  {
    "name": "Character Name",
    "description": "Detailed visual description for AI image generation"
  }
]`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o-mini', // Simpler task
  });

  const jsonMatch = response.content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to generate character descriptions');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate illustrations for each page
 */
async function generatePageIllustrations(
  pages: any[],
  characters: any[],
  config: KidsBookConfig,
  onProgress?: (current: number) => void
) {
  const style = config.style || 'cartoon';
  const characterDescriptions = characters.map(c => `${c.name}: ${c.description}`).join('\n');
  
  const illustratedPages = [];
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    
    // Create detailed image prompt
    const imagePrompt = `Children's book illustration in ${style} style:

Scene: ${page.sceneDescription}

Characters in this scene:
${characterDescriptions}

Style: ${style}, colorful, child-friendly, high quality, professional children's book illustration
Art direction: Bright colors, clear composition, engaging for children aged ${config.ageRange || '4-8'}`;

    try {
      // Generate image
      const imageResult = await generateImage({
        prompt: imagePrompt,
      });
      
      illustratedPages.push({
        ...page,
        imageUrl: imageResult.url
      });
    } catch (error) {
      console.error(`Failed to generate image for page ${page.pageNumber}:`, error);
      illustratedPages.push(page); // Include page without image
    }
    
    onProgress?.(i + 1);
  }
  
  return illustratedPages;
}

/**
 * Generate cover image
 */
async function generateCoverImage(
  title: string,
  characters: any[],
  config: KidsBookConfig
): Promise<string> {
  const style = config.style || 'cartoon';
  const characterDescriptions = characters.map(c => `${c.name}: ${c.description}`).join('\n');
  
  const coverPrompt = `Children's book cover illustration in ${style} style:

Book Title: "${title}"

Main Characters:
${characterDescriptions}

Style: ${style}, vibrant colors, eye-catching, professional book cover design
Art direction: Show all main characters together in an engaging scene, include space for title text at top
Quality: High quality, professional children's book cover, appealing to children aged ${config.ageRange || '4-8'}`;

  const imageResult = await generateImage({
    prompt: coverPrompt,
  });
  
  return imageResult.url || '';
}

/**
 * Compile book into PDF (future enhancement)
 */
async function compileToPDF(
  story: any,
  pages: any[],
  coverImageUrl: string
): Promise<string> {
  // TODO: Use PDF generation library to create final book
  // - Add cover page with title and cover image
  // - Add each page with text and illustration
  // - Add page numbers
  // - Export as downloadable PDF
  
  return 'pdf-generation-coming-soon.pdf';
}
