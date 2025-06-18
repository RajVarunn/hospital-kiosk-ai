/**
 * Simple proxy API for Bedrock
 * Deploy this as a separate Lambda function if you want to host your own proxy
 */
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-west-2' });

// Create Bedrock Runtime client
const bedrockRuntime = new AWS.BedrockRuntime();

exports.handler = async (event) => {
  // Set up CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { prompt, model = 'anthropic.claude-v2' } = body;
    
    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing prompt parameter' })
      };
    }
    
    // Call Bedrock
    const params = {
      modelId: model,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: 1000,
        temperature: 0.7,
        top_p: 0.9
      })
    };
    
    const response = await bedrockRuntime.invokeModel(params).promise();
    const responseBody = JSON.parse(response.body.toString());
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseBody)
    };
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};