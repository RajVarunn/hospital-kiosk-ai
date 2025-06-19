const express = require('express');
const multer = require('multer');
const fs = require('fs');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// This endpoint now just acknowledges receipt of audio
// Actual speech recognition will happen in the browser
router.post('/stt', upload.single('audio'), async (req, res) => {
  const file = req.file;
  
  try {
    // Just acknowledge receipt - no processing needed
    // The frontend will handle speech recognition with Web Speech API
    
    // Clean up the uploaded file
    if (file) {
      fs.unlink(file.path, () => {});
    }
    
    // Return empty transcript - frontend will provide the real one
    res.json({ success: true, message: 'Audio received' });
    
  } catch (err) {
    console.error('[Transcribe Error]', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;