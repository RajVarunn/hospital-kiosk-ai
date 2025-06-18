# Setting Up AWS Bedrock for Your Lambda Function

The error message `User: arn:... is not authorized to perform: bedrock:InvokeModel` indicates that your Lambda function doesn't have the necessary IAM permissions to call the Bedrock API.

## Option 1: Update IAM Permissions in AWS Console (Recommended)

1. **Create an IAM Policy for Bedrock**
   - Go to IAM > Policies > Create policy
   - Choose JSON and paste this policy:
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
   - Name it "BedrockInvokePolicy" and create it

2. **Find Your Lambda Function's Role**
   - Go to Lambda > Functions > [your-function-name] > Configuration > Permissions
   - Note the Role name (e.g., "hospital-kiosk-lambda-role")

3. **Attach the Policy to the Role**
   - Go to IAM > Roles > [your-lambda-role]
   - Click "Add permissions" > "Attach policies"
   - Search for "BedrockInvokePolicy" and select it
   - Click "Attach policies"

4. **Verify Bedrock Model Access**
   - Go to Amazon Bedrock > Model access
   - Ensure Claude models are enabled for your account
   - If not, request access and wait for approval

## Option 2: Update Using AWS CLI

Run these commands in your terminal:

```bash
# Set your Lambda function name
LAMBDA_FUNCTION_NAME="hospital-kiosk-lambda"

# Get the Lambda function's execution role
ROLE_ARN=$(aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --query 'Configuration.Role' --output text)
ROLE_NAME=$(echo $ROLE_ARN | cut -d'/' -f2)

# Create the Bedrock policy
POLICY_ARN=$(aws iam create-policy --policy-name BedrockInvokePolicy --policy-document file://bedrock-policy.json --query 'Policy.Arn' --output text)

# Attach the policy to the Lambda role
aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn $POLICY_ARN
```

## Option 3: Update Lambda Function Code

If you can't modify IAM permissions, use the updated bedrockTest function in `updated-bedrock-function.js` which:

1. Uses AWS SDK v2 for better Lambda compatibility
2. Has improved error handling
3. Includes a fallback mechanism if Bedrock API calls fail

## Testing the Fix

After applying the IAM permissions:

1. Deploy your Lambda function again
2. Test the health assessment feature
3. Check CloudWatch logs for any remaining errors

If you still encounter issues, try using a different Bedrock model like "anthropic.claude-v2" which might have different access requirements.