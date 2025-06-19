/**
 * Service for interacting with OpenAI API
 */
import axios from 'axios';
import { debugLog } from './debugHelper';

// OpenAI API endpoint - this would typically come from environment variables
const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

const openaiService = {
  /**
   * Generate health assessment using OpenAI
   * @param {Object} data - Patient data including symptoms and vitals
   * @returns {Object} - Health assessment data
   */
  generateHealthAssessment: async (data) => {
    debugLog('openaiService.generateHealthAssessment called with', data);
    
    try {
      // Get API key from environment variables
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key not found in environment variables');
      }
      
      // Format patient data for the prompt
      const { 
        user_input, 
        systolic, 
        diastolic, 
        heart_rate,
        medical_history = []
      } = data;
      
      // Create messages for OpenAI
      const messages = [
        {
          role: "system",
          content: `You are a medical AI assistant providing preliminary health assessments. 
          Your task is to analyze the patient's symptoms and vital signs, then provide:
          1. An initial diagnosis (what might be causing the symptoms)
          2. Health tips (what the patient should do next)
          
          Format your response in two clearly labeled sections:
          
          Initial Diagnosis: [your assessment]
          
          Health Tips: [your recommendations]
          
          Be professional but approachable. Do not make definitive medical diagnoses, 
          and always recommend consulting with a healthcare professional.`
        },
        {
          role: "user",
          content: `Patient reported symptoms: "${user_input || 'No symptoms reported'}"
          
          Vital signs:
          Blood Pressure: ${systolic || 'N/A'}/${diastolic || 'N/A'} mmHg
          Heart Rate: ${heart_rate || 'N/A'} bpm
          
          Medical history: ${medical_history?.join(', ') || 'None reported'}
          
          Please provide an initial diagnosis and health tips.`
        }
      ];
      
      // Call OpenAI API
      const response = await axios.post(
        OPENAI_API_ENDPOINT,
        {
          model: "gpt-4o-mini", // Use a suitable model
          messages: messages,
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      // Process the response
      const aiResponse = response.data.choices[0].message.content;
      
      // Extract sections from the response
      const initialDiagnosisMatch = aiResponse.match(/Initial Diagnosis:?\s*([\s\S]*?)(?=\n+Health Tips:|\n*$)/i);
      const healthTipsMatch = aiResponse.match(/Health Tips:?\s*([\s\S]*?)$/i);
      
      const initialDiagnosis = initialDiagnosisMatch ? initialDiagnosisMatch[1].trim() : '';
      const healthTips = healthTipsMatch ? healthTipsMatch[1].trim() : '';
      
      return {
        success: true,
        initialDiagnosis,
        healthTips,
        source: 'openai',
        response: aiResponse // Include full response for debugging
      };
    } catch (error) {
      console.error('Error generating health assessment with OpenAI:', error);
      return {
        success: false,
        message: `Failed to generate health assessment: ${error.message}`,
        initialDiagnosis: 'Unable to generate assessment at this time.',
        healthTips: 'Please consult with a healthcare professional.',
        source: 'error'
      };
    }
  }
};

export default openaiService;