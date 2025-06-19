require('dotenv').config();
const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Path to a test audio file (replace with an actual file path)
const TEST_AUDIO_FILE = './uploads/test-audio.webm';

async function testWhisperTranscription() {
  try {
    // Check if the test file exists
    if (!fs.existsSync(TEST_AUDIO_FILE)) {
      console.log('Test audio file not found. Creating a placeholder...');
      // This is just a placeholder - you'll need a real audio file for testing
      fs.writeFileSync(TEST_AUDIO_FILE, 'placeholder');
      console.log(`Created placeholder at ${TEST_AUDIO_FILE}`);
      console.log('Please replace this with a real audio file before testing.');
      return;
    }

    console.log('Starting transcription test...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_AUDIO_FILE), {
      filename: 'test-audio.webm',
      contentType: 'audio/webm'
    });
    formData.append('model', 'whisper-1');
    
    console.log('Sending request to OpenAI Whisper API...');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Transcription successful!');
    console.log('Transcript:', data.text);
  } catch (error) {
    console.error('Transcription test failed:', error);
  }
}

testWhisperTranscription();