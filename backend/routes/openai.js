const express = require('express');
const router = express.Router();

// OpenAI chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { messages, model = 'gpt-3.5-turbo', temperature = 0.3 } = req.body;

    // Mock response for now - replace with actual OpenAI API call
    const mockResponse = {
      summary: "Based on the symptoms and vitals provided, the patient appears to have a mild respiratory condition.",
      possibleConditions: [
        "Upper respiratory tract infection",
        "Common cold",
        "Mild bronchitis"
      ],
      recommendedTests: [
        "Complete blood count (CBC)",
        "Chest X-ray",
        "Throat swab culture"
      ],
      followUpQuestions: [
        "How long have you been experiencing these symptoms?",
        "Have you had any recent travel or exposure to sick individuals?",
        "Are you taking any medications currently?"
      ],
      redFlags: [],
      urgencyLevel: "low"
    };

    res.json({
      choices: [{
        message: {
          content: JSON.stringify(mockResponse)
        }
      }]
    });

  } catch (error) {
    console.error('Error in OpenAI chat:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

module.exports = router;