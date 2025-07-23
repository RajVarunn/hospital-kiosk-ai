const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

require('dotenv').config();

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }
  
  const filePath = req.file.path;
  console.log('Received audio file:', req.file.originalname, 'size:', req.file.size);
  
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), {
    filename: 'recording.webm',
    contentType: 'audio/webm'
  });
  form.append('model', 'whisper-1');

  try {
    console.log('Sending audio to OpenAI Whisper API...');
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    console.log('Whisper API response:', response.data);
    fs.unlinkSync(filePath); // Clean up
    
    // Log the transcription result
    if (!response.data.text || response.data.text.trim() === '') {
      console.log('No text transcribed, returning default "yes"');
      return res.json({ transcript: 'yes' });
    }
    
    // Log the transcription for debugging
    console.log('Transcribed text:', response.data.text);
    
    res.json({ transcript: response.data.text });
  } catch (err) {
    console.error('Whisper API error:', err.response?.data || err.message);
    
    // Return an error response
    res.status(500).json({ error: 'Transcription failed', details: err.message });
    
    // Clean up the file even if there was an error
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupErr) {
      console.error('Error cleaning up file:', cleanupErr);
    }
  }
});

module.exports = router;