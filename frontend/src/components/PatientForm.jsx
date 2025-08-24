import React, { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, VolumeX, User, CreditCard, Calendar, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AvatarViewer from './AvatarViewer';
import LanguageSelector from './LanguageSelector';
import LanguageSelection from './LanguageSelection';
import Webcam from 'react-webcam';
import dynamoService from '../services/dynamoService';
import supabaseService from '../services/supabaseService';
import { getTranslation } from '../utils/translations';

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: 'environment'
};

const AIAvatarPatientRegistration = ({ onSubmit }) => {
  const [showLanguageSelection, setShowLanguageSelection] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [avatarExpression, setAvatarExpression] = useState('neutral');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [patientData, setPatientData] = useState({ nric: '', name: '', age: '', phone: '', dob: '', symptoms: '' });
  const [mouthOpen, setMouthOpen] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasFinishedSpeaking, setHasFinishedSpeaking] = useState(false);
  const [language, setLanguage] = useState('en');

  const hasSpokenRef = useRef(false);
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const getQuestions = () => [
    { id: 'welcome', text: getTranslation('welcome', language), field: 'nric', icon: CreditCard },
    { id: 'name', text: "Please tell me your full name.", field: 'name', icon: User, validation: (v) => v.trim().length >= 2, errorMessage: "At least 2 characters." },
    { id: 'age', text: "How old are you?", field: 'age', icon: Calendar, validation: (v) => { const a = parseInt(v); return !isNaN(a) && a >= 1 && a <= 120; }, errorMessage: "Valid age 1–120" },
    { id: 'confirm', text: '', field: null, icon: CheckCircle },
    { id: 'symptoms', text: getTranslation('symptoms', language), field: 'symptoms', icon: CheckCircle },
    { id: 'complete', text: "Registration complete!", icon: CheckCircle, field: null }
  ];
  
  const questions = getQuestions();

  const currentQuestion = questions[currentStep];

  const speak = async (text) => {
    try {
      console.log('Speaking:', text);
      setIsSpeaking(true);
      setHasFinishedSpeaking(false);
      setAvatarExpression('speaking');
      
      // Use OpenAI's TTS API with language support
      const res = await axios.post('/api/openai-tts/tts', { 
        text, 
        voice: language === 'zh' ? 'alloy' : 'nova',
        language: language === 'zh' ? 'zh' : 'en'
      }, { responseType: 'blob' });
      
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
        console.log('Speech ended for question:', currentQuestion.id);
        setMouthOpen(0);
        setIsSpeaking(false);
        setAvatarExpression('neutral');
        setHasFinishedSpeaking(true);
        
        // No longer auto-start recording - user must click the button
      };

      audio.volume = 1;
      await audio.play();
    } catch (err) {
      console.error('OpenAI TTS error:', err);
      setIsSpeaking(false);
      setAvatarExpression('neutral');
      setHasFinishedSpeaking(true);
      
      // No longer auto-start recording even if TTS fails
    }
  };

  const startRecording = async () => {
    if (isRecording) {
      console.log('Already recording, skipping');
      return;
    }
    
    if (isSpeaking) {
      console.log('Still speaking, waiting...');
      setTimeout(() => startRecording(), 500);
      return;
    }
    
    console.log('Starting recording for:', currentQuestion.id);
    setIsRecording(true);
    setHasFinishedSpeaking(false); // Reset speaking state when recording
    setTranscript("");
    setAvatarExpression('thinking');
    setError('');
    
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        throw new Error('Audio recording is not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];
      
      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });
      
      mediaRecorder.addEventListener("stop", async () => {
        stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('language', language === 'zh' ? 'zh-CN' : 'en-US');
        
        try {
          const response = await axios.post('/api/whisper/transcribe', formData);
          const transcript = response.data.transcript;
          console.log('Transcription received:', transcript);
          
          handleSpeechResult(transcript);
        } catch (error) {
          console.error('Transcription error:', error);
          
          if (currentQuestion.id === 'confirm') {
            console.log('Transcription failed for confirmation, assuming yes');
            handleSpeechResult('yes');
          } else {
            setError('Failed to transcribe audio. Please try again.');
            setIsRecording(false);
            setAvatarExpression('neutral');
          }
        }
      });
      
      mediaRecorder.start();
      console.log('MediaRecorder started');
      
      // Set up silence detection
      const silenceThreshold = 0.015; // Slightly higher threshold to detect silence more easily
      let silenceStart = null;
      const silenceTimeout = 1000; // 1 second of silence to stop
      
      const analyser = new AnalyserNode(new AudioContext(), { fftSize: 256 });
      const source = new MediaStreamAudioSourceNode(analyser.context, { mediaStream: stream });
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      // Check for silence more frequently (every 50ms)
      const silenceDetector = setInterval(() => {
        if (mediaRecorder.state !== 'recording') {
          clearInterval(silenceDetector);
          return;
        }
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedAverage = average / 255; // Normalize to 0-1
        
        if (normalizedAverage < silenceThreshold) {
          // Silence detected
          if (!silenceStart) {
            silenceStart = Date.now();
            // Keep silence detection but don't show visual indicator
          } else if (Date.now() - silenceStart > silenceTimeout) {
            // Stop after silence duration threshold
            console.log('Silence detected, stopping recording');
            clearInterval(silenceDetector);
            mediaRecorder.stop();
          }
        } else {
          // Reset silence timer if sound detected
          silenceStart = null;
        }
      }, 50);
      
      // Add a shorter timeout for silence detection
      setTimeout(() => {
        if (silenceStart && mediaRecorder.state === 'recording') {
          console.log('Silence confirmed, stopping recording early');
          clearInterval(silenceDetector);
          mediaRecorder.stop();
        }
      }, 1500);
      
      // Backup timeout in case silence detection fails
      setTimeout(() => {
        clearInterval(silenceDetector);
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          console.log('Recording stopped after max timeout');
        }
      }, 3000);
      
    } catch (err) {
      console.error('Recording error:', err);
      setError(err.message || 'Could not access microphone. Please check permissions.');
      setIsRecording(false);
      setAvatarExpression('neutral');
    }
  };
  
  const handleSpeechResult = async (speechTranscript) => {
    try {
      console.log('Processing speech result:', speechTranscript, 'for step:', currentQuestion.id);
      setIsRecording(false);
      setTranscript(speechTranscript);
      setAvatarExpression('neutral');
      
      // Handle confirmation step
      if (currentQuestion.id === 'confirm') {
        console.log('Handling confirmation step with transcript:', speechTranscript);
        
        // Check if user confirmed (yes, ok, correct, etc.)
        const confirmWords = language === 'zh' 
          ? ['是', '对', '正确', '好', '确认', '是的']
          : ['yes', 'yeah', 'yep', 'correct', 'right', 'ok', 'okay', 'confirm'];
        
        const userConfirmed = confirmWords.some(word => 
          speechTranscript.toLowerCase().includes(word.toLowerCase())
        );
        
        if (userConfirmed) {
          setAvatarExpression('happy');
          setError('');
          
          setTimeout(async () => {
            setCurrentStep(4);
            hasSpokenRef.current = false;
            setHasFinishedSpeaking(false);
            setTranscript('');
            setError('');
            
            setTimeout(async () => {
              await speak(getTranslation('symptoms', language));
            }, 300);
          }, 1000);
        } else {
          setAvatarExpression('neutral');
          setError(language === 'zh' ? '请说"是"确认信息' : 'Please say "yes" to confirm your information');
          setTimeout(async () => {
            const confirmationMessage = language === 'zh' 
              ? `您是${patientData.name}，${patientData.age}岁，身份证号${patientData.nric}。请说"是"确认。`
              : `You are ${patientData.name}, ${patientData.age} years old, NRIC ${patientData.nric}. Please say yes to confirm.`;
            await speak(confirmationMessage);
          }, 1000);
        }
      } 
      // Handle symptoms step
      else if (currentQuestion.id === 'symptoms') {
        console.log('Handling symptoms step');
        
        if (speechTranscript.trim().length > 0) {
          console.log('Symptoms recorded:', speechTranscript);
          
          // Update patient data with symptoms
          const updatedPatientData = {
            ...patientData,
            symptoms: speechTranscript
          };
          
          setPatientData(updatedPatientData);
          setAvatarExpression('happy');
          setError('');
          
          try {
            // Prepare patient data
            const patientRecord = {
              id: patientData.nric,
              name: patientData.name,
              nric: patientData.nric,
              dob: patientData.dob,
              age: patientData.age,
              gender: patientData.gender || '',
              symptoms: speechTranscript
            };
            
            // Save to Supabase (non-blocking)
            supabaseService.savePatient(patientRecord)
              .then(result => {
                if (result) console.log('Patient data saved to Supabase');
              })
              .catch(err => console.error('Supabase save error (non-blocking):', err));
            
            // Save to DynamoDB (this one we'll await since it's critical)
            await dynamoService.savePatient(patientRecord);
            console.log('Patient data saved to DynamoDB');
          } catch (err) {
            console.error('Database save error:', err);
          }
          
          // Move to complete step
          setCurrentStep(5);
          hasSpokenRef.current = false;
          setHasFinishedSpeaking(false); // Reset speaking state for new step
          
          // Speak completion message and redirect
          setTimeout(async () => {
            await speak(getTranslation('complete', language));
            
            // Call onSubmit after speaking
            setTimeout(() => {
              onSubmit(updatedPatientData);
            }, 2000);
          }, 500);
          
        } else {
          setError(getTranslation('errorHear', language));
          // Don't automatically restart recording - let user click the button
          setTimeout(async () => {
            await speak(getTranslation('errorHear', language));
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      setError('Voice processing failed. Please try again.');
      setAvatarExpression('neutral');
      setIsRecording(false);
    }
  };

  const handleScanNric = async () => {
    if (!webcamRef.current) return;
    
    setError('');
    console.log('Scanning NRIC...');
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      const byteString = atob(imageSrc.split(',')[1]);
      const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mimeString });
      const formData = new FormData();
      formData.append('image', blob, 'nric.png');

      const res = await axios.post('/api/rekognition/nric', formData);
      console.log('NRIC scan response:', res.data);
      
      const { nric, name, dob } = res.data;
      
      if (!nric && !name && !dob) {
        setError('Could not read information from the ID card. Please try again.');
        return;
      }
      
      const dobDate = dob ? new Date(dob.split('-').reverse().join('-')) : null;
      const today = new Date();
      const age = dobDate ? today.getFullYear() - dobDate.getFullYear() - (today < new Date(dobDate.setFullYear(today.getFullYear())) ? 1 : 0) : '';

      const updatedPatientData = {
        ...patientData,
        nric: nric || patientData.nric,
        name: name || patientData.name,
        dob: dob || patientData.dob,
        age: age || patientData.age
      };
      
      console.log('Updated patient data:', updatedPatientData);
      
      // Update patient data and move to confirmation step
      setPatientData(updatedPatientData);
      setCurrentStep(3); // confirmation step
      setTranscript(`NRIC: ${nric}, Name: ${name}`);
      setHasFinishedSpeaking(false); // Reset speaking state for new step
      
      // Prevent useEffect from triggering
      hasSpokenRef.current = true;
      
      // Speak confirmation message
      const confirmationMessage = language === 'zh' 
        ? `您是${updatedPatientData.name}，${updatedPatientData.age}岁，身份证号${updatedPatientData.nric}。请说“是”确认。`
        : `You are ${updatedPatientData.name}, ${updatedPatientData.age} years old, NRIC ${updatedPatientData.nric}. Please say yes to confirm.`;
      
      setTimeout(async () => {
        await speak(confirmationMessage);
      }, 500);
      
    } catch (err) {
      console.error('NRIC Scan Failed:', err);
      setError('NRIC scan failed. Please try again.');
    }
  };

  // Only trigger speaking for the initial welcome message
  useEffect(() => {
    if (currentStep === 0 && audioEnabled && !hasSpokenRef.current && !isSpeaking && !showLanguageSelection) {
      console.log('Starting initial welcome message');
      speak(questions[0].text);
      hasSpokenRef.current = true;
    }
  }, [currentStep, audioEnabled, isSpeaking, showLanguageSelection, language]);

  // Debug logging for step changes
  useEffect(() => {
    console.log('Step changed to:', currentStep, 'Question:', questions[currentStep]?.id);
  }, [currentStep]);
  
  const handleLanguageSelect = (selectedLanguage) => {
    setLanguage(selectedLanguage);
    setShowLanguageSelection(false);
    // Store language choice globally
    sessionStorage.setItem('selectedLanguage', selectedLanguage);
  };
  
  if (showLanguageSelection) {
    return <LanguageSelection onLanguageSelect={handleLanguageSelect} />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-row items-start space-x-8">
      <div className="flex-1 bg-white p-8 rounded-2xl shadow-xl">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-center">{getTranslation('registration', language)}</h2>
        </div>
        
        <div className="text-center mb-4">
          <p className="text-gray-600 mb-2">
            {currentQuestion.id === 'confirm'
              ? (language === 'zh' 
                  ? `您是${patientData.name}，${patientData.age}岁，身份证号${patientData.nric}。请说“是”确认。`
                  : `You are ${patientData.name}, ${patientData.age} years old, NRIC ${patientData.nric}. Please say yes to confirm.`)
              : currentQuestion.text}
          </p>
          {currentQuestion.icon && <currentQuestion.icon className="mx-auto text-blue-600" />}
        </div>

        {/* Status indicators are shown inline */}

        {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
        
        {isRecording ? (
          <p className="text-center text-blue-600">
            <Mic className="w-4 h-4 mr-1 inline text-blue-600 animate-pulse" /> 
            Listening...
          </p>
        ) : transcript ? (
          <p className="text-blue-700 text-center">{transcript}</p>
        ) : null}

        {/* NRIC Scanning Interface */}
        {currentQuestion.field === 'nric' && (
          <div className="text-center my-4">
            <p className="mb-2 text-gray-600">{getTranslation('holdCard', language)}</p>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/png"
              videoConstraints={videoConstraints}
              className="rounded-xl mx-auto"
            />
            <button
              onClick={handleScanNric}
              className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
            >
              {getTranslation('scanButton', language)}
            </button>
          </div>
        )}

        {/* Recording button - only show after bot has finished speaking */}
        {(currentQuestion.id === 'confirm' || currentQuestion.id === 'symptoms') && !isRecording && !isSpeaking && hasFinishedSpeaking && (
          <div className="text-center mt-4">
            <button 
              onClick={startRecording}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Mic className="w-4 h-4 mr-1 inline" /> Start Speaking
            </button>
          </div>
        )}

        {/* Symptoms display */}
        {currentQuestion.id === 'symptoms' && patientData.symptoms && (
          <div className="mt-4">
            <p className="text-gray-600 text-center">Recorded symptoms: {patientData.symptoms}</p>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button 
            onClick={() => setAudioEnabled(!audioEnabled)} 
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
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