# Lambda Deployment Instructions for Node.js 22

To fix the "require is not defined in ES module scope" error with Node.js 22, follow these steps:

## 1. Prepare the Lambda Package

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Create a deployment package:
   ```bash
   zip -r function.zip index.mjs package.json node_modules
   ```

## 2. Update Lambda Configuration

1. Go to the AWS Lambda console
2. Select your function
3. Under "Runtime settings", click "Edit"
4. Make sure:
   - Runtime is set to "Node.js 22.x"
   - Handler is set to "index.handler" (matching your index.mjs file)
5. Save the changes

## 3. Upload the New Code

1. Under "Code source", click "Upload from" and select ".zip file"
2. Upload the function.zip file you created
3. Click "Save"

## 4. Test the Function

1. Create a test event with the following JSON:
   ```json
   {
     "httpMethod": "POST",
     "body": "{\"action\":\"savePatient\",\"user_id\":\"P12345\",\"name\":\"Test Patient\"}"
   }
   ```
2. Click "Test" to run the function

## Common Issues

1. **Missing Dependencies**: Make sure you've installed the AWS SDK v3 packages:
   ```bash
   npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
   ```

2. **Handler Name**: Ensure the handler name in the Lambda configuration matches your export (index.handler)

3. **File Extension**: The file must have the .mjs extension for Node.js to treat it as an ES module

4. **package.json**: Make sure your package.json includes `"type": "module"`