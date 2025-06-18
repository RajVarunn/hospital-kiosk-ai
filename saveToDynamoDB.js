/**
 * AWS Lambda function to save hospital data to DynamoDB
 * 
 * This function handles data for Patients, Visits, Queue, and Doctors tables.
 */

const AWS = require('aws-sdk');

// Initialize the DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Lambda function handler
 * @param {Object} event - API Gateway event object
 * @param {Object} context - Lambda context
 * @returns {Object} HTTP response
 */
exports.handler = async (event, context) => {
  try {
    // Parse the incoming data from the request body
    const data = JSON.parse(event.body);
    
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
  // Validate required fields
  if (!data.user_id) {
    throw new Error('Missing required field: user_id');
  }
  
  const patientItem = {
    user_id: data.user_id,
    name: data.name || '',
    nric: data.nric || '',
    dob: data.dob || '',
    age: data.age || 0,
    gender: data.gender || '',
    preferred_language: data.preferred_language || '',
    medical_history: data.medical_history || [],
    created_at: new Date().toISOString()
  };
  
  const params = {
    TableName: process.env.PATIENTS_TABLE_NAME || 'patients',
    Item: patientItem
  };
  
  await dynamoDB.put(params).promise();
  return { message: 'Patient data saved successfully', user_id: data.user_id };
}

/**
 * Save visit data to the Visits table
 */
async function saveVisit(data) {
  // Validate required fields
  if (!data.patient_id) {
    throw new Error('Missing required field: patient_id');
  }
  
  const visitItem = {
    patient_id: data.patient_id,
    visit_date: data.visit_date || new Date().toISOString().split('T')[0],
    user_input: data.user_input || '',
    symptoms: data.symptoms || [],
    height: data.height || 0,
    weight: data.weight || 0,
    systolic: data.systolic || 0,
    diastolic: data.diastolic || 0,
    heart_rate: data.heart_rate || 0,
    current_medication: data.current_medication || false,
    created_at: new Date().toISOString()
  };
  
  const params = {
    TableName: process.env.VISITS_TABLE_NAME || 'visits',
    Item: visitItem
  };
  
  await dynamoDB.put(params).promise();
  return { message: 'Visit data saved successfully', patient_id: data.patient_id };
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
  
  const queueItem = {
    patient_id: data.patient_id,
    status: data.status || 'waiting',
    priority: data.priority || 'low',
    created_at_timestamp: data.created_at_timestamp || now,
    finished_at_timestamp: data.status === 'completed' ? (data.finished_at_timestamp || now) : null,
    time_taken: data.time_taken || '',
    order: data.order || 0
  };
  
  const params = {
    TableName: process.env.QUEUE_TABLE_NAME || 'queue',
    Item: queueItem
  };
  
  await dynamoDB.put(params).promise();
  return { message: 'Queue data updated successfully', patient_id: data.patient_id };
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
  
  await dynamoDB.put(params).promise();
  return { message: 'Doctor data saved successfully', doctor_id: data.doctor_id };
}

/**
 * Create a success response
 */
function successResponse(data) {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",           // <== CRITICAL
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    },
    body: JSON.stringify(data)
  };
}

/**
 * Create an error response
 */
function errorResponse(message) {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ 
      error: 'Failed to process data',
      message: message
    })
  };
}