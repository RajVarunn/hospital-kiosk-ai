const express = require('express');
const multer = require('multer');
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fetch = require('node-fetch');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

AWS.config.update({ region: 'us-west-2' });

const s3 = new AWS.S3();
const transcribe = new AWS.TranscribeService();

router.post('/stt', upload.single('audio'), async (req, res) => {
  const file = req.file;
  const s3Key = `recordings/${uuidv4()}.webm`;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  try {
    // ✅ Step 1: Upload audio to S3 (no ACL needed if bucket policy allows public read)
    await s3.upload({
      Bucket: bucketName,
      Key: s3Key,
      Body: fs.createReadStream(file.path),
      ContentType: 'audio/webm'
    }).promise();

    // ✅ Step 2: Use direct S3 HTTPS URL (object must be publicly readable)
    const mediaUri = `https://${bucketName}.s3.us-west-2.amazonaws.com/${s3Key}`;

    // ✅ Step 3: Start Transcription Job
    const jobName = `transcription-${uuidv4()}`;
    await transcribe.startTranscriptionJob({
      TranscriptionJobName: jobName,
      LanguageCode: 'en-US',
      MediaFormat: 'webm',
      Media: { MediaFileUri: mediaUri }
    }).promise();

    // ✅ Step 4: Poll Transcription Job Status
    const pollForTranscript = async () => {
      for (let i = 0; i < 20; i++) { // Increased from 10 to 20 attempts
        const job = await transcribe.getTranscriptionJob({ TranscriptionJobName: jobName }).promise();
        const status = job.TranscriptionJob.TranscriptionJobStatus;

        if (status === 'COMPLETED') {
          const transcriptUri = job.TranscriptionJob.Transcript.TranscriptFileUri;
          const response = await fetch(transcriptUri);
          const data = await response.json();
          return data.results.transcripts[0]?.transcript || '';
        } else if (status === 'FAILED') {
          throw new Error('Transcription job failed.');
        }

        // Reduce wait time for faster response
        await new Promise(resolve => setTimeout(resolve, 1500)); // wait 1.5 seconds instead of 3
      }

      // Return a fallback message instead of throwing an error
      console.log('Transcription timed out, returning fallback');
      return 'Sorry, I could not transcribe your speech. Please try again.';
    };

    const transcript = await pollForTranscript();
    res.json({ transcript });

  } catch (err) {
    console.error('[Transcribe Error]', err);
    res.status(500).json({ error: 'Transcription failed', details: err.message });
  } finally {
    if (file) {
      fs.unlink(file.path, () => {}); // async cleanup
    }
  }
});

module.exports = router;