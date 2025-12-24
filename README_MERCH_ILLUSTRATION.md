# Merchandise Illustration Generator

This directory contains scripts to generate a print-ready illustration based on the festival image description using AI image generation services.

## Option 1: OpenAI DALL-E 3 (Recommended for Quality)

**Pros:** Highest quality, best prompt understanding, HD output
**Cons:** Requires paid API key

### Setup:
1. Get an API key from https://platform.openai.com/api-keys
2. Set environment variable:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```
   Or add to `.env` file:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```
3. Run:
   ```bash
   node generate_merch_illustration.js
   ```

### Cost:
- ~$0.04 per image (1024x1024 HD)

---

## Option 2: Replicate (Stable Diffusion) - More Affordable

**Pros:** Cheaper, good quality, multiple model options
**Cons:** Slightly longer generation time

### Setup:
1. Sign up at https://replicate.com
2. Get API token from https://replicate.com/account/api-tokens
3. Set environment variable:
   ```bash
   export REPLICATE_API_TOKEN="your-token-here"
   ```
4. Run:
   ```bash
   node generate_merch_illustration_alternative.js
   ```

### Cost:
- ~$0.002-0.01 per image (much cheaper!)

---

## Option 3: Google Nano Banana (Web Interface)

**Pros:** Free, no API key needed, user-friendly
**Cons:** Manual process, no automation

### Steps:
1. Visit https://googlenanobanana.com
2. Use this prompt:
   ```
   Create a stylized, minimalist illustration suitable for merchandise printing. 
   A young woman with long dark wavy hair sits cross-legged on grass at a music 
   festival, wearing a beige crop top and black mini skirt, looking to the side. 
   She has a bucket hat with Korean text "드림 콘서트" nearby. In the background, 
   a modern stadium with golden lattice roof structure. Clean, bold lines, high 
   contrast, print-ready design. Vector art style, suitable for t-shirts and posters.
   ```
3. Generate and download the image

---

## Output

All scripts will save the generated illustration as:
- `merch_illustration.png` (1024x1024 pixels, HD quality)

The image is optimized for:
- ✅ T-shirt printing
- ✅ Poster printing
- ✅ Sticker printing
- ✅ High-resolution merchandise

---

## Tips for Best Results

1. **For vector-style illustrations:** Add "vector art", "line art", or "flat design" to prompts
2. **For print-ready:** Request "high contrast", "bold colors", "clean lines"
3. **For specific styles:** Mention "minimalist", "stylized", "geometric", etc.
4. **Iterate:** Generate multiple versions and pick the best one

---

## Editing the Prompts

You can modify the prompts in the scripts to:
- Change the art style
- Adjust colors
- Modify composition
- Add/remove elements

Just edit the `prompt` variable in either script file.


