/**
 * Service for interacting with DynamoDB through Lambda API
 */
import axios from 'axios';

// API Gateway endpoint that triggers the Lambda function
const API_ENDPOINT = 'https://lp5utunomb.execute-api.us-west-2.amazonaws.com/prod';

const dynamoService = {
  /**
   * Save patient data
   */
  savePatient: async (patientData) => {
    const payload = {
      action: 'savePatient',
      user_id: patientData.id || patientData.nric,
      name: patientData.name,
      nric: patientData.nric,
      dob: patientData.dob,
      age: patientData.age,
      gender: patientData.gender,
      preferred_language: patientData.preferred_language,
      medical_history: patientData.medical_history || []
    };
    
    return axios.post(API_ENDPOINT, payload);
  },
  
  /**
   * Save visit data
   */
  saveVisit: async (visitData) => {
    const payload = {
      action: 'saveVisit',
      patient_id: visitData.patient_id,
      user_input: visitData.user_input,
      symptoms: visitData.symptoms || [],
      height: visitData.height,
      weight: visitData.weight,
      systolic: visitData.systolic,
      diastolic: visitData.diastolic,
      heart_rate: visitData.heart_rate,
      current_medication: visitData.current_medication
    };
    
    return axios.post(API_ENDPOINT, payload);
  },
  
  /**
   * Update queue status
   */
  updateQueue: async (queueData) => {
    const payload = {
      action: 'updateQueue',
      patient_id: queueData.patient_id,
      status: queueData.status,
      priority: queueData.priority,
      order: queueData.order,
      created_at_timestamp: queueData.created_at_timestamp,
      finished_at_timestamp: queueData.finished_at_timestamp,
      time_taken: queueData.time_taken
    };
    
    return axios.post(API_ENDPOINT, payload);
  },
  
  /**
   * Save doctor data
   */
  saveDoctor: async (doctorData) => {
    const payload = {
      action: 'saveDoctor',
      doctor_id: doctorData.doctor_id,
      doctor_name: doctorData.doctor_name,
      doctor_specialization: doctorData.doctor_specialization || []
    };
    
    return axios.post(API_ENDPOINT, payload);
  }
};

export default dynamoService;