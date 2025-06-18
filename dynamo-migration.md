# DynamoDB Migration Guide

This guide explains how the application has been migrated from Supabase to DynamoDB.

## Changes Made

1. Created a Lambda function (`saveToDynamoDB.js`) that handles data operations for four tables:
   - `patients`
   - `visits`
   - `queue`
   - `doctors`

2. Created a frontend service (`dynamoService.js`) that communicates with the Lambda function

3. Updated components to use DynamoDB instead of Supabase:
   - `VitalsCollection.jsx` - Now saves vitals directly to DynamoDB
   - `PatientForm.jsx` - Now saves patient data directly to DynamoDB
   - `api.js` - Replaced Supabase calls with DynamoDB service calls

## How Data Flows

1. User interacts with a component (e.g., submits a form)
2. Component calls the appropriate method from `dynamoService.js`
3. Service formats the data and sends it to the Lambda function via API Gateway
4. Lambda function processes the data and saves it to the appropriate DynamoDB table
5. Lambda function returns a success/error response
6. Component handles the response (shows success message or error)

## DynamoDB Tables

### Patients Table
- Primary Key: `user_id` (String)
- Fields:
  - name (String)
  - nric (String)
  - dob (String)
  - age (Number)
  - gender (String)
  - preferred_language (String)
  - medical_history (List of String)

### Visits Table
- Primary Key: `patient_id` (Number)
- Fields:
  - user_input (String)
  - symptoms (List of String)
  - height (Number)
  - weight (Number)
  - systolic (Number)
  - diastolic (Number)
  - heart_rate (Number)
  - current_medication (Boolean)

### Queue Table
- Primary Key: `patient_id` (Number)
- Fields:
  - status (String: waiting, serving, completed)
  - priority (String: low, medium, high)
  - created_at_timestamp (String)
  - finished_at_timestamp (String)
  - time_taken (String)
  - order (Number)

### Doctors Table
- Primary Key: `doctor_id` (String)
- Fields:
  - doctor_name (String)
  - doctor_specialization (List of String)

## Next Steps

1. Deploy the Lambda function to AWS
2. Set up the API Gateway
3. Configure environment variables
4. Test the integration