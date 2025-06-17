import React, { useState, useEffect } from 'react';
import { Clock, Users, Heart, FileText, User, ChevronRight, Wifi, WifiOff } from 'lucide-react';

const HospitalPatientApp = () => {
  const [patientData, setPatientData] = useState({
    name: "Sarah Johnson",
    age: 34,
    gender: "Female",
    patientId: "PT-2024-5847",
    medicalHistory: ["Hypertension", "Type 2 Diabetes"],
    lastVisit: "2024-05-15"
  });

  const [queueData, setQueueData] = useState({
    position: 7,
    estimatedWaitTime: 25,
    totalInQueue: 12,
    currentlyServing: "PT-2024-5840"
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(true);
const [preConsultData, setPreConsultData] = useState({
  painLevel: 5,
  duration: '',
  medications: '',
  allergies: '',
  concerns: '',
  familyHistory: '',
  lifestyle: {
    smoking: false,
    alcohol: false,
    exercise: false
  },
  travelExposure: '',
  mentalState: []
});

  // Simulate real-time queue updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setQueueData(prev => ({
          ...prev,
          position: Math.max(1, prev.position - 1),
          estimatedWaitTime: Math.max(5, prev.estimatedWaitTime - 3)
        }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getHealthTips = () => {
    // Simulate contextual health tips based on patient data
    const tips = [
      {
        title: "Blood Pressure Management",
        content: "Based on your hypertension history, try deep breathing exercises while waiting.",
        relevant: patientData.medicalHistory.includes("Hypertension")
      },
      {
        title: "Blood Sugar Monitoring",
        content: "Keep track of when you last ate to help your doctor assess your diabetes management.",
        relevant: patientData.medicalHistory.includes("Type 2 Diabetes")
      },
      {
        title: "Stay Hydrated",
        content: "Drink water regularly, especially if you've been fasting for tests.",
        relevant: true
      }
    ].filter(tip => tip.relevant);

    return tips;
  };

  const handlePreConsultSubmit = () => {
    // In real app, this would send data to backend
    console.log('Pre-consultation data submitted:', preConsultData);
    alert('Pre-consultation information submitted successfully!');
    setCurrentView('dashboard');
  };

  const StatusIndicator = ({ connected }) => (
    <div className={`flex items-center text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
      {connected ? <Wifi className="w-4 h-4 mr-1" /> : <WifiOff className="w-4 h-4 mr-1" />}
      {connected ? 'Connected' : 'Offline'}
    </div>
  );

  const Dashboard = () => (
    <div className="space-y-6">
      {/* Patient Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{patientData.name}</h2>
            <p className="text-gray-600">{patientData.age} years • {patientData.gender}</p>
            <p className="text-sm text-gray-500">ID: {patientData.patientId}</p>
          </div>
        </div>
      </div>

      {/* Queue Status Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Queue Status</h3>
          <Users className="w-6 h-6" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{queueData.position}</div>
            <div className="text-blue-100 text-sm">People ahead</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{queueData.estimatedWaitTime}</div>
            <div className="text-blue-100 text-sm">Minutes wait</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-blue-400">
          <div className="flex items-center text-sm text-blue-100">
            <Clock className="w-4 h-4 mr-2" />
            Currently serving: {queueData.currentlyServing}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => setCurrentView('healthTips')}
          className="w-full bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl p-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center">
            <Heart className="w-6 h-6 text-green-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Health Tips</div>
              <div className="text-sm text-gray-600">Personalized recommendations</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={() => setCurrentView('preConsult')}
          className="w-full bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl p-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-purple-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Pre-Consultation Form</div>
              <div className="text-sm text-gray-600">Help your doctor prepare</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );

  const HealthTips = () => {
    const tips = getHealthTips();
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back
          </button>
          <h2 className="text-xl font-semibold">Health Tips</h2>
          <div></div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            These tips are personalized based on your medical history and current visit.
          </p>
        </div>

        <div className="space-y-4">
          {tips.map((tip, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
              <p className="text-gray-700 leading-relaxed">{tip.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

const PreConsultForm = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <button
        onClick={() => setCurrentView('dashboard')}
        className="text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Back
      </button>
      <h2 className="text-xl font-semibold">Pre-Consultation</h2>
      <div></div>
    </div>

    <div className="bg-green-50 rounded-lg p-4 mb-6">
      <p className="text-sm text-green-800">
        Please provide additional information to help your doctor prepare for your visit.
      </p>
    </div>

    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pain Level (1–10)
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="1"
            max="10"
            value={preConsultData.painLevel}
            onChange={(e) => setPreConsultData({ ...preConsultData, painLevel: e.target.value })}
            className="flex-1"
          />
          <span className="font-semibold text-lg w-8">{preConsultData.painLevel}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How long have you had these symptoms?
        </label>
        <input
          type="text"
          value={preConsultData.duration}
          onChange={(e) => setPreConsultData({ ...preConsultData, duration: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., 3 days, 1 week..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current medications or treatments
        </label>
        <textarea
          value={preConsultData.medications}
          onChange={(e) => setPreConsultData({ ...preConsultData, medications: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="2"
          placeholder="List any medications, dosages, or treatments..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Allergies (e.g., medication, food, latex)
        </label>
        <input
          type="text"
          value={preConsultData.allergies}
          onChange={(e) => setPreConsultData({ ...preConsultData, allergies: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Penicillin, shellfish..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Family medical history (if any)
        </label>
        <input
          type="text"
          value={preConsultData.familyHistory}
          onChange={(e) => setPreConsultData({ ...preConsultData, familyHistory: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Heart disease, diabetes"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Lifestyle habits</label>
        <div className="space-y-2">
          {['smoking', 'alcohol', 'exercise'].map((key) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={preConsultData.lifestyle[key]}
                onChange={(e) =>
                  setPreConsultData({
                    ...preConsultData,
                    lifestyle: {
                      ...preConsultData.lifestyle,
                      [key]: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm text-gray-700 capitalize">{key}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recent travel or illness exposure
        </label>
        <input
          type="text"
          value={preConsultData.travelExposure}
          onChange={(e) => setPreConsultData({ ...preConsultData, travelExposure: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Travelled overseas last week"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recent emotional or mental health concerns
        </label>
        <div className="space-y-2">
          {['Stress', 'Poor sleep', 'Low mood', 'None'].map((item) => (
            <label key={item} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={preConsultData.mentalState.includes(item)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const updated = checked
                    ? [...preConsultData.mentalState, item]
                    : preConsultData.mentalState.filter((i) => i !== item);
                  setPreConsultData({ ...preConsultData, mentalState: updated });
                }}
              />
              <span className="text-sm text-gray-700">{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Any specific concerns or questions?
        </label>
        <textarea
          value={preConsultData.concerns}
          onChange={(e) => setPreConsultData({ ...preConsultData, concerns: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          placeholder="What would you like to discuss with your doctor?"
        />
      </div>

      <button
        onClick={handlePreConsultSubmit}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        Submit Information
      </button>
    </div>
  </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Patient Portal</h1>
            <p className="text-sm text-gray-600">General Hospital</p>
          </div>
          <StatusIndicator connected={isConnected} />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-md mx-auto">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'healthTips' && <HealthTips />}
        {currentView === 'preConsult' && <PreConsultForm />}
      </div>
    </div>
  );
};

export default HospitalPatientApp;