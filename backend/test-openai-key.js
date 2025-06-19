require('dotenv').config();
const fetch = require('node-fetch');

async function testOpenAIKey() {
  try {
    console.log('Testing OpenAI API key...');
    
    // Simple test to check if the API key is valid
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI API key is valid!');
      console.log(`Available models: ${data.data.length}`);
      
      // Check if Whisper is available
      const whisperModel = data.data.find(model => model.id.includes('whisper'));
      if (whisperModel) {
        console.log('✅ Whisper model is available:', whisperModel.id);
      } else {
        console.log('⚠️ No Whisper model found in the available models.');
        console.log('This might be due to API limitations or permissions.');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ OpenAI API key is invalid or has issues:');
      console.error(`Status: ${response.status}`);
      console.error(`Error: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error testing OpenAI API key:', error.message);
  }
}

testOpenAIKey();