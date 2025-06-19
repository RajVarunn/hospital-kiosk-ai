# Web Speech API Implementation

This project now uses the browser's built-in Web Speech API for speech-to-text functionality.

## Benefits

1. **No server-side processing** - All speech recognition happens in the browser
2. **No API keys required** - Uses the browser's native capabilities
3. **Works offline** - No internet connection needed for speech recognition
4. **Faster results** - Immediate transcription without server round-trips

## Browser Support

The Web Speech API is supported in:
- Chrome (desktop and Android)
- Edge
- Safari (iOS and macOS)
- Firefox (with flags enabled)

## Implementation Details

The speech recognition is implemented using the `SpeechRecognition` interface (or `webkitSpeechRecognition` for WebKit browsers).

Key features:
- Language set to 'en-US'
- Final results only (no interim results)
- Single alternative transcription

## Troubleshooting

If you encounter issues:

1. **Browser compatibility** - Make sure you're using a supported browser
2. **Microphone permissions** - The browser will request microphone access
3. **HTTPS requirement** - Web Speech API typically requires a secure context (HTTPS)
4. **Error handling** - Check the console for specific error messages

## Fallback Options

If Web Speech API doesn't work in your environment:
1. Use the browser's developer tools to check for errors
2. Consider adding a fallback to a server-side solution for unsupported browsers