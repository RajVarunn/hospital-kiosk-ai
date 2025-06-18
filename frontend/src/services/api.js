// src/services/api.js
import dynamoService from './dynamoService';

export const patientAPI = {
  register: async (patientData) => {
    try {
      const response = await dynamoService.savePatient({
        user_id: patientData.id || patientData.nric,
        name: patientData.name,
        nric: patientData.nric,
        dob: patientData.dob,
        age: patientData.age,
        gender: patientData.gender || '',
        preferred_language: patientData.preferred_language || '',
        medical_history: patientData.medical_history || []
      });
      
      return { 
        data: { 
          patient: {
            id: patientData.id || patientData.nric,
            ...patientData
          } 
        } 
      };
    } catch (error) {
      throw error;
    }
  },

  updateVitals: async (patientId, vitalsData) => {
    try {
      await dynamoService.saveVisit({
        patient_id: patientId,
        systolic: vitalsData.systolic,
        diastolic: vitalsData.diastolic,
        heart_rate: vitalsData.heartRate
      });
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  getPatient: async (id) => {
    // This would require a GET endpoint in your Lambda function
    // For now, we'll return a mock response
    return {
      id: id,
      name: 'Patient Data',
      // Add other fields as needed
    };
  },

  addToQueue: async (entryData) => {
    try {
      // Get current timestamp
      const timestamp = new Date().toISOString();
      
      const response = await dynamoService.updateQueue({
        patient_id: entryData.patient_id,
        status: 'waiting',
        priority: entryData.priority || 'low',
        created_at_timestamp: timestamp,
        order: entryData.order || 0
      });
      
      return [{ id: entryData.patient_id }];
    } catch (error) {
      throw error;
    }
  }
};