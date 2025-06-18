import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateHealthAssessment, generateFallbackAssessment } from '../services/healthService';

const SimpleHealthAssessment = () => {
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
  const [source, setSource] = useState('');
  const navigate = useNavigate();

  const handleAssessment = async () => {
    if (!userInput) {
      setError('Please enter your symptoms');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Try to use the Lambda function first
      const result = await generateHealthAssessment(userInput, vitals);
      
      console.log('Health assessment result:', result);
      
      if (result.initialDiagnosis) {
        setInitialDiagnosis(result.initialDiagnosis);
        setHealthTips(result.healthTips || '');
        setSource(result.source || 'api');
      } else {
        setError('Could not generate health assessment. Please try again.');
      }
    } catch (err) {
      console.error('Health assessment error:', err);
      
      // If the Lambda function fails, use the fallback
      try {
        console.log('Using fallback assessment');
        const fallbackResult = generateFallbackAssessment(userInput, vitals);
        
        setInitialDiagnosis(fallbackResult.initialDiagnosis);
        setHealthTips(fallbackResult.healthTips);
        setSource(fallbackResult.source);
      } catch (fallbackErr) {
        setError(`Error generating health assessment: ${err.message}`);
      }
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
        <h2 className="text-2xl font-bold">Simple Health Assessment</h2>
      </div>
      
      {/* Input Form */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-medium mb-4 text-blue-800">Enter Your Information</h3>
        
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
          
          {/* Source indicator - only in development mode */}
          {process.env.NODE_ENV === 'development' && source && (
            <div className="text-xs text-gray-500 mt-2">
              Source: {source === 'bedrock' ? 
                <span className="text-green-600 font-medium">Bedrock AI</span> : 
                source === 'local' ?
                <span className="text-orange-600 font-medium">Local Fallback</span> :
                <span className="text-blue-600 font-medium">API</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleHealthAssessment;