/**
 * Mock DynamoDB service
 */

const dynamoService = {
  savePatient: async (patientData) => {
    console.log('Mock savePatient called with:', patientData);
    return { data: patientData };
  },
  
  saveVisit: async (visitData) => {
    console.log('Mock saveVisit called with:', visitData);
    return { data: visitData };
  },
  
  updateQueue: async (queueData) => {
    console.log('Mock updateQueue called with:', queueData);
    return { data: queueData };
  },
  
  updateUserLocation: async (locationData) => {
    console.log('Mock updateUserLocation called with:', locationData);
    return { data: locationData };
  },
  
  getPatients: async () => {
    return [];
  },
  
  getVisits: async () => {
    return [];
  },
  
  getQueue: async () => {
    return [];
  }
};

export default dynamoService;