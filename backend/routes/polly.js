// backend/routes/polly.js
const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();

AWS.config.update({ region: process.env.AWS_REGION });

const polly = new AWS.Polly();

router.post('/tts', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing text' });
  }

  const params = {
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: 'Joanna', // Valid neural voice
    Engine: 'neural'
  };

  try {
    const data = await polly.synthesizeSpeech(params).promise();

    if (data.AudioStream instanceof Buffer) {
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': data.AudioStream.length
      });
      res.send(data.AudioStream);
    } else {
      throw new Error('Polly returned empty audio stream');
    }
  } catch (err) {
    console.error('[Polly Error]', err);
    res.status(500).json({ error: 'Text-to-speech failed' });
  }
});

module.exports = router;