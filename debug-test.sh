#!/bin/bash

# Test saving patient data with debugging
echo "Testing patient data save with debugging..."

curl -X POST \
  'https://lp5utunomb.execute-api.us-west-2.amazonaws.com/prod/patient-data' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "savePatient",
    "user_id": "P12345",
    "name": "John Doe",
    "nric": "S1234567D",
    "dob": "1980-01-01",
    "age": 43,
    "gender": "Male",
    "preferred_language": "English",
    "medical_history": ["Hypertension", "Diabetes"]
  }'

echo ""
echo "After running this test, check the CloudWatch logs for your Lambda function"
echo "to see the detailed debugging information about what was saved to DynamoDB."