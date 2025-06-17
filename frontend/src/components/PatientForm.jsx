import React, { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, VolumeX, User, Phone, CreditCard, Calendar, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AvatarViewer from './AvatarViewer';


const AIAvatarPatientRegistration =  ({ onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [avatarExpression, setAvatarExpression] = useState('neutral');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [patientData, setPatientData] = useState({
    nric: '', name: '', age: '', phone: ''
  });

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const hasSpokenRef = useRef(false);
  const navigate = useNavigate();

  const questions = [
    {
      id: 'welcome',
      text: "Hello! I'm Elera... Let's start with your NRIC or passport number.",
      field: 'nric',
      icon: CreditCard,
      validation: (val) => /^[STFG]\d{7}[A-Z]$/i.test(val.toUpperCase().replace(/[^A-Z0-9]/g, '')),
      errorMessage: 'Please provide a valid NRIC format like S1234567A'
    },
    { id: 'name', text: "Please tell me your full name.", field: 'name', icon: User, validation: (v) => v.trim().length >= 2, errorMessage: "At least 2 characters." },
    { id: 'age', text: "How old are you?", field: 'age', icon: Calendar, validation: (v) => { const a = parseInt(v); return !isNaN(a) && a >= 1 && a <= 120; }, errorMessage: "Valid age 1–120" },
    { id: 'phone', text: "What's your phone number?", field: 'phone', icon: Phone, validation: (v) => /^[689]\d{7}$/.test(v), errorMessage: "8-digit SG number starting 6,8,9" },
    { id: 'complete', text: "Registration complete!", icon: CheckCircle, field: null }
  ];

  const currentQuestion = questions[currentStep];

  const [mouthOpen, setMouthOpen] = useState(0);

  const speak = async (text) => {
    try {
      setIsSpeaking(true);
      setAvatarExpression('speaking');
  
      const res = await axios.post('/api/openai/tts', { text }, { responseType: 'blob' });
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
        setMouthOpen(volume / 100); // Normalize
        if (!audio.paused) requestAnimationFrame(updateMouth);
      };
  
      audio.onplay = () => updateMouth();
      audio.onended = () => {
        setMouthOpen(0);
        setIsSpeaking(false);
        setAvatarExpression('neutral');
        startRecording();
      };
  
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false);
      setAvatarExpression('neutral');
    }
  };

  const handleTranscript = (input) => {
    let processed = input.trim();

    if (currentQuestion.field === 'nric') processed = processed.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (currentQuestion.field === 'phone') processed = processed.replace(/\D/g, '');
    if (currentQuestion.field === 'age') processed = processed.match(/\d+/)?.[0] || '';
    if (currentQuestion.field === 'preferredLanguage') {
      const map = { chinese: 'mandarin', mandarin: 'mandarin', english: 'english', malay: 'malay', tamil: 'tamil' };
      processed = map[processed.toLowerCase()] || processed.toLowerCase();
    }

    const isValid = currentQuestion.validation ? currentQuestion.validation(processed) : true;

    if (isValid) {
      setPatientData((prev) => ({ ...prev, [currentQuestion.field]: processed }));
      setCurrentStep((s) => {
        hasSpokenRef.current = false;
        return s + 1;
      });
      setAvatarExpression('happy');
      setError('');
      setTranscript('');
    } else {
      setAvatarExpression('concerned');
      setError(currentQuestion.errorMessage);
      speak(currentQuestion.errorMessage);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        setAvatarExpression('processing');

        try {
          const res = await axios.post('/api/whisper/transcribe', formData);
          if (res.data.transcript) {
            handleTranscript(res.data.transcript);
          }
        } catch (err) {
          console.error(err);
          setError('Failed to transcribe. Try again.');
        }
        setIsRecording(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAvatarExpression('listening');

      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 5000);
    } catch (err) {
      console.error('🎤 Recording error:', err);
      setError('Microphone access is required.');
    }
  };

  useEffect(() => {
    if (!audioEnabled || isSpeaking || isRecording || hasSpokenRef.current) return;
    speak(currentQuestion.text);
    hasSpokenRef.current = true;
  }, [currentStep]);

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-row items-start space-x-8">
      {/* Left: Form */}
      <div className="flex-1 bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-center">AI Avatar Registration</h2>
        <div className="text-center mb-4">
          <p className="text-gray-600 mb-2">{currentQuestion.text}</p>
          {currentQuestion.icon && <currentQuestion.icon className="mx-auto text-blue-600" />}
        </div>
        {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
        {transcript && <p className="text-blue-700 text-center">You said: "{transcript}"</p>}
  
        <div className="flex justify-center space-x-4 mt-4">
          <button disabled className="px-4 py-2 rounded-lg text-white bg-gray-400 cursor-not-allowed">
            <Mic className="inline w-4 h-4 mr-2" /> Speak
          </button>
          <button onClick={() => setAudioEnabled(!audioEnabled)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
            {audioEnabled ? <Volume2 className="inline w-4 h-4" /> : <VolumeX className="inline w-4 h-4" />}
          </button>
        </div>
  
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Progress</h4>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full transition-all" style={{ width: `${(currentStep / (questions.length - 1)) * 100}%` }}></div>
          </div>
        </div>
        {currentStep >= questions.length - 1 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => onSubmit(patientData)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg"
            >
              Proceed to Vitals
            </button>
          </div>
        )}
      </div>
  
      {/* Right: Avatar */}
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
