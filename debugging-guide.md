# Debugging Guide for DynamoDB Integration

## Issue: Web App Not Saving Data to DynamoDB

If your curl test works but the web app doesn't save data to DynamoDB, follow these steps:

## 1. Check Browser Console

First, open your browser's developer tools (F12) and check the console for any errors when submitting patient data.

## 2. Verify Data Being Sent

Add this code to your PatientForm.jsx file to log the data being sent:

```javascript
// In the try block where you call dynamoService.savePatient
try {
  // Log the data being sent
  console.log('Sending to DynamoDB:', {
    id: patientData.nric,
    name: patientData.name,
    nric: patientData.nric,
    dob: patientData.dob,
    age: patientData.age,
    gender: patientData.gender || ''
  });
  
  // Save to DynamoDB
  await dynamoService.savePatient({
    id: patientData.nric,
    name: patientData.name,
    nric: patientData.nric,
    dob: patientData.dob,
    age: patientData.age,
    gender: patientData.gender || ''
  });
} catch (err) {
  console.error('DynamoDB save error:', err);
}
```

## 3. Check Network Tab

In the browser's developer tools, go to the Network tab and:
1. Look for the request to your API Gateway endpoint
2. Check if the request is being sent
3. Verify the request payload
4. Check the response status and body

## 4. Verify Lambda Logs

After attempting to save data from the web app:
1. Go to AWS CloudWatch Logs
2. Find the log group for your Lambda function
3. Look for recent log entries
4. Check for any error messages or debugging output

## 5. Common Issues and Solutions

### ID Field Mismatch
The Lambda function now accepts multiple ID field names (patient_id, user_id, id, nric).

### CORS Issues
If you see CORS errors in the console, make sure:
- API Gateway has CORS enabled
- Lambda returns proper CORS headers
- The web app is using the correct API endpoint

### Network Issues
- Check if the web app can reach the API Gateway endpoint
- Verify there are no network restrictions

### Data Format Issues
- Make sure the data being sent matches what the Lambda function expects
- Check for missing required fields

## 6. Testing with Postman

Use Postman to test the API with the exact payload from your web app:
1. Copy the request payload from the browser's Network tab
2. Create a new POST request in Postman to your API endpoint
3. Set the Content-Type header to application/json
4. Paste the payload and send the request
5. Check the response