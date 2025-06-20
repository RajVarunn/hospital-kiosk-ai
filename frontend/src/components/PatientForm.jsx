import React, { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, VolumeX, User, CreditCard, Calendar, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AvatarViewer from './AvatarViewer';
import Webcam from 'react-webcam';
import dynamoService from '../services/dynamoService';

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: 'environment'
};

const AIAvatarPatientRegistration = ({ onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [avatarExpression, setAvatarExpression] = useState('neutral');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [patientData, setPatientData] = useState({ nric: '', name: '', age: '', phone: '', dob: '', symptoms: '' });
  const [mouthOpen, setMouthOpen] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const hasSpokenRef = useRef(false);
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const questions = [
    { id: 'welcome', text: "Hello! I'm Elera... Let's get you registered.", field: 'nric', icon: CreditCard },
    { id: 'name', text: "Please tell me your full name.", field: 'name', icon: User, validation: (v) => v.trim().length >= 2, errorMessage: "At least 2 characters." },
    { id: 'age', text: "How old are you?", field: 'age', icon: Calendar, validation: (v) => { const a = parseInt(v); return !isNaN(a) && a >= 1 && a <= 120; }, errorMessage: "Valid age 1–120" },
    { id: 'confirm', text: '', field: null, icon: CheckCircle },
    { id: 'symptoms', text: "Please tell me what symptoms you're experiencing today.", field: 'symptoms', icon: CheckCircle },
    { id: 'complete', text: "Registration complete!", icon: CheckCircle, field: null }
  ];

  const currentQuestion = questions[currentStep];

  const speak = async (text) => {
    try {
      setIsSpeaking(true);
      setAvatarExpression('speaking');
      const res = await axios.post('/api/polly/tts', { text }, { responseType: 'blob' });
      const audioBlob = new Blob([res.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      const context = new AudioContext();
      const source = context.createMediaElementSource(audio);
      const analyser = context.createAnalyser();
      source.connect(analyser);
      analyser.connect(context.destination);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const updateMouth = () => {
        analyser.getByteFrequencyData(data);
        const volume = data.reduce((a, b) => a + b) / data.length;
        setMouthOpen(volume / 100);
        if (!audio.paused) requestAnimationFrame(updateMouth);
      };

      audio.onplay = () => updateMouth();
      audio.onended = () => {
        setMouthOpen(0);
        setIsSpeaking(false);
        setAvatarExpression('neutral');
      };

      audio.volume = 1;
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false);
      setAvatarExpression('neutral');
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    setTranscript("Listening...");
    setAvatarExpression('thinking');
    
    try {
      // Check if Web Speech API is supported
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Web Speech API is not supported in this browser');
      }
      
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleSpeechResult(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('[Speech recognition error]', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
        setAvatarExpression('neutral');
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      // Start recognition
      recognition.start();
      
    } catch (err) {
      console.error('[Speech recognition error]', err);
      setError(err.message || 'Could not access speech recognition. Please check permissions.');
      setIsRecording(false);
      setAvatarExpression('neutral');
    }
  };
  
  const handleSpeechResult = async (speechTranscript) => {
    try {
      setTranscript(speechTranscript);
      setAvatarExpression('neutral');
      
      // Handle confirmation step
      if (currentQuestion.id === 'confirm') {
        if (speechTranscript.toLowerCase().includes('yes')) {
          setAvatarExpression('happy');
          setError('');
          hasSpokenRef.current = false;
          setCurrentStep(currentStep + 1); // Move to symptoms step
        } else {
          setError("Sorry, I didn't hear a 'yes'. Please try again.");
        }
      } 
      // Handle symptoms step
      else if (currentQuestion.id === 'symptoms') {
        if (speechTranscript.trim().length > 0) {
          setPatientData(prev => ({
            ...prev,
            symptoms: speechTranscript
          }));
          
          setAvatarExpression('happy');
          setError('');
          
          try {
            // Save to DynamoDB
            await dynamoService.savePatient({
              id: patientData.nric,
              name: patientData.name,
              nric: patientData.nric,
              dob: patientData.dob,
              age: patientData.age,
              gender: patientData.gender || '',
              symptoms: speechTranscript
            });
          } catch (err) {
            console.error('DynamoDB save error:', err);
          }
          
          hasSpokenRef.current = false;
          setCurrentStep(currentStep + 1); // Move to complete step
          onSubmit({...patientData, symptoms: speechTranscript});
        } else {
          setError("I couldn't hear your symptoms. Please try again.");
        }
      }
    } catch (err) {
      console.error('[Voice processing error]', err);
      setError('Voice processing failed. Please try again.');
      setAvatarExpression('neutral');
    }
  };

  const listenForConfirmation = () => {
    setError('');
    setTranscript('');
    startRecording();
  };

  const handleScanNric = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    const byteString = atob(imageSrc.split(',')[1]);
    const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: mimeString });
    const formData = new FormData();
    formData.append('image', blob, 'nric.png');

    try {
      const res = await axios.post('/api/rekognition/nric', formData);
      const { nric, name, dob } = res.data;
      const dobDate = dob ? new Date(dob.split('-').reverse().join('-')) : null;
      const today = new Date();
      const age = dobDate ? today.getFullYear() - dobDate.getFullYear() - (today < new Date(dobDate.setFullYear(today.getFullYear())) ? 1 : 0) : '';

      setPatientData((prev) => ({
        ...prev,
        nric: nric || prev.nric,
        name: name || prev.name,
        dob: dob || prev.dob,
        age: age || prev.age
      }));

      hasSpokenRef.current = false;
      setCurrentStep(3);
      setTranscript(nric || name || '');
    } catch (err) {
      console.error('[NRIC Scan Failed]', err);
      setError('NRIC scan failed. Try again.');
    }
  };

  useEffect(() => {
    if (!audioEnabled || isSpeaking || hasSpokenRef.current) return;

    let toSpeak = currentQuestion.text;
    if (currentQuestion.id === 'confirm') {
      toSpeak = `You are ${patientData.name || 'unknown'}, ${patientData.age || 'unknown'} years old, NRIC ${patientData.nric || 'not detected'}. Please say yes to confirm.`;
    }

    if (toSpeak.trim()) {
      speak(toSpeak);
      hasSpokenRef.current = true;
    }
  }, [currentStep, audioEnabled, isSpeaking]);

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-row items-start space-x-8">
      <div className="flex-1 bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-center">AI Avatar Registration</h2>
        <div className="text-center mb-4">
          <p className="text-gray-600 mb-2">
            {currentQuestion.id === 'confirm'
              ? `You are ${patientData.name}, ${patientData.age} years old, NRIC ${patientData.nric}. Please say yes to confirm.`
              : currentQuestion.text}
          </p>
          {currentQuestion.icon && <currentQuestion.icon className="mx-auto text-blue-600" />}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
        {transcript && <p className="text-blue-700 text-center">You said: "{transcript}"</p>}
        
        {currentQuestion.id === 'symptoms' && patientData.symptoms && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="font-medium">Recorded symptoms:</p>
            <p className="text-gray-700">{patientData.symptoms}</p>
          </div>
        )}

        {currentQuestion.field === 'nric' && (
          <div className="text-center my-4">
            <p className="mb-2 text-gray-600">Align your NRIC within the box. We'll scan it automatically.</p>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/png"
              videoConstraints={videoConstraints}
              className="rounded-xl"
            />
            <button
              onClick={handleScanNric}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg"
            >
              Scan NRIC
            </button>
          </div>
        )}

        <div className="flex justify-center space-x-4 mt-4">
          <button
            onClick={(currentQuestion.id === 'confirm' || currentQuestion.id === 'symptoms') ? listenForConfirmation : null}
            className={`px-4 py-2 rounded-lg text-white ${(currentQuestion.id === 'confirm' || currentQuestion.id === 'symptoms') ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}
            disabled={(currentQuestion.id !== 'confirm' && currentQuestion.id !== 'symptoms') || isRecording}
          >
            <Mic className="inline w-4 h-4 mr-2" /> {isRecording ? 'Recording...' : 'Speak'}
          </button>
          <button onClick={() => setAudioEnabled(!audioEnabled)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
            {audioEnabled ? <Volume2 className="inline w-4 h-4" /> : <VolumeX className="inline w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 h-[500px] rounded-xl overflow-hidden shadow-lg bg-white">
        <AvatarViewer
          url="https://models.readyplayer.me/68333920db2234a7fa761405.glb"
          mouthOpen={mouthOpen}
        />
      </div>
    </div>
  );
};

export default AIAvatarPatientRegistration;