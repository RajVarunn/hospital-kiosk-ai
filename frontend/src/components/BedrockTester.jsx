import React, { useState } from 'react';
import dynamoService from '../services/dynamoService';

const BedrockTester = () => {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const result = await dynamoService.bedrockTest(userInput);
      setResponse(result.response || JSON.stringify(result));
    } catch (err) {
      console.error('Bedrock test error:', err);
      setError(err.message || 'Failed to process your input');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Amazon Bedrock Tester</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="userInput" className="block text-sm font-medium text-gray-700 mb-1">
            Enter your prompt:
          </label>
          <textarea
            id="userInput"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            rows="4"
            placeholder="Type your prompt here..."
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !userInput.trim()}
          className={`px-4 py-2 rounded-lg text-white ${
            loading || !userInput.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : 'Submit to Bedrock'}
        </button>
      </form>
      
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {response && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Response:</h3>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg whitespace-pre-wrap">
            {response}
          </div>
        </div>
      )}
    </div>
  );
};

export default BedrockTester;