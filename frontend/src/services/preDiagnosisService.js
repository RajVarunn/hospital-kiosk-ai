// Pre-diagnosis service using OpenAI API
const generatePreDiagnosis = async (patientData) => {
  try {
    const { symptoms, vitals, age, name } = patientData;
    
    // Format vitals for the prompt
    const vitalsText = vitals ? `
    - Heart Rate: ${vitals.heart_rate || 'N/A'} bpm
    - Blood Pressure: ${vitals.bp_systolic && vitals.bp_diastolic ? `${vitals.bp_systolic}/${vitals.bp_diastolic}` : 'N/A'} mmHg
    - Temperature: ${vitals.temperature || 'N/A'}°C
    - Oxygen Saturation: ${vitals.oxygen_saturation || 'N/A'}%
    ` : 'No vitals available';

    const prompt = `You are a medical AI assistant. Based on the following patient information, provide a preliminary assessment:

Patient: ${name || 'Unknown'}, Age: ${age || 'N/A'}
Chief Complaint/Symptoms: ${symptoms || 'No symptoms reported'}
Vital Signs: ${vitalsText}

Please provide a structured response in JSON format with the following fields:
{
  "summary": "Brief summary of the patient's condition",
  "possibleConditions": ["list of possible conditions based on symptoms and vitals"],
  "recommendedTests": ["list of recommended diagnostic tests"],
  "followUpQuestions": ["questions the doctor should ask"],
  "redFlags": ["any concerning symptoms that need immediate attention"],
  "urgencyLevel": "low/medium/high"
}

Important: This is for preliminary assessment only and should not replace professional medical judgment.`;

    const response = await fetch('/api/openai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a medical AI assistant providing preliminary assessments. Always emphasize that this is not a substitute for professional medical diagnosis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'gpt-3.5-turbo',
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Try to parse JSON response
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return {
        success: true,
        data: parsedResponse
      };
    } catch (parseError) {
      // If JSON parsing fails, create a structured response from the text
      return {
        success: true,
        data: {
          summary: aiResponse,
          possibleConditions: ['Unable to parse specific conditions'],
          recommendedTests: ['Consult with physician for appropriate tests'],
          followUpQuestions: ['Review symptoms with patient'],
          redFlags: [],
          urgencyLevel: 'medium'
        }
      };
    }

  } catch (error) {
    console.error('Error generating pre-diagnosis:', error);
    const { symptoms } = patientData;
    
    // Fallback response if API is not available
    if (error.message.includes('fetch')) {
      return {
        success: true,
        data: {
          summary: `Based on reported symptoms: "${symptoms || 'No symptoms reported'}" and available vitals, a preliminary assessment suggests monitoring and further evaluation may be needed.`,
          possibleConditions: ['Requires further clinical evaluation'],
          recommendedTests: ['Complete physical examination', 'Basic vital signs monitoring'],
          followUpQuestions: ['Please describe your symptoms in more detail', 'When did the symptoms start?', 'Any recent changes in health?'],
          redFlags: [],
          urgencyLevel: 'medium'
        }
      };
    }
    
    return {
      success: false,
      message: error.message || 'Failed to generate pre-diagnosis'
    };
  }
};

export default {
  generatePreDiagnosis
};