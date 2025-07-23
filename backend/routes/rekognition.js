const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const router = express.Router();

const upload = multer();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Util function: sanitize NRIC
const cleanNRIC = (text) => text.toUpperCase().replace(/[^STFG0-9A-Z]/g, '').trim();

router.post('/nric', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    console.log('Image received, size:', req.file.size, 'bytes');

    // Call OpenAI Vision API with improved prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting information from ID cards and NRIC. Your task is to carefully extract the NRIC number (format: S1234567A, G1234567A, etc.), full name, and date of birth (format: DD-MM-YYYY) from the image. Look for these details anywhere in the image, including headers, main content, and even small text. Return ONLY a JSON object with keys: nric, name, dob. If you cannot find one of these fields, leave it as an empty string."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the NRIC number, name, and date of birth from this ID card image. Be thorough and look at all parts of the image." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3 // Lower temperature for more precise extraction
    });

    // Parse the response
    const content = response.choices[0].message.content;
    let extractedData;
    
    try {
      extractedData = JSON.parse(content);
    } catch (parseError) {
      // If not valid JSON, try to extract using regex
      const nricMatch = content.match(/["']?nric["']?\s*:\s*["']([STFG]\d{7}[A-Z])["']/i);
      const nameMatch = content.match(/["']?name["']?\s*:\s*["']([^"']*)["']/i);
      const dobMatch = content.match(/["']?dob["']?\s*:\s*["']([^"']*)["']/i);
      
      extractedData = {
        nric: nricMatch ? nricMatch[1] : '',
        name: nameMatch ? nameMatch[1] : '',
        dob: dobMatch ? dobMatch[1] : ''
      };
    }

    // Clean the NRIC
    if (extractedData.nric) {
      extractedData.nric = cleanNRIC(extractedData.nric);
    }

    // Log the extracted data for debugging
    console.log('Extracted NRIC data:', extractedData);
    
    // Log if no data was extracted
    if (!extractedData.nric && !extractedData.name && !extractedData.dob) {
      console.log('Warning: No data extracted from the image');
    }
    
    // Return the extracted data
    res.json({
      ...extractedData,
      allText: [content], // Include the full response for debugging
    });
  } catch (err) {
    console.error('[OpenAI Vision Error]', err);
    res.status(500).json({ error: 'NRIC recognition failed', details: err.message });
  }
});

module.exports = router;