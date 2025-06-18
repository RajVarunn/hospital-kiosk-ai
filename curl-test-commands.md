# Lambda API Testing Commands

## Test Save Patient

```bash
curl -X POST \
  'https://lp5utunomb.execute-api.us-west-2.amazonaws.com/prod' \
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
```

## Test Save Visit

```bash
curl -X POST \
  'https://lp5utunomb.execute-api.us-west-2.amazonaws.com/prod' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "saveVisit",
    "patient_id": "P12345",
    "user_input": "I have a headache and fever",
    "symptoms": ["headache", "fever"],
    "height": 175,
    "weight": 70,
    "systolic": 120,
    "diastolic": 80,
    "heart_rate": 72,
    "current_medication": true
  }'
```

## Test Update Queue

```bash
curl -X POST \
  'https://lp5utunomb.execute-api.us-west-2.amazonaws.com/prod' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "updateQueue",
    "patient_id": "P12345",
    "status": "waiting",
    "priority": "medium",
    "order": 3
  }'
```

## Test Save Doctor

```bash
curl -X POST \
  'https://lp5utunomb.execute-api.us-west-2.amazonaws.com/prod' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "saveDoctor",
    "doctor_id": "D001",
    "doctor_name": "Dr. Jane Smith",
    "doctor_specialization": ["Cardiology", "Internal Medicine"]
  }'
```

## Test CORS Preflight

```bash
curl -v -X OPTIONS \
  'https://lp5utunomb.execute-api.us-west-2.amazonaws.com/prod' \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type'
```

## Troubleshooting

If you're getting a `"undefined" is not valid JSON` error, it means the Lambda function is not receiving a proper request body. This could be because:

1. The API Gateway is not configured correctly
2. The Lambda function is being invoked directly without a proper event structure
3. The request is not being sent correctly

### Testing directly in Lambda Console

Use this test event in the Lambda console:

```json
{
  "httpMethod": "POST",
  "body": "{\"action\":\"savePatient\",\"user_id\":\"P12345\",\"name\":\"John Doe\",\"nric\":\"S1234567D\",\"dob\":\"1980-01-01\",\"age\":43,\"gender\":\"Male\",\"preferred_language\":\"English\",\"medical_history\":[\"Hypertension\",\"Diabetes\"]}"
}
```