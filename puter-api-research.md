# Puter.js - Free, Unlimited AI API Research

**Source:** https://developer.puter.com/tutorials/free-unlimited-openai-api/

## Overview
Puter.js provides **FREE, unlimited access** to multiple AI models without API keys. It uses a "User-Pays" model where users cover their own usage costs, allowing developers to offer AI capabilities at no cost to themselves.

## Integration Method
Simply include the script in HTML:
```html
<script src="https://js.puter.com/v2/"></script>
```

## Key APIs

### Text Generation
```javascript
puter.ai.chat("prompt", { model: "gpt-5-nano" })
  .then(response => console.log(response));

// With streaming
const response = await puter.ai.chat("prompt", { stream: true, model: "gpt-5-nano" });
for await (const part of response) {
  console.log(part?.text);
}
```

### Image Generation
```javascript
puter.ai.txt2img("A futuristic cityscape", { model: "gpt-image-1.5" })
  .then(imageElement => document.body.appendChild(imageElement));
```

### Text-to-Speech
```javascript
puter.ai.txt2speech("Hello world!", { provider: "openai" })
  .then(audio => audio.play());
```

## Supported Text Generation Models
- gpt-5.2, gpt-5.2-chat, gpt-5.2-pro
- gpt-5.1, gpt-5.1-chat-latest, gpt-5.1-codex, gpt-5.1-codex-max, gpt-5.1-codex-mini
- gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-chat-latest
- gpt-4.1, gpt-4.1-mini, gpt-4.1-nano
- gpt-4.5-preview
- gpt-4o, gpt-4o-mini
- o1, o1-mini, o1-pro
- o3, o3-mini
- o4-mini
- openrouter:openai/gpt-oss-120b
- openrouter:openai/gpt-oss-120b:exacto
- openrouter:openai/gpt-oss-20b
- openrouter:openai/gpt-oss-20b:free
- openrouter:openai/gpt-oss-safeguard-20b
- openrouter:openai/codex-mini
- openrouter:openai/gpt-5-codex
- openrouter:openai/gpt-5.1-codex
- openrouter:openai/gpt-5.1-codex-max

## Supported Image Generation Models
- gpt-image-1.5
- gpt-image-1-mini
- gpt-image-1
- dall-e-3
- dall-e-2

## Supported Text-to-Speech Models
- gpt-4o-mini-tts
- tts-1
- tts-1-hd

## Key Benefits for Chofesh.ai
1. **FREE** - No API costs
2. **No API keys needed** - Works directly in frontend
3. **Multiple models** - GPT-5.2, GPT-4o, o1, o3, DALL-E, etc.
4. **Image generation** - GPT Image and DALL-E models
5. **Streaming support** - Real-time responses
6. **Tool/Function calling** - Supported

## Important Considerations
- **Frontend only** - Puter.js is designed for browser use
- **User-Pays model** - Users may need to authenticate with Puter for heavy usage
- **Content moderation** - These are OpenAI models, so they have standard content policies (NOT uncensored)

## Potential Integration for Chofesh.ai
- Add as an additional model provider option
- Use for users who don't have their own API keys
- Could reduce costs significantly
- BUT: These models are NOT uncensored - they have OpenAI's content policies
