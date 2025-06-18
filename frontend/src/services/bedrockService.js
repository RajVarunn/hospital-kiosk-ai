import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Initialize the Bedrock client
const initializeClient = () => {
  const region = 'us-west-2';
  const accessKeyId = 'AKIA2Q5NVXLYLZ6MPR7K';
  const secretAccessKey = '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';

  if (!region || !accessKeyId || !secretAccessKey) {
    console.warn('AWS credentials not found in environment variables');
    return null;
  }

  return new BedrockRuntimeClient({
    region,
    credentials: { accessKeyId, secretAccessKey }
  });
};

const bedrockService = {
  /**
   * Invoke Bedrock model with a prompt
   */
  invokeModel: async (prompt, options = {}) => {
    const client = initializeClient();
    
    if (!client) {
      throw new Error('Bedrock client could not be initialized');
    }

    const modelId = 'us.deepseek.r1-v1:0';  // Updated model ID
    const temperature = options.temperature || 0.5;
    const topP = options.topP || 0.9;

    // Corrected request body format for the DeepSeek model
    const requestBody = {
      prompt: prompt,
      temperature: temperature,
      top_p: topP
    };

    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(requestBody),
      contentType: 'application/json',
      accept: 'application/json'
    });

    try {
      const response = await client.send(command);
      const bodyString = await new Response(response.body).text();
      const parsedResponse = JSON.parse(bodyString);

      return parsedResponse.content || parsedResponse;
    } catch (err) {
      console.error('Error invoking Bedrock model:', err);
      throw err;
    }
  },

  /**
   * Generate navigation instructions using Bedrock
   */
  generateNavigationInstructions: async (start, destination) => {
    const prompt = `Generate step-by-step navigation instructions from ${start} to ${destination} in a hospital. Keep the instructions clear, concise, and easy to follow.`;
    
    try {
      const response = await bedrockService.invokeModel(prompt);

      // Try to parse the response as JSON if it's a string
      if (typeof response === 'string') {
        try {
          return response.split('\n').filter(line => line.trim());
        } catch (e) {
          return [response];
        }
      }

      return response;
    } catch (err) {
      console.error('Error generating navigation instructions:', err);
      return ['Head towards your destination', 'Follow the signs', 'You will arrive at your destination'];
    }
  }
};

export default bedrockService;
