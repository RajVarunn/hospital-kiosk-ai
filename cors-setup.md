# Fixing CORS Issues with API Gateway and Lambda

If you're seeing CORS errors like:

```
Access to XMLHttpRequest at 'https://lp5utunomb.execute-api.us-west-2.amazonaws.com/prod' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Follow these steps to fix the issue:

## 1. Update Lambda Function

Make sure your Lambda function handles OPTIONS requests and includes proper CORS headers:

```javascript
exports.handler = async (event, context) => {
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }
  
  // Rest of your function...
}
```

## 2. Configure API Gateway CORS

1. Go to API Gateway in the AWS Console
2. Select your API
3. Select the resource (e.g., /hospital-data)
4. Click "Actions" and select "Enable CORS"
5. For "Access-Control-Allow-Origin", enter "*" (or your specific domain)
6. For "Access-Control-Allow-Headers", enter "Content-Type,X-Amz-Date,Authorization,X-Api-Key"
7. For "Access-Control-Allow-Methods", ensure "OPTIONS" and "POST" are checked
8. Click "Enable CORS and replace existing CORS headers"
9. Click "Actions" and select "Deploy API" to deploy the changes

## 3. Create OPTIONS Method

1. Select your resource (e.g., /hospital-data)
2. Click "Actions" and select "Create Method"
3. Select "OPTIONS" from the dropdown and click the checkmark
4. For Integration type, select "Mock"
5. Click "Save"
6. Go to the "Integration Response" for the OPTIONS method
7. Expand the default response
8. Add the following header mappings:
   - Access-Control-Allow-Origin: '*'
   - Access-Control-Allow-Headers: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key'
   - Access-Control-Allow-Methods: 'OPTIONS,POST'
9. Click "Save"
10. Deploy the API again

## 4. Test CORS Configuration

Use this curl command to test the OPTIONS preflight request:

```bash
curl -v -X OPTIONS \
  'https://lp5utunomb.execute-api.us-west-2.amazonaws.com/prod' \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type'
```

You should see the Access-Control-Allow-Origin header in the response.

## 5. Update Frontend Code

Make sure your frontend code includes the Content-Type header:

```javascript
const response = await axios.post(API_ENDPOINT, payload, {
  headers: {
    'Content-Type': 'application/json'
  }
});
```