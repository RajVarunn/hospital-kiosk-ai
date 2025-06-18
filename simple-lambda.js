/**
 * Simple Lambda function that only handles health assessments using Bedrock
 */

// Import the AWS SDK v2 for better Lambda compatibility
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-west-2' });

// Create Bedrock Runtime client
const bedrockRuntime = new AWS.BedrockRuntime();

/**
 * Lambda function handler
 */
exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));
  
  try {
    // Parse the request body
    let data;
    if (event.body) {
      data = JSON.parse(event.body);
    } else {
      data = event;
    }
    
    // Validate required fields
    if (!data.user_input) {
      return errorResponse('Missing required field: user_input');
    }
    
    // Get vitals information
    const systolic = data.systolic || 120;
    const diastolic = data.diastolic || 80;
    const heartRate = data.heart_rate || 75;
    
    const vitalsInfo = `Patient Vitals:
- Blood Pressure: ${systolic}/${diastolic} mmHg
- Heart Rate: ${heartRate} bpm`;

    // Construct the prompt for Bedrock
    const prompt = `
You are a helpful and knowledgeable healthcare assistant. A patient has reported the following symptoms: "${data.user_input}". Their vital signs are:

${vitalsInfo}

Please provide your response in this exact format:

Initial Diagnosis:
[Your diagnosis here]

Health Tips:
[Your tips here]
`;

    console.log('Processing prompt with Bedrock:', prompt);
    
    try {
      // Call Bedrock with Claude 2 model
      const params = {
        modelId: 'anthropic.claude-v2',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
          max_tokens_to_sample: 1000,
          temperature: 0.7,
          top_p: 0.9
        })
      };
      
      console.log('Sending request to Bedrock API...');
      const response = await bedrockRuntime.invokeModel(params).promise();
      
      // Parse the response
      const responseBody = JSON.parse(response.body.toString());
      console.log('Bedrock raw response:', responseBody);
      
      // Extract the content from Claude's response
      const fullResponse = responseBody.completion || '';
      
      // Parse the response to extract diagnosis and tips
      const diagnosisMatch = fullResponse.match(/Initial Diagnosis[:\-]?\s*([\s\S]*?)(?=\n+Health Tips[:\-]?|\n*$)/i);
      const tipsMatch = fullResponse.match(/Health Tips[:\-]?\s*([\s\S]*?)$/i);
      
      return successResponse({
        message: 'Health assessment successful',
        user_input: data.user_input,
        vitals: vitalsInfo.trim(),
        initialDiagnosis: diagnosisMatch ? diagnosisMatch[1].trim() : "No diagnosis available",
        healthTips: tipsMatch ? tipsMatch[1].trim() : "No health tips available",
        response: fullResponse,
        source: 'bedrock'
      });
    } catch (error) {
      console.error('Error calling Bedrock API:', error);
      
      // Generate a fallback response based on symptoms
      const symptoms = data.user_input.toLowerCase();
      let initialDiagnosis = '';
      let healthTips = '';
      
      if (symptoms.includes('headache')) {
        initialDiagnosis = "Based on the symptoms described and vital signs provided, this appears to be a tension headache. The blood pressure and heart rate are within normal ranges, which is reassuring.";
        healthTips = "- Rest in a quiet, dark room\n- Apply a cold or warm compress to the forehead\n- Practice relaxation techniques\n- Consider over-the-counter pain relievers\n- Maintain good posture";
      } 
      else if (symptoms.includes('fever')) {
        initialDiagnosis = "The patient is experiencing fever, which is often a sign that the body is fighting an infection. This could be a viral infection such as a common cold or flu.";
        healthTips = "- Rest and get plenty of sleep\n- Stay hydrated\n- Take fever reducers as directed\n- Monitor temperature\n- Seek medical attention if fever persists";
      }
      else if (symptoms.includes('cough') || symptoms.includes('cold')) {
        initialDiagnosis = "The symptoms suggest an upper respiratory infection, likely a common cold or mild bronchitis.";
        healthTips = "- Rest and stay hydrated\n- Use over-the-counter cold medications as directed\n- Use a humidifier\n- Gargle with warm salt water\n- Seek medical attention if symptoms persist";
      }
      else {
        initialDiagnosis = "Based on the limited information provided and the vital signs, which are within normal ranges, this appears to be a mild condition.";
        healthTips = "- Rest and stay hydrated\n- Monitor symptoms\n- Over-the-counter medications may help\n- Maintain a balanced diet\n- Seek medical attention if symptoms worsen";
      }
      
      const fullResponse = `Initial Diagnosis:\n${initialDiagnosis}\n\nHealth Tips:\n${healthTips}`;
      
      return successResponse({
        message: 'Health assessment generated (fallback)',
        user_input: data.user_input,
        vitals: vitalsInfo.trim(),
        initialDiagnosis: initialDiagnosis,
        healthTips: healthTips,
        response: fullResponse,
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return errorResponse(error.message);
  }
};

/**
 * Create a success response
 */
function successResponse(data) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'OPTIONS,POST'
    },
    body: JSON.stringify(data)
  };
}

/**
 * Create an error response
 */
function errorResponse(message) {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'OPTIONS,POST'
    },
    body: JSON.stringify({ 
      error: 'Failed to process data',
      message: message
    })
  };
}