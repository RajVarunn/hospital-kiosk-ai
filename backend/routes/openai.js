const express = require('express');
const axios = require('axios');
const router = express.Router();

// OpenAI chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { messages, model = 'gpt-3.5-turbo', temperature = 0.3 } = req.body;
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Make actual OpenAI API call
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages,
        temperature,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error('Error in OpenAI chat:', error);
    
    // Return fallback response if OpenAI API fails
    const fallbackResponse = {
      summary: "Unable to generate AI assessment at this time. Please consult with a healthcare professional.",
      possibleConditions: ["Requires clinical evaluation"],
      recommendedTests: ["Complete physical examination"],
      followUpQuestions: ["Please describe your symptoms in detail"],
      redFlags: [],
      urgencyLevel: "medium"
    };

    res.json({
      choices: [{
        message: {
          content: JSON.stringify(fallbackResponse)
        }
      }]
    });
  }
});

module.exports = router;