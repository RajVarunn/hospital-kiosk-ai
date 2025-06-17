const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

require('dotenv').config();

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  const filePath = req.file.path;
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), {
    filename: 'recording.webm',
    contentType: 'audio/webm'
  });
  form.append('model', 'whisper-1');

  try {
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    fs.unlinkSync(filePath); // Clean up
    res.json({ transcript: response.data.text });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

module.exports = router;