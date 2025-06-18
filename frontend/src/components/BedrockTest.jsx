import React, { useState, useEffect } from 'react';
import bedrockService from '../services/bedrockService';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BedrockTest = () => {
  const [userInput, setUserInput] = useState('');
  const [vitals, setVitals] = useState({
    systolic: '120',
    diastolic: '80',
    heart_rate: '75'
  });
  const [initialDiagnosis, setInitialDiagnosis] = useState('');
  const [healthTips, setHealthTips] = useState('');
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Load vitals and symptoms from sessionStorage on component mount
  // and automatically generate diagnosis
  useEffect(() => {
    console.log('BedrockTest component mounted');
    const storedVitals = sessionStorage.getItem('patientVitals');
    console.log('Stored vitals from sessionStorage:', storedVitals);
    
    if (storedVitals) {
      try {
        const parsedVitals = JSON.parse(storedVitals);
        console.log('Parsed vitals:', parsedVitals);
        
        setVitals({
          systolic: parsedVitals.systolic.toString(),
          diastolic: parsedVitals.diastolic.toString(),
          heart_rate: parsedVitals.heart_rate.toString()
        });
        setUserInput(parsedVitals.user_input || '');
        
        // Automatically get diagnosis
        console.log('Calling handleDiagnosis with:', parsedVitals);
        handleDiagnosis(parsedVitals);
      } catch (err) {
        console.error('Error parsing stored vitals:', err);
        setLoading(false);
        setError('Error loading patient data. Please try again.');
      }
    } else {
      // No stored vitals, show error
      console.log('No stored vitals found in sessionStorage');
      setLoading(false);
      setError('No patient data found. Please complete vitals collection first.');
    }
  }, []);

  const handleDiagnosis = async (data) => {
    console.log('handleDiagnosis called with data:', data);
    setLoading(true);
    setError('');
    
    const input = data.user_input || userInput;
    const vitalValues = {
      systolic: parseInt(data.systolic || vitals.systolic),
      diastolic: parseInt(data.diastolic || vitals.diastolic),
      heart_rate: parseInt(data.heart_rate || vitals.heart_rate)
    };
    
    console.log('Calling bedrockService.invokeModel with:', { input, vitalValues });
    
    try {
      // Include vitals in the request
      const result = await bedrockService.invokeModel(input, vitalValues);
      
      console.log('Bedrock response received:', result);
      
      // Check if result is an object with diagnosis and tips
      if (typeof result === 'object') {
        console.log('Result is an object with keys:', Object.keys(result));
        
        if (result.initialDiagnosis) {
          console.log('Setting initialDiagnosis:', result.initialDiagnosis);
          setInitialDiagnosis(result.initialDiagnosis);
        } else {
          console.log('No initialDiagnosis in result');
        }
        
        if (result.healthTips) {
          console.log('Setting healthTips:', result.healthTips);
          setHealthTips(result.healthTips);
        } else {
          console.log('No healthTips in result');
        }
      } else {
        // If it's just a string, show it as diagnosis
        console.log('Result is not an object, type:', typeof result);
        setInitialDiagnosis(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
      }
    } catch (err) {
      console.error('Bedrock test error:', err);
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Blood Pressure</p>
            <p className="font-medium">{vitals.systolic}/{vitals.diastolic} mmHg</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Heart Rate</p>
            <p className="font-medium">{vitals.heart_rate} bpm</p>
          </div>
        </div>
        {userInput && (
          <div className="mt-3">
            <p className="text-sm text-gray-600">Reported Symptoms</p>
            <p className="font-medium">{userInput}</p>
          </div>
        )}
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
      
      <div className="text-sm text-gray-500 mt-6 border-t pt-4">
        <p className="font-medium mb-1">Important Note:</p>
        <p>This is not a substitute for professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment.</p>
      </div>
    </div>
  );
};

export default BedrockTest;