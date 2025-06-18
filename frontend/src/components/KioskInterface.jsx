import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { patientAPI } from '../services/api';
import PatientForm from './PatientForm';
import VitalsCollection from './VitalsCollection';
import QRCode from 'react-qr-code';
import { User, Stethoscope, QrCode, CheckCircle } from 'lucide-react';

const KioskInterface = () => {
  const [currentStep, setCurrentStep] = useState('welcome');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = {
    welcome: 'Welcome',
    register: 'Registration',
    vitals: 'Vitals Collection',
    complete: 'Complete'
  };

  const handlePatientRegistration = async (patientData) => {
    setLoading(true);
    setError('');

    try {
      const response = await patientAPI.register(patientData);
      const patientWithMobileUrl = {
        ...response.data.patient,
        mobileUrl: `${window.location.origin}/mobile/${response.data.patient.id}`
      };
      setPatient(patientWithMobileUrl);
      setCurrentStep('vitals');
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVitalsComplete = async (vitalsData) => {
    if (!patient) return;

    setLoading(true);
    try {
      await patientAPI.updateVitals(patient.id, vitalsData);

      // Calculate next queue order
      const { data: maxOrderRow, error: orderErr } = await supabase
        .from('queue')
        .select('order')
        .order('order', { ascending: false })
        .limit(1);

      const nextOrder = (maxOrderRow?.[0]?.order || 0) + 1;

      // Automatically insert into queue after vitals are complete
      await patientAPI.addToQueue({
        patient_id: patient.id,
        name: patient.name,
        status: 'waiting',
        priority: 'normal',
        estimatedWait: 15
      });
      setCurrentStep('complete');
    } catch (err) {
      setError('Failed to save vitals. Please try again.');
      console.error('Vitals error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetKiosk = () => {
    setCurrentStep('welcome');
    setPatient(null);
    setError('');
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {Object.entries(steps).map(([key, label], index) => (
          <div key={key} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
              ${currentStep === key
                ? 'bg-medical-blue text-white'
                : Object.keys(steps).indexOf(currentStep) > index
                ? 'bg-medical-green text-white'
                : 'bg-gray-200 text-gray-500'}
            `}>
              {Object.keys(steps).indexOf(currentStep) > index ? '✓' : index + 1}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
            {index < Object.keys(steps).length - 1 && (
              <div className="w-8 h-0.5 bg-gray-300 ml-4"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {process.env.NODE_ENV !== 'production' && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={async () => {
              try {
                const res = await patientAPI.register({
                  nric: 'S1234567A',
                  name: 'John Dev',
                  age: '30',
                  phone: '91234567'
                });
                const devPatient = {
                  ...res.data.patient,
                  mobileUrl: `${window.location.origin}/mobile/${res.data.patient.id}`
                };
                setPatient(devPatient);
                setCurrentStep('vitals');
              } catch (err) {
                console.error('Dev skip failed:', err);
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg shadow"
          >
            🚀 Skip to Vitals
          </button>
        </div>
      )}

      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-medical-blue mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Hospital AI Kiosk</h1>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep !== 'welcome' && renderStepIndicator()}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          {currentStep === 'welcome' && <WelcomeScreen onStart={() => setCurrentStep('register')} />}
          {currentStep === 'register' && (
            <PatientForm onSubmit={handlePatientRegistration} loading={loading} />
          )}
          {currentStep === 'vitals' && patient && (
            <VitalsCollection patient={patient} onComplete={handleVitalsComplete} loading={loading} />
          )}
          {currentStep === 'complete' && patient && (
            <CompletionScreen patient={patient} onReset={resetKiosk} />
          )}
        </div>
      </div>
    </div>
  );
};

const WelcomeScreen = ({ onStart }) => (
  <div className="text-center py-12">
    <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-medical-blue bg-opacity-10 mb-6">
      <User className="h-12 w-12 text-medical-blue" />
    </div>
    <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to AI Hospital Kiosk</h2>
    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
      Our AI-powered system will help you check in, collect your medical information, and prepare for your consultation. The process takes about 5-10 minutes.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="p-4 border rounded-lg">
        <User className="h-8 w-8 text-medical-blue mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">Easy Registration</h3>
        <p className="text-sm text-gray-600">Quick check-in with your NRIC</p>
      </div>
      <div className="p-4 border rounded-lg">
        <QrCode className="h-8 w-8 text-medical-blue mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">Mobile Access</h3>
        <p className="text-sm text-gray-600">Continue on your phone</p>
      </div>
    </div>
    <button
      onClick={onStart}
      className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-medical-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
    >
      Start Check-In
    </button>
  </div>
);

const CompletionScreen = ({ patient, onReset }) => (
  <div className="text-center py-12">
    <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
      <CheckCircle className="h-12 w-12 text-green-600" />
    </div>
    <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Complete!</h2>
    <p className="text-lg text-gray-600 mb-8">Thank you, {patient.name}. Your registration is complete.</p>
    <div className="bg-gray-50 rounded-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Queue Information</h3>
          <div className="text-left space-y-2">
            <p><span className="font-medium">Queue Number:</span> {patient.queueNumber}</p>
            <p><span className="font-medium">Estimated Wait:</span> {patient.queueNumber * 15} minutes</p>
            <p><span className="font-medium">Status:</span> Waiting</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mobile Access</h3>
          <div className="bg-white p-4 rounded border">
            <QRCode size={120} style={{ height: 'auto', maxWidth: '100%', width: '100%' }} value={patient.mobileUrl} viewBox="0 0 256 256" />
          </div>
          <p className="text-sm text-gray-600 mt-2">Scan to access on your phone</p>
        </div>
      </div>
    </div>
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
        <ul className="text-sm text-blue-800 text-left space-y-1">
          <li>• Please take a seat in the waiting area</li>
          <li>• Use your phone to track queue status and get navigation help</li>
          <li>• You'll be called when it's your turn</li>
          <li>• Show this screen or your mobile app to the nurse</li>
        </ul>
      </div>
      <button
        onClick={onReset}
        className="inline-flex items-center px-6 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        Register Another Patient
      </button>
    </div>
  </div>
);

export default KioskInterface;
