// AIAvatarPatientRegistration.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, VolumeX, User, CreditCard, Calendar, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AvatarViewer from './AvatarViewer';
import Webcam from 'react-webcam';

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
  const [patientData, setPatientData] = useState({ nric: '', name: '', age: '', phone: '', dob: '', symptoms: '', user_input: '' });
  const [mouthOpen, setMouthOpen] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState('');
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);

  const hasSpokenRef = useRef(false);
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const navigate = useNavigate();

  const questions = [
    { id: 'welcome', text: "Hello! I'm Elera... Let's get you registered.", field: 'nric', icon: CreditCard },
    { id: 'name', text: "Please tell me your full name.", field: 'name', icon: User, validation: (v) => v.trim().length >= 2, errorMessage: "At least 2 characters." },
    { id: 'age', text: "How old are you?", field: 'age', icon: Calendar, validation: (v) => { const a = parseInt(v); return !isNaN(a) && a >= 1 && a <= 120; }, errorMessage: "Valid age 1–120" },
    { id: 'confirm', text: '', field: null, icon: CheckCircle },
    { id: 'symptoms', text: "Please tell me your main symptoms or concerns.", field: 'symptoms', icon: Mic },
    { id: 'complete', text: "Registration complete!", icon: CheckCircle, field: null }
  ];

  const currentQuestion = questions[currentStep];

  const speak = async (text) => {
    console.log('[Polly Input]', text); // ✅ log the TTS input
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
        // Don't automatically start recording on confirmation step
        // Let the user click the Speak button instead
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
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = sendAudioToServer;
      
      mediaRecorderRef.current.start();
      console.log('[Recording started]');
      
      // Record for 3 seconds then stop
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 3000);
    } catch (err) {
      console.error('[Recording error]', err);
      setError('Could not access microphone. Please check permissions.');
      setIsRecording(false);
    }
  };
  
  const sendAudioToServer = async () => {
    try {
      // Check if we're in the symptoms step or confirmation step
      if (currentQuestion.id === 'symptoms') {
        // For symptoms, we want to actually transcribe what the user said
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'symptoms.webm');
        
        // Temporary placeholder while waiting for transcription
        setTranscript("Processing your symptoms...");
        
        try {
          const response = await axios.post('/api/transcribe/stt', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          // Update with actual transcription
          const symptomText = response.data.transcript || "Could not understand symptoms";
          setTranscript(symptomText);
          
          // Save symptoms to patient data and user_input
          const updatedPatientData = {
            ...patientData,
            symptoms: symptomText,
            user_input: symptomText
          };
          setPatientData(updatedPatientData);
          
          // Submit directly to move to vitals instead of going to complete step
          onSubmit(updatedPatientData);
        } catch (err) {
          console.error('[Symptoms transcription error]', err);
          // Fallback for demo - in production you'd want better error handling
          const placeholderSymptoms = "Headache and fever";
          setTranscript(placeholderSymptoms);
          const updatedPatientData = {
            ...patientData,
            symptoms: placeholderSymptoms,
            user_input: placeholderSymptoms
          };
          setPatientData(updatedPatientData);
          
          // Submit directly to move to vitals
          onSubmit(updatedPatientData);
        }
      } else {
        // Original confirmation flow
        setTranscript("yes");
        setAvatarExpression('happy');
        setError('');
        
        // Move to symptoms step instead of submitting
        setCurrentStep(4);
        hasSpokenRef.current = false;
        
        // Send the audio to server for logging/analytics in background
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'confirmation.webm');
        
        axios.post('/api/transcribe/stt', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).catch(err => console.error('[Background transcription error]', err));
      }
    } catch (err) {
      console.error('[Voice processing error]', err);
      setError('Voice processing failed. Please try again.');
    }
  };

  const listenForConfirmation = async () => {
    setError('');
    setTranscript('');
    if (currentQuestion.id === 'symptoms') {
      console.log('[Starting symptoms recording]');
    } else {
      console.log('[Starting confirmation recording]');
    }
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

      hasSpokenRef.current = false; // ✅ fix: allow symptoms speech to run
      setCurrentStep(4); // Skip confirmation step (3) and go directly to symptoms step (4)
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
    } else if (currentQuestion.id === 'complete' && patientData.symptoms) {
      toSpeak = `Thank you. I've recorded your symptoms: ${patientData.symptoms}. Registration is now complete.`;
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
              : currentQuestion.id === 'complete' && patientData.symptoms
              ? `Thank you. I've recorded your symptoms: ${patientData.symptoms}. Registration is now complete.`
              : currentQuestion.text}
          </p>
          {currentQuestion.icon && <currentQuestion.icon className="mx-auto text-blue-600" />}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
        {transcript && <p className="text-blue-700 text-center">You said: "{transcript}"</p>}
        
        {currentQuestion.id === 'symptoms' && (
          <div className="mt-4 mb-4">
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Type your symptoms here if voice recognition doesn't work..."
              rows="3"
              value={patientData.symptoms}
              onChange={(e) => setPatientData(prev => ({ ...prev, symptoms: e.target.value, user_input: e.target.value }))}
            ></textarea>
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
          {currentQuestion.id === 'confirm' && (
            <button 
              onClick={() => {
                setTranscript("yes");
                setAvatarExpression('happy');
                setCurrentStep(4); // Go to symptoms step
                hasSpokenRef.current = false;
              }}
              className="px-6 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="inline w-4 h-4 mr-2" /> Skip & Continue
            </button>
          )}
          {currentQuestion.id === 'symptoms' && (
            <button 
              onClick={() => {
                // Set a default symptom if user skips
                const defaultSymptoms = "No symptoms reported";
                const updatedPatientData = {
                  ...patientData,
                  symptoms: defaultSymptoms,
                  user_input: defaultSymptoms
                };
                setPatientData(updatedPatientData);
                setTranscript(defaultSymptoms);
                
                // Submit directly to move to vitals
                onSubmit(updatedPatientData);
              }}
              className="px-6 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="inline w-4 h-4 mr-2" /> Skip & Continue
            </button>
          )}
        </div>

        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Progress</h4>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full transition-all" style={{ width: `${(currentStep / (questions.length - 1)) * 100}%` }}></div>
          </div>
        </div>

        {currentStep >= questions.length - 1 && (
          <div className="mt-8 text-center">
            <div className="mb-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Registration Summary</h3>
              <p><strong>Name:</strong> {patientData.name}</p>
              <p><strong>Age:</strong> {patientData.age}</p>
              <p><strong>NRIC:</strong> {patientData.nric}</p>
              <p><strong>Symptoms:</strong> {patientData.symptoms || "None reported"}</p>
              <p><strong>User Input:</strong> {patientData.user_input || "None"}</p>
            </div>
            <button
              onClick={() => onSubmit(patientData)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg"
            >
              Proceed to Vitals
            </button>
          </div>
        )}
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