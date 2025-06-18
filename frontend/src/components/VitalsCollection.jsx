import React, { useState } from 'react';
import { Activity, Heart } from 'lucide-react';
import dynamoService from '../services/dynamoService';

const VitalsCollection = ({ patient, onComplete }) => {
  const [vitals, setVitals] = useState({
    systolic: '',
    diastolic: '',
    heartRate: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors = {};
    const { systolic, diastolic, heartRate } = vitals;

    if (!systolic || systolic < 70 || systolic > 250) {
      newErrors.systolic = 'Systolic (70–250 mmHg) required';
    }

    if (!diastolic || diastolic < 40 || diastolic > 150) {
      newErrors.diastolic = 'Diastolic (40–150 mmHg) required';
    }

    if (parseInt(systolic) <= parseInt(diastolic)) {
      newErrors.systolic = 'Systolic must be > Diastolic';
    }

    if (!heartRate || heartRate < 40 || heartRate > 200) {
      newErrors.heartRate = 'Heart rate (40–200 bpm) required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setVitals(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { systolic, diastolic, heartRate } = vitals;

    try {
      // Save vitals data first
      if (onComplete) {
        // Pass the vitals object directly with symptoms from patient
        const vitalsWithSymptoms = {
          ...vitals,
          user_input: patient.user_input || patient.symptoms || "No symptoms reported"
        };
        console.log('Submitting vitals with symptoms:', vitalsWithSymptoms);
        
        // Save to DynamoDB
        await onComplete(vitalsWithSymptoms);
        
        // Store vitals and symptoms in sessionStorage for BedrockTest page
        sessionStorage.setItem('patientVitals', JSON.stringify({
          systolic: parseInt(systolic),
          diastolic: parseInt(diastolic),
          heart_rate: parseInt(heartRate),
          user_input: patient.user_input || patient.symptoms || "No symptoms reported"
        }));
        
        // Redirect to BedrockTest page
        console.log('Redirecting to BedrockTest page with vitals:', {
          systolic: parseInt(systolic),
          diastolic: parseInt(diastolic),
          heart_rate: parseInt(heartRate),
          user_input: patient.user_input || patient.symptoms || "No symptoms reported"
        });
        window.location.href = '/bedrock-test';
      }
      
      setSuccess(true);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save vitals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center">Vitals for {patient?.name || 'Patient'}</h2>
      
      {/* Display symptoms if available */}
      {(patient?.symptoms || patient?.user_input) && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-blue-800">Reported Symptoms:</h3>
          <p className="text-blue-700">{patient?.symptoms || patient?.user_input}</p>
        </div>
      )}

      {/* Blood Pressure */}
      <div>
        <label className="block font-medium mb-1">Blood Pressure (mmHg)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Systolic"
            value={vitals.systolic}
            onChange={(e) => handleChange('systolic', e.target.value)}
            className="input input-bordered w-1/2"
          />
          <input
            type="number"
            placeholder="Diastolic"
            value={vitals.diastolic}
            onChange={(e) => handleChange('diastolic', e.target.value)}
            className="input input-bordered w-1/2"
          />
        </div>
        {errors.systolic && <p className="text-red-500 text-sm">{errors.systolic}</p>}
        {errors.diastolic && <p className="text-red-500 text-sm">{errors.diastolic}</p>}
      </div>

      {/* Heart Rate */}
      <div>
        <label className="block font-medium mb-1">Heart Rate (BPM)</label>
        <input
          type="number"
          value={vitals.heartRate}
          onChange={(e) => handleChange('heartRate', e.target.value)}
          className="input input-bordered w-full"
          placeholder="e.g., 72"
        />
        {errors.heartRate && <p className="text-red-500 text-sm">{errors.heartRate}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full"
      >
        {loading ? 'Saving...' : 'Submit Vitals'}
      </button>

      {success && (
        <p className="text-green-600 text-center mt-2">Vitals saved successfully!</p>
      )}
    </form>
  );
};

export default VitalsCollection;