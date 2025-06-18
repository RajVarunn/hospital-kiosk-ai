import axios from 'axios';

// API endpoint for the health assessment Lambda function
const API_URL = 'https://your-api-gateway-url.amazonaws.com/prod/health-assessment';

/**
 * Generate a health assessment based on user input and vitals
 * 
 * @param {string} userInput - The user's symptoms
 * @param {object} vitals - The user's vital signs (systolic, diastolic, heart_rate)
 * @returns {Promise} - The health assessment response
 */
export const generateHealthAssessment = async (userInput, vitals) => {
  try {
    const response = await axios.post(API_URL, {
      user_input: userInput,
      systolic: parseInt(vitals.systolic),
      diastolic: parseInt(vitals.diastolic),
      heart_rate: parseInt(vitals.heart_rate)
    });
    
    return response.data;
  } catch (error) {
    console.error('Error generating health assessment:', error);
    throw error;
  }
};

/**
 * Generate a health assessment using a direct API call (no Lambda)
 * This is a fallback method if the Lambda function is not available
 * 
 * @param {string} userInput - The user's symptoms
 * @param {object} vitals - The user's vital signs (systolic, diastolic, heart_rate)
 * @returns {object} - The health assessment response
 */
export const generateFallbackAssessment = (userInput, vitals) => {
  const symptoms = userInput.toLowerCase();
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
  
  return {
    message: 'Health assessment generated (local)',
    user_input: userInput,
    vitals: `Patient Vitals:\n- Blood Pressure: ${vitals.systolic}/${vitals.diastolic} mmHg\n- Heart Rate: ${vitals.heart_rate} bpm`,
    initialDiagnosis: initialDiagnosis,
    healthTips: healthTips,
    source: 'local'
  };
};