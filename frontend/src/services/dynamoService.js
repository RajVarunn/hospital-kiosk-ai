/**
 * Service for interacting with DynamoDB through Lambda API
 */
import axios from 'axios';
import { debugLog } from './debugHelper';

// API Gateway endpoint that triggers the Lambda function
const API_ENDPOINT = 'https://lp5utunomb.execute-api.us-west-2.amazonaws.com/prod/patient-data';

const dynamoService = {
  /**
   * Get all patients
   */
  getRawPatients: async () => {
    debugLog('dynamoService.getRawPatients called');
    
    const payload = {
      action: 'getPatients'
    };
    
    try {
      const response = await axios.post(API_ENDPOINT, payload);
      debugLog('Raw Lambda response', response);
      return response;
    } catch (error) {
      console.error('Error getting raw patients:', error);
      throw error;
    }
  },
  
  getPatients: async () => {
    debugLog('dynamoService.getPatients called');
    
    const payload = {
      action: 'getPatients'
    };
    
    try {
      const response = await axios.post(API_ENDPOINT, payload);
      debugLog('Lambda getPatients response', response.data);
      
      // Ensure we return an array even if the response is not as expected
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.Items)) {
        // Check if the response has an Items array (common DynamoDB format)
        return response.data.Items;
      } else {
        console.warn('getPatients: Expected array but got:', typeof response.data, response.data);
        return [];
      }
    } catch (error) {
      console.error('Error getting patients:', error.response ? error.response.data : error.message);
      return []; // Return empty array instead of throwing
    }
  },
  
  /**
   * Get all visits
   */
  getVisits: async () => {
    debugLog('dynamoService.getVisits called');
    
    const payload = {
      action: 'getVisits'
    };
    
    try {
      const response = await axios.post(API_ENDPOINT, payload);
      debugLog('Lambda getVisits response', response.data);
      
      // Ensure we return an array even if the response is not as expected
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.Items)) {
        // Check if the response has an Items array (common DynamoDB format)
        return response.data.Items;
      } else {
        console.warn('getVisits: Expected array but got:', typeof response.data, response.data);
        return [];
      }
    } catch (error) {
      console.error('Error getting visits:', error.response ? error.response.data : error.message);
      return []; // Return empty array instead of throwing
    }
  },
  
  /**
   * Get all queue entries
   */
  getQueue: async () => {
    debugLog('dynamoService.getQueue called');
    
    const payload = {
      action: 'getQueue'
    };
    
    try {
      const response = await axios.post(API_ENDPOINT, payload);
      debugLog('Lambda getQueue response', response.data);
      
      // Ensure we return an array even if the response is not as expected
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.Items)) {
        // Check if the response has an Items array (common DynamoDB format)
        return response.data.Items;
      } else {
        console.warn('getQueue: Expected array but got:', typeof response.data, response.data);
        return [];
      }
    } catch (error) {
      console.error('Error getting queue:', error.response ? error.response.data : error.message);
      return []; // Return empty array instead of throwing
    }
  },
  
  /**
   * Save patient data
   */
  savePatient: async (patientData) => {
    debugLog('dynamoService.savePatient called with', patientData);
    
    // Make sure we have a patient_id (Lambda expects this)
    const payload = {
      action: 'savePatient',
      patient_id: patientData.id || patientData.nric, // Changed from user_id to patient_id
      name: patientData.name,
      nric: patientData.nric,
      dob: patientData.dob,
      age: patientData.age,
      gender: patientData.gender,
      preferred_language: patientData.preferred_language,
      medical_history: patientData.medical_history || []
    };
    
    debugLog('Sending payload to Lambda', payload);
    
    try {
      const response = await axios.post(API_ENDPOINT, payload);
      debugLog('Lambda response', response.data);
      return response;
    } catch (error) {
      console.error('Error calling Lambda:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Save visit data
   */
  saveVisit: async (visitData) => {
    debugLog('dynamoService.saveVisit called with', visitData);
    
    // Generate a visit_id if not provided
    const visit_id = visitData.visit_id || `visit_${visitData.patient_id}_${Date.now()}`;
    
    const payload = {
      action: 'saveVisit',
      patient_id: visitData.patient_id,
      visit_id: visit_id, // Include visit_id
      user_input: visitData.user_input || null, // Use null instead of empty string
      symptoms: visitData.symptoms || [],
      height: visitData.height || 0,
      weight: visitData.weight || 0,
      systolic: visitData.systolic || 0,
      diastolic: visitData.diastolic || 0,
      heart_rate: visitData.heart_rate || visitData.heartRate || 0, // Accept both heart_rate and heartRate
      current_medication: visitData.current_medication || false
    };
    
    debugLog('Sending visit payload to Lambda', payload);
    
    try {
      const response = await axios.post(API_ENDPOINT, payload);
      debugLog('Lambda visit response', response.data);
      return response;
    } catch (error) {
      console.error('Error saving visit:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Update queue status
   */
  updateQueue: async (queueData) => {
    debugLog('dynamoService.updateQueue called with', queueData);
    
    // Generate a queue_id if not provided
    const queue_id = queueData.queue_id || `queue_${queueData.patient_id}_${Date.now()}`;
    
    const payload = {
      action: 'updateQueue',
      patient_id: queueData.patient_id,
      queue_id: queue_id, // Include queue_id
      status: queueData.status,
      priority: queueData.priority,
      order: queueData.order,
      created_at_timestamp: queueData.created_at_timestamp,
      finished_at_timestamp: queueData.finished_at_timestamp,
      time_taken: queueData.time_taken || null // Use null instead of empty string
    };
    
    debugLog('Sending queue payload to Lambda', payload);
    
    try {
      const response = await axios.post(API_ENDPOINT, payload);
      debugLog('Lambda queue response', response.data);
      return response;
    } catch (error) {
      console.error('Error updating queue:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Save doctor data
   */
  saveDoctor: async (doctorData) => {
    debugLog('dynamoService.saveDoctor called with', doctorData);
    
    const payload = {
      action: 'saveDoctor',
      doctor_id: doctorData.doctor_id,
      doctor_name: doctorData.doctor_name,
      doctor_specialization: doctorData.doctor_specialization || []
    };
    
    debugLog('Sending doctor payload to Lambda', payload);
    
    try {
      const response = await axios.post(API_ENDPOINT, payload);
      debugLog('Lambda doctor response', response.data);
      return response;
    } catch (error) {
      console.error('Error saving doctor:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  /**
   * Get hospital navigation data
   */
  getNavigationData: async (locationId) => {
    const payload = {
      action: 'getNavigationData',
      location_id: locationId
    };
    
    return axios.post(API_ENDPOINT, payload);
  },
  
  /**
   * Update user location for live navigation
   */
  updateUserLocation: async (userData) => {
    const payload = {
      action: 'updateUserLocation',
      user_id: userData.userId,
      current_location: userData.currentLocation,
      destination: userData.destination,
      timestamp: new Date().toISOString()
    };
    
    return axios.post(API_ENDPOINT, payload);
  },
  
  /**
   * Send user input to Bedrock for testing
   */
  bedrockTest: async (userInput, options = {}) => {
    debugLog('dynamoService.bedrockTest called with', { userInput, options });
    
    const payload = {
      action: 'bedrockTest',
      user_input: userInput,
      systolic: options.systolic || 120,
      diastolic: options.diastolic || 80,
      heart_rate: options.heart_rate || 75
    };
    
    try {
      const response = await axios.post(API_ENDPOINT, payload);
      debugLog('Bedrock test response', response.data);
      return response.data;
    } catch (error) {
      console.error('Error calling Bedrock:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
};

export default dynamoService;