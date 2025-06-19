# Fixing Amazon Transcribe S3 URI Access Issue

The error `BadRequestException: The S3 URI that you provided can't be accessed` occurs when Amazon Transcribe doesn't have permission to access the S3 bucket containing your audio files.

## Quick Fix

1. Run the `transcribe-fix.js` script to create a properly configured S3 bucket:
   ```bash
   cd backend
   node transcribe-fix.js
   ```

2. Update your code to use this new bucket for transcription jobs.

## Manual Fix

If you prefer to fix the issue manually:

1. **Check S3 bucket permissions**:
   - Go to the S3 console
   - Select your bucket
   - Go to "Permissions" tab
   - Add a bucket policy that allows Transcribe access:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "TranscribeAccess",
         "Effect": "Allow",
         "Principal": {
           "Service": "transcribe.amazonaws.com"
         },
         "Action": [
           "s3:GetObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::YOUR-BUCKET-NAME",
           "arn:aws:s3:::YOUR-BUCKET-NAME/*"
         ]
       }
     ]
   }
   ```

2. **Verify the S3 URI format**:
   - Make sure you're using the correct format: `s3://bucket-name/path/to/file.mp3`
   - Check that the file actually exists in the specified location

3. **Check IAM permissions**:
   - Make sure your Lambda function or application has these permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::YOUR-BUCKET-NAME",
           "arn:aws:s3:::YOUR-BUCKET-NAME/*"
         ]
       },
       {
         "Effect": "Allow",
         "Action": [
           "transcribe:StartTranscriptionJob",
           "transcribe:GetTranscriptionJob"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

## Testing the Fix

After applying the fix, test your transcription with this code:

```javascript
const AWS = require('aws-sdk');
const transcribe = new AWS.TranscribeService();

async function testTranscription() {
  const params = {
    TranscriptionJobName: 'test-job-' + Date.now(),
    Media: { MediaFileUri: 's3://hospital-kiosk-transcribe-bucket/test.mp3' },
    MediaFormat: 'mp3',
    LanguageCode: 'en-US',
    OutputBucketName: 'hospital-kiosk-transcribe-bucket',
    OutputKey: 'output/test-result.json'
  };
  
  try {
    const result = await transcribe.startTranscriptionJob(params).promise();
    console.log('Transcription job started:', result);
    return true;
  } catch (error) {
    console.error('Error starting transcription job:', error);
    return false;
  }
}

testTranscription();
```