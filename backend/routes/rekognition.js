const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const router = express.Router();

const rekognition = new AWS.Rekognition();
const upload = multer();

// Util function: sanitize NRIC
const cleanNRIC = (text) => text.toUpperCase().replace(/[^STFG0-9A-Z]/g, '').trim();

router.post('/nric', upload.single('image'), async (req, res) => {
    try {
      const params = {
        Image: { Bytes: req.file.buffer }
      };
  
      const rekogRes = await rekognition.detectText(params).promise();
      const lines = rekogRes.TextDetections
        .filter(t => t.Type === 'LINE')
        .map(t => t.DetectedText.trim());
  
      console.log("🧾 Text Lines:", lines);
  
      let nric = '';
      let name = '';
      let dob = '';
  
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
  
        // Match NRIC
        if (line.toUpperCase().includes('IDENTITY CARD NO')) {
          const match = line.match(/[STFG]\d{7}[A-Z]/i);
          if (match) nric = match[0].toUpperCase();
        }
  
        // Match Name (check line after "Name" or uppercase only line)
        if (line.toUpperCase() === 'NAME' && i + 1 < lines.length) {
          const candidate = lines[i + 1];
          if (/^[A-Z ]{2,}$/.test(candidate)) name = candidate;
        }
  
        // Match DOB
        const dobMatch = line.match(/\d{2}[-/]\d{2}[-/]\d{4}/);
        if (dobMatch) dob = dobMatch[0];
      }
  
      res.json({ nric, name, dob, allText: lines });
    } catch (err) {
      console.error('[Rekognition Error]', err);
      res.status(500).json({ error: 'NRIC recognition failed', details: err.message });
    }
  });

module.exports = router;