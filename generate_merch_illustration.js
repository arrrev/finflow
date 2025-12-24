const fs = require('fs');
const path = require('path');
const https = require('https');

// This script uses OpenAI's DALL-E API to generate an illustration
// You'll need to set OPENAI_API_KEY in your environment or .env file

async function generateIllustration() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set.');
    console.log('\n📝 To use this script:');
    console.log('1. Get an API key from https://platform.openai.com/api-keys');
    console.log('2. Set it as an environment variable:');
    console.log('   export OPENAI_API_KEY="your-api-key-here"');
    console.log('   OR add it to your .env file');
    console.log('3. Run: node generate_merch_illustration.js');
    process.exit(1);
  }

  // Prompt optimized for merch printing - clean, stylized illustration
  const prompt = `Create a stylized, minimalist illustration suitable for merchandise printing. 
A young woman with long dark wavy hair sits cross-legged on grass at a music festival, 
wearing a beige crop top and black mini skirt, looking to the side. She has a bucket hat 
with Korean text "드림 콘서트" nearby. In the background, a modern stadium with golden 
lattice roof structure. Clean, bold lines, high contrast, print-ready design. 
Vector art style, suitable for t-shirts and posters.`;

  console.log('🎨 Generating illustration with DALL-E...');
  console.log('📝 Prompt:', prompt.substring(0, 100) + '...\n');

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid' // More vibrant colors for merch
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error?.message || JSON.stringify(error)}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

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
    console.log('📐 Size: 1024x1024 pixels (HD quality)');
    console.log('🎯 Ready for merchandise printing!');
    console.log('\n💡 Tip: You can also access the image at:', imageUrl);

  } catch (error) {
    console.error('❌ Error generating image:', error.message);
    
    if (error.message.includes('API Error')) {
      console.log('\n💡 Common issues:');
      console.log('- Check that your API key is valid');
      console.log('- Ensure you have credits in your OpenAI account');
      console.log('- Verify your API key has image generation permissions');
    }
    
    process.exit(1);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('📦 Installing node-fetch for Node.js compatibility...');
  console.log('   Run: npm install node-fetch@2');
  console.log('   Or use Node.js 18+ which has fetch built-in');
  process.exit(1);
}

generateIllustration();


