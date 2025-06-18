# Simple Health Assessment App

This is a simplified version of the Hospital Kiosk AI application that focuses solely on generating health assessments using Amazon Bedrock. It removes the DynamoDB dependencies and simplifies the architecture.

## Features

- Generate health assessments based on user-reported symptoms and vital signs
- Uses Amazon Bedrock's Claude model for AI-powered assessments
- Fallback to local assessment if Bedrock is unavailable
- Simple, responsive UI

## Architecture

This simplified version consists of:

1. **Frontend**: React application with a form to collect symptoms and vitals
2. **Backend**: AWS Lambda function that calls Amazon Bedrock
3. **API Gateway**: REST API that connects the frontend to the Lambda function

## Files

- `frontend/src/components/SimpleHealthAssessment.jsx`: The main UI component
- `frontend/src/services/healthService.js`: Service to call the API
- `simple-lambda.js`: The Lambda function that calls Bedrock
- `SIMPLE-DEPLOYMENT.md`: Deployment instructions

## Getting Started

1. Deploy the Lambda function and API Gateway (see `SIMPLE-DEPLOYMENT.md`)
2. Update the API URL in `healthService.js`
3. Add the SimpleHealthAssessment component to your routes
4. Run the frontend application

## How It Works

1. User enters symptoms and vital signs in the form
2. Frontend sends this data to the API Gateway
3. Lambda function receives the request and calls Bedrock
4. Bedrock generates a health assessment based on the input
5. Lambda returns the assessment to the frontend
6. Frontend displays the diagnosis and health tips

## Benefits Over the Original Version

- Simpler architecture with fewer dependencies
- No database setup or management required
- Faster deployment and easier maintenance
- Still provides the core health assessment functionality

## Limitations

- No persistent storage of patient data
- No visit history or queue management
- Limited to health assessments only

## Next Steps

- Add authentication to secure the application
- Implement local storage for basic patient information
- Enhance the UI with more features
- Add more detailed health assessments