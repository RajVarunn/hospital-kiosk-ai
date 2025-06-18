/**
 * Simplified bedrockTest function
 * Copy this into your index.mjs file to replace the current bedrockTest function
 */
async function bedrockTest(data) {
  console.log('bedrockTest called with data:', JSON.stringify(data));
  
  if (!data.user_input) {
    throw new Error('Missing required field: user_input');
  }
  
  // Get vitals information
  const systolic = data.systolic || 120;
  const diastolic = data.diastolic || 80;
  const heartRate = data.heart_rate || 75;
  
  const vitalsInfo = `Patient Vitals:
- Blood Pressure: ${systolic}/${diastolic} mmHg
- Heart Rate: ${heartRate} bpm`;

  // Generate a response based on symptoms
  const symptoms = data.user_input.toLowerCase();
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
  else if (symptoms.includes('dizzy') || symptoms.includes('dizziness')) {
    initialDiagnosis = "The symptoms suggest possible vertigo or inner ear disturbance. Blood pressure and heart rate should be monitored.";
    healthTips = "- Avoid sudden movements\n- Stay hydrated\n- Sit or lie down when feeling dizzy\n- Avoid driving or operating machinery\n- Consult a healthcare provider if symptoms persist";
  }
  else if (symptoms.includes('stomach') || symptoms.includes('nausea')) {
    initialDiagnosis = "The symptoms suggest gastric distress or possible gastroenteritis.";
    healthTips = "- Stay hydrated with clear fluids\n- Try bland foods like rice, toast, or bananas\n- Avoid spicy or fatty foods\n- Rest and monitor symptoms\n- Seek medical attention if unable to keep fluids down";
  }
  else {
    initialDiagnosis = "Based on the limited information provided and the vital signs, which are within normal ranges, this appears to be a mild condition.";
    healthTips = "- Rest and stay hydrated\n- Monitor symptoms for any changes\n- Over-the-counter medications may help manage symptoms\n- Maintain a balanced diet\n- Seek medical attention if symptoms worsen";
  }
  
  const fullResponse = `Initial Diagnosis:\n${initialDiagnosis}\n\nHealth Tips:\n${healthTips}`;
  
  return {
    message: 'Health assessment generated',
    user_input: data.user_input,
    vitals: vitalsInfo.trim(),
    initialDiagnosis: initialDiagnosis,
    healthTips: healthTips,
    response: fullResponse,
    source: 'system'
  };
}