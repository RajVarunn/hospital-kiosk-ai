const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class OpenAIService {
  constructor() {
    this.systemPrompt = `You are a helpful AI medical assistant for a hospital kiosk system. Your role is to:

1. Collect patient medical history and current symptoms in a conversational way
2. Ask relevant follow-up questions to gather complete information
3. Provide clear, simple explanations about medications and procedures
4. Offer basic navigation help within the hospital
5. Be empathetic and patient, especially with elderly patients
6. Support multiple languages (English, Mandarin, Malay)
7. NEVER provide medical diagnoses or treatment advice
8. Always recommend consulting with healthcare professionals for medical concerns

Guidelines:
- Keep responses concise and easy to understand
- Use simple language, avoid medical jargon
- Be culturally sensitive
- If unsure about medical information, always defer to healthcare professionals
- Focus on gathering information and providing comfort/guidance

Extract important medical information and return it in a structured format.`;
  }

  async generateMedicalResponse(userMessage, context = {}) {
    try {
      const { patientContext = '', conversationHistory = [], language = 'english' } = context;

      // Build conversation history for context
      const messages = [
        {
          role: 'system',
          content: `${this.systemPrompt}\n\nPatient Context: ${patientContext}\nPreferred Language: ${language}`
        }
      ];

      // Add conversation history
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.message
        });
      });

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Use gpt-4o-mini for cost efficiency during hackathon
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
        functions: [
          {
            name: 'extract_medical_info',
            description: 'Extract structured medical information from conversation',
            parameters: {
              type: 'object',
              properties: {
                symptoms: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of symptoms mentioned'
                },
                medications: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Current medications'
                },
                allergies: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Known allergies'
                },
                medicalHistory: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Relevant medical history'
                },
                urgency: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: 'Assessed urgency level'
                }
              }
            }
          }
        ],
        function_call: 'auto'
      });

      const response = completion.choices[0];
      let extractedInfo = null;

      // Check if AI used function call to extract structured data
      if (response.function_call) {
        try {
          extractedInfo = JSON.parse(response.function_call.arguments);
        } catch (e) {
          console.error('Error parsing extracted info:', e);
        }
      }

      return {
        message: response.message?.content || 'I apologize, I had trouble processing that. Could you please repeat?',
        extractedInfo,
        usage: completion.usage
      };

    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Fallback responses for common scenarios
      const fallbackResponses = {
        symptoms: "I understand you're experiencing some symptoms. Could you describe what's bothering you today?",
        medication: "I'd be happy to help explain medications. What specific medication would you like to know about?",
        navigation: "I can help you find your way around the hospital. Where do you need to go?",
        default: "I'm here to help you with your hospital visit. How can I assist you today?"
      };

      // Simple keyword matching for fallback
      const lowerMessage = userMessage.toLowerCase();
      let fallbackMessage = fallbackResponses.default;

      if (lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('sick')) {
        fallbackMessage = fallbackResponses.symptoms;
      } else if (lowerMessage.includes('medicine') || lowerMessage.includes('medication') || lowerMessage.includes('pill')) {
        fallbackMessage = fallbackResponses.medication;
      } else if (lowerMessage.includes('where') || lowerMessage.includes('room') || lowerMessage.includes('find')) {
        fallbackMessage = fallbackResponses.navigation;
      }

      return {
        message: fallbackMessage,
        extractedInfo: null,
        error: 'AI service temporarily unavailable'
      };
    }
  }

  async explainMedication(medicationName, language = 'english') {
    try {
      const prompt = `Explain the medication "${medicationName}" in simple terms suitable for patients. Include:
1. What it's used for
2. Common side effects (if any)
3. Basic usage instructions
4. Any important warnings

Keep the explanation clear and reassuring. Respond in ${language}.
Always remind patients to follow their doctor's specific instructions.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful medical information assistant. Provide clear, simple explanations about medications for patients.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      return {
        message: completion.choices[0].message.content,
        medication: medicationName
      };

    } catch (error) {
      console.error('Medication explanation error:', error);
      return {
        message: `I'd be happy to help explain ${medicationName}, but I recommend speaking with your pharmacist or doctor for detailed information about this medication.`,
        medication: medicationName,
        error: 'Service temporarily unavailable'
      };
    }
  }

  async generateNavigationHelp(destination, currentLocation = 'main lobby', language = 'english') {
    const navigationMap = {
      'room 1a': 'Take the elevator to Floor 1, turn left, Room 1A is the third door on your right.',
      'room 2b': 'Take the elevator to Floor 2, turn right, Room 2B is at the end of the corridor.',
      'pharmacy': 'From the main lobby, head straight past the information desk. The pharmacy is on your left.',
      'laboratory': 'Take the elevator to Floor 1, turn right. The laboratory is the second door on your left.',
      'radiology': 'Take the elevator to Floor 2, turn left. Radiology department is at the end of the corridor.',
      'cafeteria': 'From the main lobby, take the stairs down to the ground floor. The cafeteria is straight ahead.',
      'toilet': 'The nearest restroom is down the hallway to your right, just past the waiting area.'
    };

    const lowerDestination = destination.toLowerCase();
    const directions = navigationMap[lowerDestination] || 
      `I'll help you find ${destination}. Please check with the information desk at the main lobby for specific directions.`;

    return {
      message: `Navigation Help: ${directions}`,
      destination,
      estimatedWalkTime: '2-5 minutes'
    };
  }
}

module.exports = new OpenAIService();