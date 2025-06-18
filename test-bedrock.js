/**
 * Test script to verify Bedrock access
 * Run with: node test-bedrock.js
 */

// Import AWS SDK v2
const AWS = require('aws-sdk');

// Configure AWS SDK with your credentials
AWS.config.update({ 
  region: 'us-west-2',
  // Replace with your actual credentials
  credentials: {
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY'
  }
});

// Create Bedrock Runtime client
const bedrockRuntime = new AWS.BedrockRuntime();

// Simple test function
async function testBedrock() {
  try {
    console.log('Testing Bedrock API access...');
    
    const params = {
      modelId: 'anthropic.claude-v2',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        prompt: "\n\nHuman: You are a helpful assistant. Please respond with a simple \"Hello, I'm Claude!\" to confirm you're working.\n\nAssistant:",
        max_tokens_to_sample: 100,
        temperature: 0.7,
        top_p: 0.9
      })
    };
    
    console.log('Sending request to Bedrock API...');
    const response = await bedrockRuntime.invokeModel(params).promise();
    
    // Parse the response
    const responseBody = JSON.parse(response.body.toString());
    console.log('Bedrock response:', responseBody);
    
    console.log('Test successful!');
  } catch (error) {
    console.error('Error calling Bedrock API:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  }
}

// Run the test
testBedrock();