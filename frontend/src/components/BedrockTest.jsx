import React, { useState } from 'react';
import bedrockService from '../services/bedrockService';

const BedrockTest = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await bedrockService.invokeModel(prompt);
      setResponse(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Bedrock test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Llama 4 Test</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your prompt:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="Enter a prompt for Llama 4..."
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </form>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}
      
      {response && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Response:</h3>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96 whitespace-pre-wrap">
            {response}
          </pre>
        </div>
      )}
      
      <div className="text-sm text-gray-500">
        <p>Note: If you see an error about inference profiles, you'll need to create one in AWS Bedrock console</p>
      </div>
    </div>
  );
};

export default BedrockTest;