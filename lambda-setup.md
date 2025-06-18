# DynamoDB Lambda Function Setup

This guide explains how to set up the Lambda function that saves hospital data to DynamoDB.

## Prerequisites

1. AWS account with appropriate permissions
2. AWS CLI installed and configured
3. Node.js and npm installed

## Step 1: Create DynamoDB Tables

### Patients Table
1. Go to the AWS Management Console and navigate to DynamoDB
2. Click "Create table"
3. Enter table name: `patients`
4. Primary key: `user_id` (String)
5. Click "Create"

### Visits Table
1. Create another table named `visits`
2. Primary key: `patient_id` (Number)
3. Click "Create"

### Queue Table
1. Create another table named `queue`
2. Primary key: `patient_id` (Number)
3. Click "Create"

### Doctors Table
1. Create another table named `doctors`
2. Primary key: `doctor_id` (String)
3. Click "Create"

## Step 2: Create an IAM Role for Lambda

1. Go to IAM in the AWS Console
2. Create a new role with the following permissions:
   - AWSLambdaBasicExecutionRole
   - DynamoDBFullAccess (or a more restricted policy for your specific tables)

## Step 3: Create the Lambda Function

1. Go to Lambda in the AWS Console
2. Click "Create function"
3. Choose "Author from scratch"
4. Enter a function name (e.g., `hospitalDataHandler`)
5. Select Node.js as the runtime
6. Choose the IAM role created in Step 2
7. Click "Create function"
8. Upload the `saveToDynamoDB.js` file or copy-paste its contents

## Step 4: Configure Environment Variables

1. In the Lambda function configuration, add these environment variables:
   - `PATIENTS_TABLE_NAME`: `patients`
   - `VISITS_TABLE_NAME`: `visits`
   - `QUEUE_TABLE_NAME`: `queue`
   - `DOCTORS_TABLE_NAME`: `doctors`

## Step 5: Create an API Gateway

1. Go to API Gateway in the AWS Console
2. Create a new REST API (not HTTP API)
3. Click "Create Resource" and name it "hospital-data"
4. With the new resource selected, click "Create Method" and select POST
5. For the POST method setup:
   - Integration type: Lambda Function
   - Lambda Region: Select your region
   - Lambda Function: hospitalDataHandler
   - Use Default Timeout: Yes
   - Click "Save"
6. Enable CORS for the resource:
   - Select the resource and click "Enable CORS"
   - For Access-Control-Allow-Origin, enter "*" (or your specific domain)
   - Select "Access-Control-Allow-Headers" and add "Content-Type"
   - Select "Access-Control-Allow-Methods" and ensure POST is checked
   - Click "Enable CORS and replace existing CORS headers"
7. Deploy the API:
   - Click "Actions" and select "Deploy API"
   - Create a new stage named "prod"
   - Click "Deploy"
8. Note the API endpoint URL (it will be in the format: https://xxxxxxxx.execute-api.region.amazonaws.com/prod/hospital-data)

## Step 6: API Methods

Your Lambda function is designed to handle different operations based on the "action" field in the request body. All operations use the same POST endpoint, but with different request bodies:

1. **Save Patient** - POST to `/hospital-data`
   ```json
   {
     "action": "savePatient",
     "user_id": "P12345",
     "name": "John Doe",
     "nric": "S1234567D",
     "dob": "1980-01-01",
     "age": 43,
     "gender": "Male",
     "preferred_language": "English",
     "medical_history": ["Hypertension", "Diabetes"]
   }
   ```

2. **Save Visit** - POST to `/hospital-data`
   ```json
   {
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
   }
   ```

3. **Update Queue** - POST to `/hospital-data`
   ```json
   {
     "action": "updateQueue",
     "patient_id": "P12345",
     "status": "waiting",
     "priority": "medium",
     "order": 3
   }
   ```

4. **Save Doctor** - POST to `/hospital-data`
   ```json
   {
     "action": "saveDoctor",
     "doctor_id": "D001",
     "doctor_name": "Dr. Jane Smith",
     "doctor_specialization": ["Cardiology", "Internal Medicine"]
   }
   ```

## Step 7: Update Frontend Configuration

1. Update the `.env.local` file in your frontend project:
   ```
   REACT_APP_LAMBDA_API_ENDPOINT=https://xxxxxxxx.execute-api.region.amazonaws.com/prod/hospital-data
   ```

## Step 8: Testing the API

You can test your API using tools like Postman, curl, or the AWS Console.

### Using curl

1. **Test Save Patient**
   ```bash
   curl -X POST \
     https://xxxxxxxx.execute-api.region.amazonaws.com/prod/hospital-data \
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

2. **Test Save Visit**
   ```bash
   curl -X POST \
     https://xxxxxxxx.execute-api.region.amazonaws.com/prod/hospital-data \
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

3. **Test Update Queue**
   ```bash
   curl -X POST \
     https://xxxxxxxx.execute-api.region.amazonaws.com/prod/hospital-data \
     -H 'Content-Type: application/json' \
     -d '{
       "action": "updateQueue",
       "patient_id": "P12345",
       "status": "waiting",
       "priority": "medium",
       "order": 3
     }'
   ```

4. **Test Save Doctor**
   ```bash
   curl -X POST \
     https://xxxxxxxx.execute-api.region.amazonaws.com/prod/hospital-data \
     -H 'Content-Type: application/json' \
     -d '{
       "action": "saveDoctor",
       "doctor_id": "D001",
       "doctor_name": "Dr. Jane Smith",
       "doctor_specialization": ["Cardiology", "Internal Medicine"]
     }'
   ```

### Using the AWS Console

1. Go to API Gateway in the AWS Console
2. Select your API
3. Click on the POST method under your resource
4. Click the "Test" tab
5. In the Request Body field, paste one of the JSON examples above
6. Click "Test" to execute the request

## Step 9: Troubleshooting

### Common Issues and Solutions

1. **Lambda Execution Errors**
   - Check CloudWatch Logs for detailed error messages
   - In the AWS Console, go to Lambda > Your Function > Monitor > Logs
   - Look for error messages in the log streams

2. **Access Denied Errors**
   - Verify IAM permissions for your Lambda function
   - Ensure the role has permissions to access DynamoDB tables
   - Check that the table names in environment variables match your actual table names

3. **CORS Errors in Browser**
   - If you see errors like "Access-Control-Allow-Origin", ensure CORS is properly configured
   - In API Gateway, select your resource and click "Enable CORS" again
   - Make sure to redeploy the API after making changes

4. **API Gateway 500 Errors**
   - Check that your Lambda function is correctly handling all possible inputs
   - Ensure the request format matches what your Lambda function expects
   - Test the Lambda function directly from the AWS Console to isolate the issue

5. **Frontend Connection Issues**
   - Verify that the API endpoint URL in your `.env.local` file is correct
   - Check that you're including the full path in the URL (including `/hospital-data`)
   - Ensure your frontend is making POST requests with the correct Content-Type header