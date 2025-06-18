# DynamoDB Integration Guide

This guide explains how to push data from your web app to DynamoDB using the Lambda function.

## Setup

1. Make sure your Lambda function is deployed and API Gateway is configured
2. Add the API Gateway URL to your `.env.local` file:
   ```
   REACT_APP_LAMBDA_API_ENDPOINT=https://your-api-gateway-url.execute-api.region.amazonaws.com/prod
   ```

## Using the DynamoDB Service

### Import the Service

```javascript
import dynamoService from '../services/dynamoService';
```

### Save Patient Data

```javascript
try {
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
  console.log("Patient saved:", response.data);
} catch (error) {
  console.error("Error saving patient:", error);
}
```

### Save Visit Data

```javascript
try {
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
  console.log("Visit saved:", response.data);
} catch (error) {
  console.error("Error saving visit:", error);
}
```

### Update Queue Status

```javascript
try {
  const queueData = {
    patient_id: "P12345",
    status: "waiting",
    priority: "medium",
    order: 3
  };
  
  const response = await dynamoService.updateQueue(queueData);
  console.log("Queue updated:", response.data);
} catch (error) {
  console.error("Error updating queue:", error);
}
```

### Save Doctor Data

```javascript
try {
  const doctorData = {
    doctor_id: "D001",
    doctor_name: "Dr. Jane Smith",
    doctor_specialization: ["Cardiology", "Internal Medicine"]
  };
  
  const response = await dynamoService.saveDoctor(doctorData);
  console.log("Doctor saved:", response.data);
} catch (error) {
  console.error("Error saving doctor:", error);
}
```

## Integration with Existing Components

### Patient Registration Form

Add this code to your patient registration form submission handler:

```javascript
// After saving to your existing database
try {
  await dynamoService.savePatient(patientData);
} catch (error) {
  console.error("Error saving to DynamoDB:", error);
  // Continue with normal flow even if DynamoDB save fails
}
```

### Vitals Collection Form

Add this code to your vitals form submission handler:

```javascript
// After saving to your existing database
try {
  await dynamoService.saveVisit({
    patient_id: patient.id,
    systolic: parseInt(systolic),
    diastolic: parseInt(diastolic),
    heart_rate: parseInt(heartRate)
  });
} catch (error) {
  console.error("Error saving to DynamoDB:", error);
  // Continue with normal flow even if DynamoDB save fails
}
```

### Queue Management

Add this code when updating patient queue status:

```javascript
// After updating queue in your existing database
try {
  await dynamoService.updateQueue({
    patient_id: patient.id,
    status: newStatus,
    priority: priority
  });
} catch (error) {
  console.error("Error updating queue in DynamoDB:", error);
  // Continue with normal flow even if DynamoDB update fails
}
```