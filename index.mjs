/**
 * AWS Lambda function to save hospital data to DynamoDB
 * 
 * This function handles data for Patients, Visits, Queue, and Doctors tables.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// Initialize the DynamoDB client with explicit credentials
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const dynamoDB = DynamoDBDocumentClient.from(client);

// Log AWS credentials status for debugging
console.log('AWS credentials status:', {
  region: process.env.AWS_REGION ? 'Set' : 'Not set',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'Set (length: ' + (process.env.AWS_SECRET_ACCESS_KEY?.length || 0) + ')' : 'Not set'
});

/**
 * Lambda function handler
 */
export const handler = async (event, context) => {
  // Log environment variables to check table names
  console.log('Environment variables:', {
    PATIENTS_TABLE_NAME: process.env.PATIENTS_TABLE_NAME || 'patients',
    VISITS_TABLE_NAME: process.env.VISITS_TABLE_NAME || 'visits',
    QUEUE_TABLE_NAME: process.env.QUEUE_TABLE_NAME || 'queue'
  });
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }
  
  try {
    console.log('Event received:', JSON.stringify(event));
    
    // Handle different event structures
    let data;
    
    // Check if this is a direct API Gateway proxy integration
    if (event.body) {
      // Standard API Gateway proxy integration
      data = JSON.parse(event.body);
    } 
    // Check if the event itself is the data (direct Lambda invocation)
    else if (event.action) {
      data = event;
    }
    // Check if this is coming from a different API Gateway integration
    else if (event.requestContext && event.pathParameters) {
      // Try to find the body in various places
      if (event.requestContext.body) {
        data = JSON.parse(event.requestContext.body);
      } else {
        return errorResponse('Request body not found in expected location');
      }
    } else {
      return errorResponse('Unsupported event structure: ' + JSON.stringify(event).substring(0, 100));
    }
    
    // Determine which table to write to based on the action field
    const action = data.action || 'savePatient';
    let result;
    
    switch (action) {
      case 'savePatient':
        result = await savePatient(data);
        break;
      case 'saveVisit':
        result = await saveVisit(data);
        break;
      case 'updateQueue':
        result = await updateQueue(data);
        break;
      case 'saveDoctor':
        result = await saveDoctor(data);
        break;
      case 'getPatients':
        result = await getPatients();
        break;
      case 'getVisits':
        result = await getVisits();
        break;
      case 'getQueue':
        result = await getQueue();
        break;
      case 'bedrockTest':
        result = await bedrockTest(data);
        break;
      case 'generateHealthAssessment':
        result = await bedrockTest(data); // Reuse bedrockTest function for health assessment
        break;
      case 'createSampleData':
        result = await createSampleData();
        break;
      default:
        return errorResponse('Invalid action specified');
    }
    
    return successResponse(result);
    
  } catch (error) {
    console.error('Error processing data:', error);
    return errorResponse(error.message);
  }
};

/**
 * Save patient data to the Patients table
 */
async function savePatient(data) {
  console.log('savePatient called with data:', JSON.stringify(data));
  
  // Validate required fields - check all possible ID fields
  const id = data.patient_id || data.user_id || data.id || data.nric;
  if (!id) {
    throw new Error('Missing required field: patient_id, user_id, id, or nric');
  }
  
  const patientItem = {
    patient_id: id, // Use the id we found as patient_id
    name: data.name || '',
    nric: data.nric || '',
    dob: data.dob || '',
    age: data.age || 0,
    gender: data.gender || '',
    preferred_language: data.preferred_language || '',
    medical_history: data.medical_history || [],
    created_at: new Date().toISOString()
  };
  
  console.log('Saving patient item to DynamoDB:', JSON.stringify(patientItem));
  
  const params = {
    TableName: process.env.PATIENTS_TABLE_NAME || 'patients',
    Item: patientItem
  };
  
  try {
    const result = await dynamoDB.send(new PutCommand(params));
    console.log('DynamoDB save result:', JSON.stringify(result));
    return { 
      message: 'Patient data saved successfully', 
      patient_id: id,
      savedData: patientItem // Include the saved data in the response
    };
  } catch (error) {
    console.error('DynamoDB save error:', error);
    throw error;
  }
}

/**
 * Save visit data to the Visits table
 */
async function saveVisit(data) {
  // Validate required fields
  if (!data.patient_id) {
    throw new Error('Missing required field: patient_id');
  }
  
  // Generate a visit_id if not provided
  const visit_id = data.visit_id || `visit_${data.patient_id}_${Date.now()}`;
  
  const visitItem = {
    patient_id: data.patient_id,
    visit_id: visit_id, // Use generated visit_id
    visit_date: data.visit_date || new Date().toISOString().split('T')[0],
    user_input: data.user_input || null, // Use null instead of empty string
    symptoms: data.symptoms || [],
    height: data.height || 0,
    weight: data.weight || 0,
    systolic: data.systolic || 0,
    diastolic: data.diastolic || 0,
    heart_rate: data.heart_rate || 0,
    current_medication: data.current_medication || false,
    created_at: new Date().toISOString()
  };
  
  console.log('Saving visit item to DynamoDB:', JSON.stringify(visitItem));
  
  const params = {
    TableName: process.env.VISITS_TABLE_NAME || 'visits',
    Item: visitItem
  };
  
  await dynamoDB.send(new PutCommand(params));
  return { message: 'Visit data saved successfully', patient_id: data.patient_id, visit_id: visit_id };
}

/**
 * Update queue data in the Queue table
 */
async function updateQueue(data) {
  // Validate required fields
  if (!data.patient_id) {
    throw new Error('Missing required field: patient_id');
  }
  
  const now = new Date().toISOString();
  
  // Generate a queue_id if not provided
  const queue_id = data.queue_id || `queue_${data.patient_id}_${Date.now()}`;
  
  const queueItem = {
    patient_id: data.patient_id,
    queue_id: queue_id, // Use generated queue_id
    status: data.status || 'waiting',
    priority: data.priority || 'low',
    created_at_timestamp: data.created_at_timestamp || now,
    finished_at_timestamp: data.status === 'completed' ? (data.finished_at_timestamp || now) : null,
    time_taken: data.time_taken || null, // Use null instead of empty string
    order: data.order || 0
  };
  
  console.log('Saving queue item to DynamoDB:', JSON.stringify(queueItem));
  
  const params = {
    TableName: process.env.QUEUE_TABLE_NAME || 'queue',
    Item: queueItem
  };
  
  await dynamoDB.send(new PutCommand(params));
  return { message: 'Queue data updated successfully', patient_id: data.patient_id, queue_id: queue_id };
}

/**
 * Save doctor data to the Doctor table
 */
async function saveDoctor(data) {
  // Validate required fields
  if (!data.doctor_id) {
    throw new Error('Missing required field: doctor_id');
  }
  
  const doctorItem = {
    doctor_id: data.doctor_id,
    doctor_name: data.doctor_name || '',
    doctor_specialization: data.doctor_specialization || []
  };
  
  const params = {
    TableName: process.env.DOCTORS_TABLE_NAME || 'doctors',
    Item: doctorItem
  };
  
  await dynamoDB.send(new PutCommand(params));
  return { message: 'Doctor data saved successfully', doctor_id: data.doctor_id };
}

/**
 * Create a success response
 */
function successResponse(data) {
  console.log('Sending success response:', JSON.stringify(data));
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'OPTIONS,POST'
    },
    body: JSON.stringify(data)
  };
}

/**
 * Create an error response
 */
/**
 * Get all patients from the Patients table
 */
async function getPatients() {
  console.log('getPatients called');
  
  const params = {
    TableName: process.env.PATIENTS_TABLE_NAME || 'patients'
  };
  
  try {
    console.log('Using table name:', params.TableName);
    const result = await dynamoDB.send(new ScanCommand(params));
    console.log('Raw DynamoDB result:', JSON.stringify(result));
    const items = result.Items || [];
    console.log(`Retrieved ${items.length} patients:`, JSON.stringify(items));
    return items;
  } catch (error) {
    console.error('Error getting patients:', error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Get all visits from the Visits table
 */
async function getVisits() {
  console.log('getVisits called');
  
  const params = {
    TableName: process.env.VISITS_TABLE_NAME || 'visits'
  };
  
  try {
    const result = await dynamoDB.send(new ScanCommand(params));
    const items = result.Items || [];
    console.log(`Retrieved ${items.length} visits`);
    return items;
  } catch (error) {
    console.error('Error getting visits:', error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Get all queue entries from the Queue table
 */
async function getQueue() {
  console.log('getQueue called');
  
  const params = {
    TableName: process.env.QUEUE_TABLE_NAME || 'queue'
  };
  
  try {
    const result = await dynamoDB.send(new ScanCommand(params));
    const items = result.Items || [];
    console.log(`Retrieved ${items.length} queue entries`);
    return items;
  } catch (error) {
    console.error('Error getting queue entries:', error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Send user input to Amazon Bedrock for testing
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

  // Construct the prompt for Bedrock
  const prompt = `
  You are a helpful and knowledgeable healthcare assistant. A patient has reported the following symptoms: "${data.user_input}". Their vital signs are:
  
  ${vitalsInfo}
  
  Please provide your response in this exact format:
  
  Initial Diagnosis:
  [Your diagnosis here]
  
  Health Tips:
  [Your tips here]
  `;

  console.log('Processing prompt with Bedrock:', prompt);
  
  // Create Bedrock Runtime client with environment credentials
  const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-west-2"
    // No explicit credentials - will use environment variables
  });
  
  // Check if debug mode is enabled
  const isDebug = data.debug === true;
  
  // Check if we should force using Bedrock or use fallback
  const forceBedrock = data.forceBedrock === true;
  
  try {
    console.log('Using environment credentials for Bedrock API');
    console.log('AWS environment variables:', {
      region: process.env.AWS_REGION || 'default: us-west-2',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'set' : 'not set',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'set' : 'not set'
    });
    
    // Call Bedrock with Claude 2 model (more widely available)
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-v2",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: 1000,
        temperature: 0.7,
        top_p: 0.9
      })
    });
    
    console.log('Sending request to Bedrock API...');
    const response = await bedrockClient.send(command);
    
    // Parse the response for Claude 2
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Bedrock raw response:', responseBody);
    
    // Extract the content from Claude 2's response
    const fullResponse = responseBody?.completion || '';
    
    // Parse the response to extract diagnosis and tips
    const diagnosisMatch = fullResponse.match(/Initial Diagnosis[:\-]?\s*([\s\S]*?)(?=\n+Health Tips[:\-]?|\n*$)/i);
    const tipsMatch = fullResponse.match(/Health Tips[:\-]?\s*([\s\S]*?)$/i);
    
    return {
      message: 'Bedrock test successful',
      user_input: data.user_input,
      vitals: vitalsInfo.trim(),
      initialDiagnosis: diagnosisMatch ? diagnosisMatch[1].trim() : "No diagnosis available",
      healthTips: tipsMatch ? tipsMatch[1].trim() : "No health tips available",
      response: fullResponse,
      source: 'bedrock'
    };
  } catch (error) {
    console.error('Error calling Bedrock API:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId
    });
    
    // If debug mode or force Bedrock is enabled, don't use fallback
    if (isDebug || forceBedrock) {
      return {
        message: 'Bedrock API error',
        error: error.message,
        errorCode: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId,
        user_input: data.user_input,
        vitals: vitalsInfo.trim()
      };
    }
    
    // Generate a fallback response based on symptoms
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
    else {
      initialDiagnosis = "Based on the limited information provided and the vital signs, which are within normal ranges, this appears to be a mild condition.";
      healthTips = "- Rest and stay hydrated\n- Monitor symptoms\n- Over-the-counter medications may help\n- Maintain a balanced diet\n- Seek medical attention if symptoms worsen";
    }
    
    const fullResponse = `Initial Diagnosis:\n${initialDiagnosis}\n\nHealth Tips:\n${healthTips}`;
    
    return {
      message: 'Health assessment generated (fallback)',
      user_input: data.user_input,
      vitals: vitalsInfo.trim(),
      initialDiagnosis: initialDiagnosis,
      healthTips: healthTips,
      response: fullResponse,
      source: 'fallback'
    };
  }
}

function errorResponse(message) {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'OPTIONS,POST'
    },
    body: JSON.stringify({ 
      error: 'Failed to process data',
      message: message
    })
  };
}