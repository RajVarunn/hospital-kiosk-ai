/**
 * Service for interacting with Amazon Bedrock
 */
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// AWS credentials - replace with your own or use environment variables
const AWS_CREDENTIALS = {
  region: 'us-west-2',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
};

// Initialize Bedrock client
let bedrockClient = null;

const initializeBedrockClient = () => {
  if (bedrockClient) return bedrockClient;
  
  // Get environment variables
  const region = AWS_CREDENTIALS.region;
  const accessKeyId = AWS_CREDENTIALS.accessKeyId;
  const secretAccessKey = AWS_CREDENTIALS.secretAccessKey;
  
  // Check if credentials are available
  if (!accessKeyId || !secretAccessKey) {
    console.warn('AWS credentials not found in environment variables');
    return null;
  }
  
  bedrockClient = new BedrockRuntimeClient({
    region,
    credentials: { accessKeyId, secretAccessKey }
  });
  
  return bedrockClient;
};

const bedrockService = {
  /**
   * Generate pre-diagnosis using Bedrock
   * @param {Object} patientData - Patient data including symptoms and vitals
   * @returns {Object} - Pre-diagnosis data
   */
  generatePreDiagnosis: async (patientData) => {
    try {
      const client = initializeBedrockClient();
      if (!client) {
        throw new Error('Failed to initialize Bedrock client');
      }
      
      // Format patient data for the prompt
      const { 
        user_input, 
        height, 
        weight, 
        systolic, 
        diastolic, 
        heart_rate,
        medical_history = []
      } = patientData;
      
      // Create prompt for Bedrock
      const prompt = `
        You are a medical AI assistant. A patient has reported the following:
        
        Chief complaint: "${user_input || 'No complaint reported'}"
        
        Vital signs:
        Height: ${height || 'N/A'} cm
        Weight: ${weight || 'N/A'} kg
        Blood Pressure: ${systolic || 'N/A'}/${diastolic || 'N/A'} mmHg
        Heart Rate: ${heart_rate || 'N/A'} bpm
        
        Medical history: ${medical_history.join(', ') || 'None reported'}
        
        Please provide a pre-diagnosis in the following JSON format:
        {
          "summary": "Brief summary of the situation",
          "possibleConditions": ["Condition 1", "Condition 2", "Condition 3"],
          "recommendedTests": ["Test 1", "Test 2", "Test 3"],
          "followUpQuestions": ["Question 1?", "Question 2?", "Question 3?"],
          "redFlags": ["Red flag 1", "Red flag 2"]
        }
      `;
      
      // Call Bedrock
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7
        })
      });
      
      const response = await client.send(command);
      
      // Parse Bedrock response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const aiResponse = responseBody?.content?.[0]?.text || '';
      
      // Extract JSON from response
      let preDiagnosis;
      try {
        // Find JSON in the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          preDiagnosis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (e) {
        console.error("Error parsing AI response:", e);
        preDiagnosis = {
          summary: "Could not generate structured pre-diagnosis",
          possibleConditions: [],
          recommendedTests: [],
          followUpQuestions: [],
          redFlags: []
        };
      }
      
      return {
        success: true,
        message: "Pre-diagnosis generated successfully",
        data: preDiagnosis
      };
    } catch (error) {
      console.error('Error generating pre-diagnosis with Bedrock:', error);
      return {
        success: false,
        message: `Failed to generate pre-diagnosis: ${error.message}`,
        data: null
      };
    }
  },
  
  /**
   * For mock data - generate a pre-diagnosis without calling Bedrock
   */
  generateMockPreDiagnosis: (patientData) => {
    const { user_input, medical_history = [] } = patientData;
    
    // Create a simple mock pre-diagnosis based on the input
    return {
      success: true,
      message: "Mock pre-diagnosis generated successfully",
      data: {
        summary: `Patient reported: "${user_input || 'No complaint'}". Medical history includes ${medical_history.join(', ') || 'no reported conditions'}.`,
        possibleConditions: ["Common Cold", "Seasonal Allergies", "Stress"],
        recommendedTests: ["Basic Blood Panel", "Vital Signs Check"],
        followUpQuestions: ["How long have you been experiencing these symptoms?", "Any recent changes in diet or routine?"],
        redFlags: []
      }
    };
  }
};

export default bedrockService;