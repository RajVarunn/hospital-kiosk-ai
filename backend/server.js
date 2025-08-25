require('dotenv').config(); // VERY FIRST LINE

// Polyfill fetch for OpenAI
if (!globalThis.fetch) {
  globalThis.fetch = require('node-fetch');
}

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '10mb' })); // to support base64

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// API routes
app.use('/api/patients', require('./routes/patients'));
app.use('/api/queue', require('./routes/queue'));
app.use('/api/whisper', require('./routes/whisper'));
app.use('/api/rekognition', require('./routes/rekognition'));
app.use('/api/openai-tts', require('./routes/openai-tts'));
app.use('/api/openai', require('./routes/openai'));


// Basic health check
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('OpenAI Key present:', !!process.env.OPENAI_API_KEY);
});