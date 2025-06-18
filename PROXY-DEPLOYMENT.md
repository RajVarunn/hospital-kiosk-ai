# Quick Bedrock Proxy API Deployment

This guide will help you deploy the Bedrock proxy API if you want to host it yourself.

## 1. Create the Lambda Function

1. Go to AWS Lambda console
2. Click "Create function"
3. Choose "Author from scratch"
4. Enter a function name (e.g., "bedrock-proxy")
5. Select Node.js 18.x for the runtime
6. Click "Create function"
7. Copy the code from `bedrock-proxy.js` and paste it into the code editor
8. Click "Deploy"

## 2. Add IAM Permissions

1. In the Lambda function configuration, go to the "Configuration" tab
2. Click on "Permissions" in the left sidebar
3. Click on the role name to go to the IAM console
4. Click "Add permissions" > "Create inline policy"
5. Choose the JSON tab and paste this policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "bedrock:InvokeModel",
           "bedrock:InvokeModelWithResponseStream"
         ],
         "Resource": "*"
       }
     ]
   }
   ```
6. Name it "BedrockInvokePolicy" and create it

## 3. Set Up API Gateway

1. Go to API Gateway console
2. Click "Create API"
3. Choose "REST API" and click "Build"
4. Enter a name (e.g., "bedrock-proxy-api")
5. Click "Create API"
6. Click "Create Resource"
7. Enter "bedrock" for the resource name
8. Click "Create Resource"
9. With the new resource selected, click "Create Method"
10. Select "POST" and click the checkmark
11. Set Integration type to "Lambda Function"
12. Select your Lambda function ("bedrock-proxy")
13. Click "Save"
14. Click "Enable CORS" with these settings:
    - Access-Control-Allow-Origin: '*'
    - Access-Control-Allow-Headers: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key'
    - Access-Control-Allow-Methods: 'OPTIONS,POST'
15. Click "Deploy API"
16. Create a new stage (e.g., "prod")
17. Note the Invoke URL - you'll need this for the frontend

## 4. Update the Frontend

1. Open `frontend/src/components/DirectBedrockTest.jsx`
2. Replace the API URL with your API Gateway Invoke URL:
   ```javascript
   const response = await axios.post('YOUR_API_GATEWAY_URL/bedrock', {
     // ...
   });
   ```

## 5. Test the API

1. Use a tool like Postman to test the API
2. Send a POST request to your API Gateway Invoke URL with this body:
   ```json
   {
     "prompt": "You are a helpful assistant. Please say hello.",
     "model": "anthropic.claude-v2"
   }
   ```
3. You should receive a response from Bedrock