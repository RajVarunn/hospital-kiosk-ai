/**
 * Example of how to call the Lambda function from your frontend
 */

// Using fetch to call the API Gateway endpoint that triggers your Lambda
async function savePatientData(patientData) {
  try {
    const response = await fetch('https://lp5utunomb.execute-api.us-west-2.amazonaws.com/prod/patient-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patientData)
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error saving patient data:', error);
    throw error;
  }
}

// Example usage
const patientData = {
  patientId: "P12345",
  name: "John Doe",
  age: 45,
  gender: "Male",
  contactNumber: "555-123-4567",
  address: "123 Main St, Anytown, USA",
  medicalHistory: "Hypertension, Diabetes",
  vitals: {
    temperature: "98.6",
    bloodPressure: "120/80",
    heartRate: "72",
    respiratoryRate: "16",
    oxygenSaturation: "98",
    weight: "180",
    height: "5'10"
  },
  chiefComplaint: "Chest pain",
  visitReason: "Annual checkup",
  visitDate: "2023-06-15"
};

// Call the function
savePatientData(patientData)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));