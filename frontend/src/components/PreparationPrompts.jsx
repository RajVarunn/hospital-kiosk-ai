import React, { useState, useEffect } from 'react';
import { Camera, FileText, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import AvatarViewer from './AvatarViewer';

import { getTranslation } from '../utils/translations';

const PreparationPrompts = () => {
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [speaking, setSpeaking] = useState(false);
  const [language, setLanguage] = useState(() => {
    return sessionStorage.getItem('selectedLanguage') || 'en';
  });

  const prompts = [
    {
      id: 'symptoms',
      title: 'Prepare Your Symptom Details',
      message: 'Please think about when your symptoms started, how they feel, and what makes them better or worse. This will help the doctor understand your condition better.',
      action: 'Think about your symptoms timeline',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'medications',
      title: 'Gather Your Medications',
      message: 'If you have any medications, supplements, or medical devices with you, please have them ready to show the doctor. Include prescription bottles and any recent test results.',
      action: 'Collect medications and documents',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'photos',
      title: 'Take Photos if Needed',
      message: 'If you have any visible symptoms like rashes, swelling, or injuries, consider taking clear photos with your phone. This can help the doctor assess your condition.',
      action: 'Take photos of visible symptoms',
      icon: <Camera className="w-6 h-6" />
    },
    {
      id: 'questions',
      title: 'Prepare Your Questions',
      message: 'Think of any questions you want to ask the doctor. Write them down if needed so you don\'t forget during your consultation.',
      action: 'List your questions',
      icon: <FileText className="w-6 h-6" />
    }
  ];

  const speakMessage = async (message) => {
    setSpeaking(true);
    try {
      const response = await fetch('/api/openai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: message,
          language: language === 'zh' ? 'zh-CN' : 'en-US'
        })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audio = new Audio(URL.createObjectURL(audioBlob));
        audio.play();
        audio.onended = () => setSpeaking(false);
      }
    } catch (error) {
      console.error('TTS error:', error);
      setSpeaking(false);
    }
  };

  useEffect(() => {
    // Auto-speak the current prompt message
    if (prompts[currentPrompt]) {
      speakMessage(prompts[currentPrompt].message);
    }
  }, [currentPrompt]);

  const markCompleted = (taskId) => {
    setCompletedTasks(prev => new Set([...prev, taskId]));
  };

  const nextPrompt = () => {
    if (currentPrompt < prompts.length - 1) {
      setCurrentPrompt(currentPrompt + 1);
    }
  };

  const previousPrompt = () => {
    if (currentPrompt > 0) {
      setCurrentPrompt(currentPrompt - 1);
    }
  };

  const goToNavigation = () => {
    window.location.href = '/navigation';
  };

  const currentTask = prompts[currentPrompt];
  const allCompleted = completedTasks.size === prompts.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{getTranslation('prepareTitle', language)}</h1>
          <p className="text-gray-600">{getTranslation('prepareSubtitle', language)}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Avatar Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="h-96 mb-4">
              <AvatarViewer 
                url="https://models.readyplayer.me/68333920db2234a7fa761405.glb" 
                mouthOpen={speaking ? 0.8 : 0}
              />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${speaking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-600">
                  {speaking ? 'Speaking...' : 'Ready to help'}
                </span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-6">
            {/* Current Prompt */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  {currentTask.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {currentTask.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {currentTask.message}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => markCompleted(currentTask.id)}
                    disabled={completedTasks.has(currentTask.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                      completedTasks.has(currentTask.id)
                        ? 'bg-green-100 text-green-800 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {completedTasks.has(currentTask.id) ? getTranslation('completed', language) : getTranslation('markComplete', language)}
                    </span>
                  </button>
                  
                  {currentPrompt > 0 && (
                    <button
                      onClick={previousPrompt}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      <span>{getTranslation('back', language)}</span>
                    </button>
                  )}
                </div>

                {currentPrompt < prompts.length - 1 && (
                  <button
                    onClick={nextPrompt}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <span>{getTranslation('next', language)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preparation Progress</h3>
              <div className="space-y-3">
                {prompts.map((prompt, index) => (
                  <div key={prompt.id} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      completedTasks.has(prompt.id)
                        ? 'bg-green-500 text-white'
                        : index === currentPrompt
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {completedTasks.has(prompt.id) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className={`${
                      completedTasks.has(prompt.id) ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {prompt.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue Button */}
            {allCompleted && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Great! You're all prepared
                </h3>
                <p className="text-green-700 mb-4">
                  You've completed all preparation tasks. You can now proceed to the waiting area.
                </p>
                <button
                  onClick={goToNavigation}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
                >
                  {getTranslation('continueWaiting', language)}
                </button>
              </div>
            )}

            {/* Skip Option */}
            <div className="text-center">
              <button
                onClick={goToNavigation}
                className="text-gray-500 hover:text-gray-700 underline"
              >
                {getTranslation('skip', language)}
              </button>
            </div>
          </div>
        </div>

        {/* Wait Time Indicator */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-center space-x-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <div className="text-center">
              <p className="text-gray-600">{getTranslation('waitTime', language)}</p>
              <p className="text-2xl font-bold text-blue-600">15-20 {getTranslation('minutes', language)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreparationPrompts;