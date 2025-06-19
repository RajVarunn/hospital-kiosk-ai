# Web API Speech-to-Text Implementation

This project now uses OpenAI's Whisper API for speech-to-text transcription instead of AWS Transcribe.

## Benefits

1. **No S3 permissions required** - Eliminates the "S3 URI can't be accessed" error
2. **Faster transcription** - Direct API call without polling for job completion
3. **Simpler implementation** - Fewer moving parts and dependencies

## Requirements

1. An OpenAI API key with access to the Whisper API
2. The following npm packages:
   - form-data
   - node-fetch

## Setup

1. Make sure your `.env` file contains your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. Install required dependencies:
   ```bash
   cd backend
   npm install form-data node-fetch@2
   ```

## Testing

You can test the Whisper API integration with the provided test script:

```bash
cd backend
node test-whisper.js
```

Note: You'll need to provide a real audio file at `./uploads/test-audio.webm` for the test to work properly.

## Troubleshooting

If you encounter issues:

1. **Check your OpenAI API key** - Make sure it's valid and has access to the Whisper API
2. **Verify audio format** - Whisper supports various formats including mp3, mp4, mpeg, mpga, m4a, wav, and webm
3. **Check file size** - Files must be less than 25 MB
4. **Check console logs** - The error message should provide details about what went wrong

## Reverting to AWS Transcribe

If you need to revert to AWS Transcribe:

1. Check out the previous version of `backend/routes/transcribe.js`
2. Make sure your AWS credentials and S3 bucket permissions are properly configured
3. Follow the instructions in `TRANSCRIBE-FIX.md` to set up the required permissions