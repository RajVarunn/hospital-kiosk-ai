#!/bin/bash

# Apply the S3 bucket policy for Transcribe access
aws s3api put-bucket-policy \
  --bucket elera-audio \
  --policy file://transcribe-bucket-policy.json

echo "Bucket policy applied successfully!"