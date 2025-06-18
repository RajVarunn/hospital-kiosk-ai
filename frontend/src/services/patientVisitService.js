/**
 * Service for fetching patient data from DynamoDB via API Gateway
 */
import axios from 'axios';
import { mockPatients, mockVisits, mockQueue, mockDoctors } from './mockData';

// Set to true to use mock data instead of API
const USE_MOCK_DATA = true;

// API Gateway URLs
const BASE_API_URL = 'https://ue42jf8akc.execute-api.us-west-2.amazonaws.com/prod';
const VISITS_ENDPOINT = `${BASE_API_URL}/visit`;
const QUEUE_ENDPOINT = `${BASE_API_URL}/queue`;
const PATIENTS_ENDPOINT = `${BASE_API_URL}/patients`;
const DOCTORS_ENDPOINT = `${BASE_API_URL}/doctor`;

const patientVisitService = {
  /**
   * Get all patient visits
   */
  getAllVisits: async () => {
    // Return mock data if flag is set
    if (USE_MOCK_DATA) {
      console.log('Using mock visits data');
      return mockVisits;
    }
    
    try {
      const response = await axios.get(VISITS_ENDPOINT);
      
      // Check if response is in the Lambda proxy format
      if (response.data && response.data.statusCode === 200 && response.data.body) {
        // Try to parse the body if it's a string
        try {
          return JSON.parse(response.data.body);
        } catch (e) {
          return response.data.body;
        }
      }
      
      // If response is not in Lambda format or has error status
      if (response.data && response.data.statusCode === 404) {
        console.warn('Visits endpoint returned 404:', response.data);
        return [];
      }
      
      // Default case - just return the data or empty array
      return response.data || [];
    } catch (error) {
      console.error('Error fetching visits:', error);
      return []; // Return empty array instead of throwing
    }
  },
  
  /**
   * Get visits for a specific patient
   */
  getPatientVisits: async (patientId) => {
    try {
      const response = await axios.get(`${VISITS_ENDPOINT}?patient_id=${patientId}`);
      
      // Check if response is in the Lambda proxy format
      if (response.data && response.data.statusCode === 200 && response.data.body) {
        // Try to parse the body if it's a string
        try {
          return JSON.parse(response.data.body);
        } catch (e) {
          return response.data.body;
        }
      }
      
      // If response is not in Lambda format or has error status
      if (response.data && response.data.statusCode === 404) {
        console.warn(`Visits endpoint for patient ${patientId} returned 404:`, response.data);
        return [];
      }
      
      // Default case - just return the data or empty array
      return response.data || [];
    } catch (error) {
      console.error(`Error fetching visits for patient ${patientId}:`, error);
      return []; // Return empty array instead of throwing
    }
  },
  
  /**
   * Get all queue entries
   */
  getQueue: async () => {
    // Return mock data if flag is set
    if (USE_MOCK_DATA) {
      console.log('Using mock queue data');
      return mockQueue;
    }
    
    try {
      const response = await axios.get(QUEUE_ENDPOINT);
      
      // Check if response is in the Lambda proxy format
      if (response.data && response.data.statusCode === 200 && response.data.body) {
        // Try to parse the body if it's a string
        try {
          return JSON.parse(response.data.body);
        } catch (e) {
          return response.data.body;
        }
      }
      
      // If response is not in Lambda format or has error status
      if (response.data && response.data.statusCode === 404) {
        console.warn('Queue endpoint returned 404:', response.data);
        return [];
      }
      
      // Default case - just return the data or empty array
      return response.data || [];
    } catch (error) {
      console.error('Error fetching queue:', error);
      return [];
    }
  },
  
  /**
   * Get all patients
   */
  getPatients: async () => {
    // Return mock data if flag is set
    if (USE_MOCK_DATA) {
      console.log('Using mock patients data');
      return mockPatients;
    }
    
    try {
      const response = await axios.get(PATIENTS_ENDPOINT);
      
      // Check if response is in the Lambda proxy format
      if (response.data && response.data.statusCode === 200 && response.data.body) {
        // Try to parse the body if it's a string
        try {
          return JSON.parse(response.data.body);
        } catch (e) {
          return response.data.body;
        }
      }
      
      // If response is not in Lambda format or has error status
      if (response.data && response.data.statusCode === 404) {
        console.warn('Patients endpoint returned 404:', response.data);
        return [];
      }
      
      // Default case - just return the data or empty array
      return response.data || [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  },
  
  /**
   * Get all doctors
   */
  getDoctors: async () => {
    // Return mock data if flag is set
    if (USE_MOCK_DATA) {
      console.log('Using mock doctors data');
      return mockDoctors;
    }
    
    try {
      const response = await axios.get(DOCTORS_ENDPOINT);
      
      // Check if response is in the Lambda proxy format
      if (response.data && response.data.statusCode === 200 && response.data.body) {
        // Try to parse the body if it's a string
        try {
          return JSON.parse(response.data.body);
        } catch (e) {
          return response.data.body;
        }
      }
      
      // If response is not in Lambda format or has error status
      if (response.data && response.data.statusCode === 404) {
        console.warn('Doctors endpoint returned 404:', response.data);
        return [];
      }
      
      // Default case - just return the data or empty array
      return response.data || [];
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
  },
  
  /**
   * Update queue entry
   */
  updateQueue: async (queueData) => {
    try {
      const response = await axios.post(QUEUE_ENDPOINT, 
        {
          action: 'updateQueue',
          ...queueData
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating queue:', error);
      throw error;
    }
  },
  
  /**
   * Request pre-diagnosis for a patient
   */
  requestPreDiagnosis: async (patientId) => {
    try {
      console.log('Requesting pre-diagnosis for patient:', patientId);
      
      // Get patient data (either mock or real)
      let visit, patient;
      
      if (USE_MOCK_DATA) {
        // Get mock patient visit data
        const visits = mockVisits.filter(v => v.patient_id === patientId);
        const patients = mockPatients.filter(p => p.user_id === patientId);
        
        if (visits.length === 0) {
          console.warn('No visit data found for patient:', patientId);
          return { success: false, message: 'No visit data found' };
        }
        
        visit = visits[0];
        patient = patients[0];
        
        // Check if we should use pre-existing mock pre-diagnosis or generate new one
        const USE_MOCK_PREDIAGNOSIS = false; // Set to false to always generate with Bedrock
        
        if (USE_MOCK_PREDIAGNOSIS && visit.ai_pre_diagnosis) {
          console.log('Using pre-existing mock pre-diagnosis');
          return { 
            success: true, 
            message: 'Pre-diagnosis generated successfully',
            data: visit.ai_pre_diagnosis
          };
        }
      } else {
        // Get real patient visit data
        const visits = await patientVisitService.getPatientVisits(patientId);
        const patients = await patientVisitService.getPatients();
        
        // Find the most recent visit
        visit = Array.isArray(visits) && visits.length > 0 ? visits[0] : null;
        patient = patients.find(p => p.user_id === patientId);
        
        if (!visit) {
          throw new Error('No visit data found for patient');
        }
      }
      
      // Import bedrockService
      const bedrockService = (await import('./bedrockService')).default;
      
      // Prepare data for Bedrock
      const patientData = {
        user_input: visit.user_input,
        height: visit.height,
        weight: visit.weight,
        systolic: visit.systolic,
        diastolic: visit.diastolic,
        heart_rate: visit.heart_rate,
        medical_history: patient?.medical_history || []
      };
      
      console.log('Generating pre-diagnosis with Bedrock using data:', patientData);
      
      // Generate pre-diagnosis
      let result;
      
      // Check if AWS credentials are available for Bedrock
      const hasAwsCredentials = process.env.REACT_APP_AWS_ACCESS_KEY_ID && 
                               process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
      
      if (hasAwsCredentials) {
        // Use real Bedrock if credentials are available
        result = await bedrockService.generatePreDiagnosis(patientData);
      } else {
        // Use mock pre-diagnosis if no credentials
        console.log('No AWS credentials found, using mock pre-diagnosis generator');
        result = bedrockService.generateMockPreDiagnosis(patientData);
      }
      
      // If using mock data, update the mock visit with the new pre-diagnosis
      if (USE_MOCK_DATA && result.success) {
        const visitIndex = mockVisits.findIndex(v => v.patient_id === patientId);
        if (visitIndex >= 0) {
          mockVisits[visitIndex].ai_pre_diagnosis = result.data;
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error requesting pre-diagnosis for patient ${patientId}:`, error);
      return {
        success: false,
        message: `Failed to generate pre-diagnosis: ${error.message}`,
        data: null
      };
    }
  },
  
  /**
   * Extract vitals from visit data
   * Since there's no vitals table, we'll extract vitals from visits
   */
  getVitals: async () => {
    try {
      const visits = await patientVisitService.getAllVisits();
      
      // Check if visits is an array
      if (!Array.isArray(visits)) {
        console.warn('Visits data is not an array:', visits);
        return [];
      }
      
      // Extract vitals from visits
      return visits.map(visit => ({
        patient_id: visit.patient_id,
        height: visit.height,
        weight: visit.weight,
        bp_systolic: visit.systolic,
        bp_diastolic: visit.diastolic,
        heart_rate: visit.heart_rate
      }));
    } catch (error) {
      console.error('Error extracting vitals from visits:', error);
      return [];
    }
  }
};

export default patientVisitService;