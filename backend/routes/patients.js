const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

// In-memory storage for demo (replace with database later)
let patients = {};
let queue = [];

// Mock OpenAI service
const openaiService = {
  generateMedicalResponse: async (message, context) => {
    return {
      message: `This is a mock response to: "${message}". Real AI integration is not implemented.`,
      extractedInfo: []
    };
  }
};

// Register new patient
router.post('/register', async (req, res) => {
  try {
    const { nric, name, age, phone } = req.body;
    
    // Simulate NRIC validation
    if (!nric || nric.length < 9) {
      return res.status(400).json({ error: 'Invalid NRIC' });
    }

    const patientId = uuidv4();
    const queueNumber = queue.length + 1;
    
    // Generate QR code for mobile access
    const mobileUrl = `${process.env.FRONTEND_URL}/mobile/${patientId}`;
    const qrCodeData = await QRCode.toDataURL(mobileUrl);

    const patient = {
      id: patientId,
      nric,
      name,
      age,
      phone,
      queueNumber,
      qrCode: qrCodeData,
      mobileUrl,
      status: 'registered',
      vitals: {},
      medicalHistory: [],
      createdAt: new Date().toISOString()
    };

    patients[patientId] = patient;
    queue.push({
      id: uuidv4(),
      patientId,
      queueNumber,
      status: 'waiting',
      estimatedWaitTime: queueNumber * 15 // 15 minutes per patient
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('new_patient', patient);
    io.emit('queue_update', queue);

    res.json({
      success: true,
      patient: {
        id: patientId,
        name,
        queueNumber,
        qrCode: qrCodeData,
        mobileUrl
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get patient details
router.get('/:id', (req, res) => {
  const patient = patients[req.params.id];
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json(patient);
});

// AI Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, patientId, context = {} } = req.body;

    // Get patient context if ID provided
    let patientContext = '';
    if (patientId && patients[patientId]) {
      const patient = patients[patientId];
      patientContext = `Patient: ${patient.name}, Age: ${patient.age}. Previous medical history: ${patient.medicalHistory.join(', ') || 'None recorded'}.`;
    }

    const response = await openaiService.generateMedicalResponse(message, {
      ...context,
      patientContext
    });

    // Store conversation in patient record
    if (patientId && patients[patientId]) {
      if (!patients[patientId].conversation) {
        patients[patientId].conversation = [];
      }
      patients[patientId].conversation.push({
        type: 'user',
        message,
        timestamp: new Date().toISOString()
      });
      patients[patientId].conversation.push({
        type: 'ai',
        message: response.message,
        timestamp: new Date().toISOString()
      });

      // Extract medical information if AI identified any
      if (response.extractedInfo) {
        patients[patientId].medicalHistory.push(...response.extractedInfo);
      }
    }

    res.json(response);

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat service unavailable' });
  }
});

// Update patient vitals
router.put('/:id/vitals', (req, res) => {
  const patient = patients[req.params.id];
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const { bloodPressure, temperature, heartRate, weight, height } = req.body;
  
  patient.vitals = {
    bloodPressure,
    temperature,
    heartRate,
    weight,
    height,
    recordedAt: new Date().toISOString()
  };

  // Emit real-time update to staff dashboard
  const io = req.app.get('io');
  io.emit('vitals_update', {
    patientId: patient.id,
    vitals: patient.vitals
  });

  res.json({ success: true, vitals: patient.vitals });
});

// Get all patients (for staff dashboard)
router.get('/', (req, res) => {
  const patientList = Object.values(patients).map(p => ({
    id: p.id,
    name: p.name,
    age: p.age,
    queueNumber: p.queueNumber,
    status: p.status,
    vitals: p.vitals,
    createdAt: p.createdAt
  }));
  
  res.json(patientList);
});

module.exports = router;