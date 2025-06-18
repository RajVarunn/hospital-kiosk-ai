import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DirectBedrockTest = () => {
  const [userInput, setUserInput] = useState('');
  const [vitals, setVitals] = useState({
    systolic: '120',
    diastolic: '80',
    heart_rate: '75'
  });
  const [initialDiagnosis, setInitialDiagnosis] = useState('');
  const [healthTips, setHealthTips] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Direct API call to Bedrock using a proxy API
  const handleAssessment = async () => {
    if (!userInput) {
      setError('Please enter your symptoms');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Call the proxy API that has Bedrock permissions
      const response = await axios.post('https://eo9rlgmvwj.execute-api.us-west-2.amazonaws.com/prod/bedrock', {
        prompt: `You are a helpful and knowledgeable healthcare assistant. A patient has reported the following symptoms: "${userInput}". Their vital signs are:
        
        Patient Vitals:
        - Blood Pressure: ${vitals.systolic}/${vitals.diastolic} mmHg
        - Heart Rate: ${vitals.heart_rate} bpm
        
        Please provide your response in this exact format:
        
        Initial Diagnosis:
        [Your diagnosis here]
        
        Health Tips:
        [Your tips here]`,
        model: "anthropic.claude-v2"
      });
      
      console.log('Bedrock response:', response.data);
      
      if (response.data && response.data.completion) {
        const fullResponse = response.data.completion;
        
        // Parse the response to extract diagnosis and tips
        const diagnosisMatch = fullResponse.match(/Initial Diagnosis[:\-]?\s*([\s\S]*?)(?=\n+Health Tips[:\-]?|\n*$)/i);
        const tipsMatch = fullResponse.match(/Health Tips[:\-]?\s*([\s\S]*?)$/i);
        
        if (diagnosisMatch) {
          setInitialDiagnosis(diagnosisMatch[1].trim());
        }
        
        if (tipsMatch) {
          setHealthTips(tipsMatch[1].trim());
        }
        
        if (!diagnosisMatch && !tipsMatch) {
          setError('Could not parse health assessment response. Please try again.');
        }
      } else {
        setError('Could not generate health assessment. Please try again.');
      }
    } catch (err) {
      console.error('Health assessment error:', err);
      setError(`Error generating health assessment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold">Health Assessment</h2>
      </div>
      
      {/* Patient Information */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-medium mb-2 text-blue-800">Patient Information</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Systolic BP</label>
            <input
              type="number"
              value={vitals.systolic}
              onChange={(e) => setVitals({...vitals, systolic: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Diastolic BP</label>
            <input
              type="number"
              value={vitals.diastolic}
              onChange={(e) => setVitals({...vitals, diastolic: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Heart Rate</label>
            <input
              type="number"
              value={vitals.heart_rate}
              onChange={(e) => setVitals({...vitals, heart_rate: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Symptoms</label>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Describe your symptoms here..."
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>
        
        <button
          onClick={handleAssessment}
          disabled={loading || !userInput}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {loading ? 'Generating...' : 'Generate Health Assessment'}
        </button>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="mb-6 p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Generating your health assessment...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}
      
      {/* Results */}
      {!loading && (initialDiagnosis || healthTips) && (
        <div className="mb-6 space-y-6">
          {initialDiagnosis && (
            <div>
              <h3 className="text-lg font-medium mb-2 text-blue-800">Initial Diagnosis</h3>
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 whitespace-pre-wrap">
                {initialDiagnosis}
              </div>
            </div>
          )}
          
          {healthTips && (
            <div>
              <h3 className="text-lg font-medium mb-2 text-green-800">Health Tips</h3>
              <div className="bg-green-50 p-4 rounded-md border border-green-200 whitespace-pre-wrap">
                {healthTips}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DirectBedrockTest;