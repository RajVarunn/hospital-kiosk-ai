/**
 * Debugging Lambda function to understand API Gateway integration
 */

export const handler = async (event, context) => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));
  
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
  
  // Return the event structure for debugging
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'OPTIONS,POST'
    },
    body: JSON.stringify({
      message: 'Debug information',
      eventStructure: {
        hasBody: !!event.body,
        bodyType: event.body ? typeof event.body : 'N/A',
        bodyLength: event.body ? event.body.length : 0,
        hasHttpMethod: !!event.httpMethod,
        httpMethod: event.httpMethod || 'N/A',
        hasRequestContext: !!event.requestContext,
        hasPathParameters: !!event.pathParameters,
        hasQueryStringParameters: !!event.queryStringParameters,
        eventKeys: Object.keys(event)
      },
      // Include a safe subset of the event
      event: {
        httpMethod: event.httpMethod,
        path: event.path,
        queryStringParameters: event.queryStringParameters,
        requestContext: event.requestContext ? {
          resourcePath: event.requestContext.resourcePath,
          httpMethod: event.requestContext.httpMethod,
          stage: event.requestContext.stage
        } : null,
        body: event.body ? (event.body.length > 1000 ? event.body.substring(0, 1000) + '...' : event.body) : null
      }
    })
  };
};