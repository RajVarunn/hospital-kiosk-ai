/**
 * Test script for API Gateway and Lambda integration
 */
const https = require('https');

// API Gateway endpoint
const apiUrl = 'https://lp5utunomb.execute-api.us-west-2.amazonaws.com/prod/patient-data';

// Test data
const testData = {
  action: 'savePatient',
  user_id: 'P12345',
  name: 'John Doe',
  nric: 'S1234567D',
  dob: '1980-01-01',
  age: 43,
  gender: 'Male',
  preferred_language: 'English',
  medical_history: ['Hypertension', 'Diabetes']
};

// Convert data to JSON string
const postData = JSON.stringify(testData);

// Request options
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

// Send request
const req = https.request(apiUrl, options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', responseData);
    try {
      const parsedData = JSON.parse(responseData);
      console.log('Parsed response:', parsedData);
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();

console.log('Request sent with data:', postData);