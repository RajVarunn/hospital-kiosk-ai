/**
 * Fix for Transcribe S3 URI access issue
 * 
 * This script demonstrates how to properly set up S3 permissions for Transcribe
 */

const AWS = require('aws-sdk');

// Load environment variables
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({ 
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Create S3 and Transcribe clients
const s3 = new AWS.S3();
const transcribe = new AWS.TranscribeService();

/**
 * Create a properly configured S3 bucket for Transcribe
 */
async function setupS3ForTranscribe(bucketName) {
  try {
    // Check if bucket exists
    try {
      await s3.headBucket({ Bucket: bucketName }).promise();
      console.log(`Bucket ${bucketName} already exists`);
    } catch (error) {
      if (error.code === 'NotFound' || error.code === 'NoSuchBucket') {
        // Create bucket
        console.log(`Creating bucket ${bucketName}...`);
        await s3.createBucket({ 
          Bucket: bucketName,
          CreateBucketConfiguration: {
            LocationConstraint: AWS.config.region
          }
        }).promise();
      } else {
        throw error;
      }
    }

    // Set bucket policy to allow Transcribe access
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'TranscribeAccess',
          Effect: 'Allow',
          Principal: {
            Service: 'transcribe.amazonaws.com'
          },
          Action: [
            's3:GetObject',
            's3:ListBucket'
          ],
          Resource: [
            `arn:aws:s3:::${bucketName}`,
            `arn:aws:s3:::${bucketName}/*`
          ]
        }
      ]
    };

    await s3.putBucketPolicy({
      Bucket: bucketName,
      Policy: JSON.stringify(policy)
    }).promise();

    console.log(`Bucket policy updated for ${bucketName}`);
    return true;
  } catch (error) {
    console.error('Error setting up S3 for Transcribe:', error);
    return false;
  }
}

/**
 * Upload a file to S3
 */
async function uploadFileToS3(bucketName, key, filePath) {
  try {
    const fs = require('fs');
    const fileContent = fs.readFileSync(filePath);
    
    await s3.putObject({
      Bucket: bucketName,
      Key: key,
      Body: fileContent
    }).promise();
    
    console.log(`File uploaded to s3://${bucketName}/${key}`);
    return `s3://${bucketName}/${key}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    return null;
  }
}

/**
 * Start a transcription job
 */
async function startTranscriptionJob(jobName, mediaUri, outputBucket, outputKey) {
  try {
    const params = {
      TranscriptionJobName: jobName,
      Media: { MediaFileUri: mediaUri },
      MediaFormat: mediaUri.split('.').pop().toLowerCase(),
      LanguageCode: 'en-US',
      OutputBucketName: outputBucket,
      OutputKey: outputKey
    };
    
    await transcribe.startTranscriptionJob(params).promise();
    console.log(`Transcription job ${jobName} started`);
    return true;
  } catch (error) {
    console.error('Error starting transcription job:', error);
    return false;
  }
}

/**
 * Example usage
 */
async function main() {
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'hospital-kiosk-transcribe-bucket';
  console.log(`Setting up bucket: ${bucketName}`);
  const success = await setupS3ForTranscribe(bucketName);
  
  if (success) {
    console.log('S3 bucket is now properly configured for Transcribe');
    console.log('\nTo use this bucket for transcription:');
    console.log(`1. Upload your audio files to s3://${bucketName}/input/`);
    console.log(`2. Set your transcription output to s3://${bucketName}/output/`);
    console.log('3. Make sure your Lambda function has permission to access this bucket');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  setupS3ForTranscribe,
  uploadFileToS3,
  startTranscriptionJob
};