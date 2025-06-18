import React, { useState } from 'react';
import dynamoService from '../services/dynamoService';

const DynamoDBExample = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Example: Save patient data
  const handleSavePatient = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Example patient data
      const patientData = {
        id: "P12345",
        name: "John Doe",
        nric: "S1234567D",
        dob: "1980-01-01",
        age: 43,
        gender: "Male",
        preferred_language: "English",
        medical_history: ["Hypertension", "Diabetes"]
      };
      
      const response = await dynamoService.savePatient(patientData);
      setResult(response.data);
    } catch (err) {
      console.error("Error saving patient:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Example: Save visit data
  const handleSaveVisit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Example visit data
      const visitData = {
        patient_id: "P12345",
        user_input: "I have a headache and fever",
        symptoms: ["headache", "fever"],
        height: 175,
        weight: 70,
        systolic: 120,
        diastolic: 80,
        heart_rate: 72,
        current_medication: true
      };
      
      const response = await dynamoService.saveVisit(visitData);
      setResult(response.data);
    } catch (err) {
      console.error("Error saving visit:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Example: Update queue
  const handleUpdateQueue = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Example queue data
      const queueData = {
        patient_id: "P12345",
        status: "waiting",
        priority: "medium",
        order: 3
      };
      
      const response = await dynamoService.updateQueue(queueData);
      setResult(response.data);
    } catch (err) {
      console.error("Error updating queue:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">DynamoDB Integration Example</h2>
      
      <div className="flex space-x-4 mb-4">
        <button 
          onClick={handleSavePatient}
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={loading}
        >
          Save Patient
        </button>
        
        <button 
          onClick={handleSaveVisit}
          className="px-4 py-2 bg-green-500 text-white rounded"
          disabled={loading}
        >
          Save Visit
        </button>
        
        <button 
          onClick={handleUpdateQueue}
          className="px-4 py-2 bg-purple-500 text-white rounded"
          disabled={loading}
        >
          Update Queue
        </button>
      </div>
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DynamoDBExample;