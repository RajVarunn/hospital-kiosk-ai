import React, { useState, useEffect } from 'react';
import bedrockService from '../services/bedrockService';
import dynamoService from '../services/dynamoService';
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
  const [source, setSource] = useState(''); // Track if assessment is from Bedrock or fallback
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
    
    try {
      // Call Lambda directly with the action parameter
      const response = await dynamoService.callLambda({
        action: 'bedrockTest',
        user_input: input,
        ...vitalValues
      });
      
      console.log('Health assessment raw response:', response);
      
      // Parse the response if it's in the Lambda API Gateway format
      let result = response;
      if (response && response.body && typeof response.body === 'string') {
        try {
          result = JSON.parse(response.body);
          console.log('Parsed result from body:', result);
        } catch (e) {
          console.error('Error parsing response body:', e);
        }
      }
      
      console.log('Health assessment processed result:', result);
      
      // Check if the result has initialDiagnosis and healthTips
      if (result && result.initialDiagnosis) {
        setInitialDiagnosis(result.initialDiagnosis);
        setHealthTips(result.healthTips || '');
        setSource(result.source || '');
      } 
      // Check if the result has a response field that can be parsed
      else if (result && result.response) {
        // Try to extract from response if available
        const diagnosisMatch = result.response.match(/Initial Diagnosis[:\-]?\s*([\s\S]*?)(?=\n+Health Tips[:\-]?|\n*$)/i);
        const tipsMatch = result.response.match(/Health Tips[:\-]?\s*([\s\S]*?)$/i);
        
        if (diagnosisMatch) {
          setInitialDiagnosis(diagnosisMatch[1].trim());
        }
        
        if (tipsMatch) {
          setHealthTips(tipsMatch[1].trim());
        }
        
        if (!diagnosisMatch && !tipsMatch) {
          setError('Could not parse health assessment response. Please try again.');
        }
      } 
      // Handle the case where the result is an empty object or doesn't have the expected fields
      else if (result && typeof result === 'object' && Object.keys(result).length === 0) {
        setError('Received empty response. Please try again.');
      }
      // Handle the case where the result is a string
      else if (typeof result === 'string') {
        setInitialDiagnosis(result);
      }
      // Handle the case where the result is undefined or null
      else {
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
        
        {/* Manual Input Form */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <h4 className="text-md font-medium mb-2">Enter Symptoms</h4>
          <div className="flex">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter symptoms here..."
              className="flex-1 p-2 border rounded-l"
            />
            <button
              onClick={() => handleDiagnosis({ 
                user_input: userInput,
                systolic: parseInt(vitals.systolic),
                diastolic: parseInt(vitals.diastolic),
                heart_rate: parseInt(vitals.heart_rate)
              })}
              className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
              disabled={loading || !userInput}
            >
              Generate
            </button>
          </div>
        </div>
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
                <span className="text-orange-600 font-medium">Fallback System</span>}
            </div>
          )}
        </div>
      )}
      
      {/* Debug Buttons - Only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 mb-2 space-y-2">
          <button
            onClick={async () => {
              const testInput = "headache and fever";
              const testVitals = {
                systolic: 120,
                diastolic: 80,
                heart_rate: 75
              };
              console.log('Running test with:', testInput, testVitals);
              
              try {
                setLoading(true);
                setError('');
                
                // Call Lambda directly
                const response = await dynamoService.callLambda({
                  action: 'bedrockTest',
                  user_input: testInput,
                  ...testVitals
                });
                
                console.log('Test assessment raw response:', response);
                
                // Parse the response if it's in the Lambda API Gateway format
                let result = response;
                if (response && response.body && typeof response.body === 'string') {
                  try {
                    result = JSON.parse(response.body);
                    console.log('Parsed test result from body:', result);
                  } catch (e) {
                    console.error('Error parsing test response body:', e);
                  }
                }
                
                console.log('Test assessment processed result:', result);
                
                // Check if the result has initialDiagnosis and healthTips
                if (result && result.initialDiagnosis) {
                  setInitialDiagnosis(result.initialDiagnosis);
                  setHealthTips(result.healthTips || '');
                  setSource(result.source || '');
                } else if (result && result.error) {
                  // Handle error response from Bedrock API
                  setError(`Bedrock API error: ${result.error} (Code: ${result.errorCode || 'unknown'})`);
                  console.error('Bedrock API error details:', result);
                } 
                // Check if the result has a response field that can be parsed
                else if (result && result.response) {
                  // Try to extract from response if available
                  const diagnosisMatch = result.response.match(/Initial Diagnosis[:\-]?\s*([\s\S]*?)(?=\n+Health Tips[:\-]?|\n*$)/i);
                  const tipsMatch = result.response.match(/Health Tips[:\-]?\s*([\s\S]*?)$/i);
                  
                  if (diagnosisMatch) {
                    setInitialDiagnosis(diagnosisMatch[1].trim());
                  }
                  
                  if (tipsMatch) {
                    setHealthTips(tipsMatch[1].trim());
                  }
                  
                  if (!diagnosisMatch && !tipsMatch) {
                    setError('Could not parse health assessment response. Please try again.');
                  }
                } 
                // Handle the case where the result is an empty object or doesn't have the expected fields
                else if (result && typeof result === 'object' && Object.keys(result).length === 0) {
                  setError('Received empty response. Please try again.');
                }
                // Handle the case where the result is a string
                else if (typeof result === 'string') {
                  setInitialDiagnosis(result);
                }
                // Handle the case where the result is undefined or null
                else {
                  setError('Could not generate health assessment. Please try again.');
                }
              } catch (err) {
                console.error('Test assessment error:', err);
                setError(`Error generating test assessment: ${err.message}`);
              } finally {
                setLoading(false);
              }
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mr-2"
          >
            Run Test Assessment
          </button>
          
          <button
            onClick={async () => {
              try {
                setLoading(true);
                setError('');
                const response = await dynamoService.callLambda({
                  action: 'bedrockTest',
                  user_input: 'Test connection to Lambda'
                });
                console.log('Lambda connection test result:', response);
                alert('Lambda connection successful! Check console for details.');
              } catch (err) {
                console.error('Lambda connection test failed:', err);
                setError(`Lambda connection test failed: ${err.message}`);
              } finally {
                setLoading(false);
              }
            }}
            className="px-4 py-2 bg-blue-200 text-blue-800 rounded hover:bg-blue-300 mr-2"
          >
            Test Lambda Connection
          </button>
          
          <button
            onClick={async () => {
              try {
                setLoading(true);
                setError('');
                
                // Call Lambda with debug flag to force Bedrock usage
                const response = await dynamoService.callLambda({
                  action: 'bedrockTest',
                  user_input: 'I have a headache and feel dizzy',
                  forceBedrock: true,
                  debug: true
                });
                
                console.log('Bedrock test result:', response);
                
                // Parse the response
                let result = response;
                if (response && response.body && typeof response.body === 'string') {
                  try {
                    result = JSON.parse(response.body);
                  } catch (e) {
                    console.error('Error parsing response:', e);
                  }
                }
                
                if (result && result.message) {
                  alert(`Bedrock test: ${result.message}\nCheck console for details.`);
                  
                  if (result.initialDiagnosis) {
                    setInitialDiagnosis(result.initialDiagnosis);
                    setHealthTips(result.healthTips || '');
                  }
                } else {
                  setError('Failed to get Bedrock response');
                }
              } catch (err) {
                console.error('Bedrock test error:', err);
                setError(`Bedrock test error: ${err.message}`);
              } finally {
                setLoading(false);
              }
            }}
            className="px-4 py-2 bg-green-200 text-green-800 rounded hover:bg-green-300"
          >
            Test Bedrock API
          </button>
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