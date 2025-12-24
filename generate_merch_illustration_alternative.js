/**
 * Alternative script using Replicate API (Stable Diffusion)
 * This is a free/cheaper alternative to DALL-E
 * 
 * To use:
 * 1. Sign up at https://replicate.com
 * 2. Get your API token from https://replicate.com/account/api-tokens
 * 3. Set REPLICATE_API_TOKEN environment variable
 * 4. Run: node generate_merch_illustration_alternative.js
 */

const fs = require('fs');
const path = require('path');

async function generateWithReplicate() {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  
  if (!REPLICATE_API_TOKEN) {
    console.error('❌ Error: REPLICATE_API_TOKEN environment variable is not set.');
    console.log('\n📝 To use this script:');
    console.log('1. Sign up at https://replicate.com');
    console.log('2. Get your API token from https://replicate.com/account/api-tokens');
    console.log('3. Set it: export REPLICATE_API_TOKEN="your-token-here"');
    console.log('4. Run: node generate_merch_illustration_alternative.js');
    process.exit(1);
  }

  const prompt = `stylized minimalist illustration, a young woman with long dark wavy hair sitting cross-legged on grass at a music festival, wearing beige crop top and black mini skirt, looking to the side, bucket hat with Korean text nearby, modern stadium with golden lattice roof in background, clean bold lines, high contrast, vector art style, print-ready design for merchandise, vibrant colors`;

  console.log('🎨 Generating illustration with Stable Diffusion via Replicate...');
  console.log('📝 This may take 30-60 seconds...\n');

  try {
    // Using Stable Diffusion XL for high quality
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${REPLICATE_API_TOKEN}`
      },
      body: JSON.stringify({
        version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', // SDXL
        input: {
          prompt: prompt,
          negative_prompt: 'blurry, low quality, distorted, watermark',
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50,
          width: 1024,
          height: 1024
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.detail || JSON.stringify(error)}`);
    }

    const prediction = await response.json();
    console.log('⏳ Image generation started. Waiting for completion...');
    
    // Poll for completion
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`
        }
      });
      
      result = await statusResponse.json();
      if (result.status === 'processing' || result.status === 'starting') {
        process.stdout.write('.');
      }
    }

    console.log('\n');

    if (result.status === 'failed') {
      throw new Error('Generation failed: ' + (result.error || 'Unknown error'));
    }

    const imageUrl = result.output[0];
    console.log('✅ Image generated successfully!');
    console.log('📥 Downloading image...');

    // Download the image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Save the image
    const outputPath = path.join(__dirname, 'merch_illustration.png');
    fs.writeFileSync(outputPath, buffer);

    console.log(`\n✨ Illustration saved to: ${outputPath}`);
    console.log('📐 Size: 1024x1024 pixels');
    console.log('🎯 Ready for merchandise printing!');

  } catch (error) {
    console.error('❌ Error generating image:', error.message);
    process.exit(1);
  }
}

generateWithReplicate();


