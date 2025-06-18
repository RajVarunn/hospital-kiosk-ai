#!/bin/bash

# Set your Lambda function name
LAMBDA_FUNCTION_NAME="hospital-kiosk-lambda"

# Get the Lambda function's execution role
ROLE_ARN=$(aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --query 'Configuration.Role' --output text)
ROLE_NAME=$(echo $ROLE_ARN | cut -d'/' -f2)

echo "Lambda function role: $ROLE_NAME"

# Create the Bedrock policy
POLICY_ARN=$(aws iam create-policy --policy-name BedrockInvokePolicy --policy-document file://bedrock-policy.json --query 'Policy.Arn' --output text)

echo "Created policy: $POLICY_ARN"

# Attach the policy to the Lambda role
aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn $POLICY_ARN

echo "Policy attached to role $ROLE_NAME"

# Verify the attached policies
aws iam list-attached-role-policies --role-name $ROLE_NAME