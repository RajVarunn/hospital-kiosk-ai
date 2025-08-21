import React, { useState, useEffect } from 'react';
import { Users, Activity, Clock, AlertCircle, CheckCircle, User, FileText, TrendingUp, RefreshCw, Phone, Heart, Thermometer, Calendar, MapPin, Pill } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import supabaseService, { supabase } from '../services/supabaseService';
import preDiagnosisService from '../services/preDiagnosisService';

const StaffDashboard = () => {
  const [queueEntries, setQueueEntries] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [patientVisits, setPatientVisits] = useState([]);
  const [generatingDiagnosis, setGeneratingDiagnosis] = useState(new Set());

  // Fetch patient data from Supabase
  const fetchPatientData = async () => {
    try {
      const patientsWithVitals = await supabaseService.getAllPatientsWithVitals();
      console.log('Patients with vitals from Supabase:', patientsWithVitals);
      setPatientVisits(patientsWithVitals);
      return patientsWithVitals;
    } catch (error) {
      console.error('Error fetching patient data from Supabase:', error);
      return [];
    }
  };

  const fetchQueueData = async () => {
    setLoading(true);
    try {
      // Fetch all patient data from Supabase
      const patientsWithVitals = await fetchPatientData() || [];
      
      // Get queue order from Supabase
      const { data: queueOrder } = await supabase
        .from('queue')
        .select('patient_id, order_position, priority, status, estimated_wait')
        .order('order_position', { ascending: true });

      // Transform Supabase data to match dashboard format
      let enrichedQueue = patientsWithVitals.map((patient, index) => {
        // Get the latest vitals for this patient
        const latestVitals = patient.vitals && patient.vitals.length > 0 
          ? patient.vitals[0] // vitals are ordered by created_at desc
          : {};
        
        // Find queue info for this patient
        const queueInfo = queueOrder?.find(q => q.patient_id === patient.id || q.patient_id === patient.nric);
        
        return {
          id: patient.id || patient.nric,
          patientId: patient.id,
          name: patient.name || 'Unknown',
          age: patient.age || '',
          department: 'General',
          appointment_time: new Date(patient.created_at).toLocaleTimeString(),
          nric: patient.nric || '',
          phone: '',
          medical_history: [],
          current_medications: [],
          chief_complaint: patient.symptoms || 'No complaint recorded',
          ai_summary: '',
          ai_pre_diagnosis: patient.ai_pre_diagnosis || null,
          symptoms: patient.symptoms ? [patient.symptoms] : [],
          status: queueInfo?.status || 'waiting',
          priority: queueInfo?.priority || 'normal',
          estimatedWait: queueInfo?.estimated_wait || (index + 1) * 15,
          queuePosition: queueInfo?.order_position || 999, // High number for unqueued patients
          vitals: {
            heart_rate: latestVitals.heart_rate,
            temperature: latestVitals.temperature,
            bp_systolic: latestVitals.blood_pressure ? latestVitals.blood_pressure.split('/')[0] : null,
            bp_diastolic: latestVitals.blood_pressure ? latestVitals.blood_pressure.split('/')[1] : null,
            oxygen_saturation: latestVitals.oxygen_level
          },
          visit_data: patient
        };
      }).filter(entry => entry && entry.id);
      
      // Sort by queue position if queue data exists
      if (queueOrder && queueOrder.length > 0) {
        enrichedQueue.sort((a, b) => a.queuePosition - b.queuePosition);
      }

      setQueueEntries(enrichedQueue);

      // Set first patient as selected if none selected
      if (!selectedPatient && enrichedQueue.length > 0) {
        const firstPatient = enrichedQueue[0];
        setSelectedPatient(firstPatient);
        
        // Auto-generate pre-diagnosis for selected patient only
        if (firstPatient && firstPatient.patientId && !firstPatient.ai_pre_diagnosis) {
          console.log('Auto-generating pre-diagnosis for selected patient:', firstPatient.patientId);
          requestPreDiagnosis(firstPatient.patientId);
        }
      }

      const waiting = enrichedQueue.filter(q => q.status === 'waiting');
      const ready = enrichedQueue.filter(q => q.status === 'ready');
      const urgent = enrichedQueue.filter(q => q.priority === 'urgent');
      const totalWait = enrichedQueue.reduce((acc, p) => acc + (p.estimatedWait || 0), 0);
      const avgWait = enrichedQueue.length ? Math.round(totalWait / enrichedQueue.length) : 0;

      setStats({
        totalPatients: enrichedQueue.length,
        waitingPatients: waiting.length,
        readyPatients: ready.length,
        urgentCases: urgent.length,
        averageWaitTime: avgWait,
      });
    } catch (error) {
      console.error('Error fetching queue data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, []);

  // Request pre-diagnosis for a patient
  const requestPreDiagnosis = async (patientId) => {
    if (!patientId || generatingDiagnosis.has(patientId)) return;
    
    setGeneratingDiagnosis(prev => new Set([...prev, patientId]));
    
    try {
      // Find the patient in our queue
      const patient = queueEntries.find(entry => entry.patientId === patientId);
      if (!patient) {
        console.error('Patient not found:', patientId);
        return;
      }
      
      console.log('Generating pre-diagnosis for patient:', patient.name);
      
      // Prepare patient data for AI analysis
      const patientData = {
        name: patient.name,
        age: patient.age,
        symptoms: patient.chief_complaint,
        vitals: patient.vitals
      };
      
      // Generate pre-diagnosis using AI
      const result = await preDiagnosisService.generatePreDiagnosis(patientData);
      
      if (result.success) {
        // Save pre-diagnosis to Supabase
        await supabaseService.savePreDiagnosis(patientId, result.data);
        
        // Update the patient's pre-diagnosis in the queue
        setQueueEntries(prevQueue => 
          prevQueue.map(entry => 
            entry.patientId === patientId 
              ? { ...entry, ai_pre_diagnosis: result.data }
              : entry
          )
        );
        
        // Update selected patient if it's the same one
        setSelectedPatient(prevSelected => 
          prevSelected?.patientId === patientId 
            ? { ...prevSelected, ai_pre_diagnosis: result.data }
            : prevSelected
        );
        
        console.log('Pre-diagnosis generated and saved successfully:', result.data);
      }
    } catch (error) {
      console.error('Error generating pre-diagnosis:', error);
    } finally {
      setGeneratingDiagnosis(prev => {
        const newSet = new Set(prev);
        newSet.delete(patientId);
        return newSet;
      });
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const reordered = Array.from(queueEntries);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    // Update UI optimistically
    setQueueEntries(reordered);
    
    // Update database with new order
    try {
      await supabaseService.updateQueueOrder(reordered.map(item => ({ id: item.id })));
      console.log('Queue order updated in database');
    } catch (error) {
      console.error('Failed to update queue order:', error);
    }
  };

  const markAsReady = async (queueId) => {
    // Update status locally
    const updated = queueEntries.map(entry => 
      entry.id === queueId ? { ...entry, status: 'ready' } : entry
    );
    setQueueEntries(updated);
    
    // Update selected patient if it's the same one
    if (selectedPatient?.id === queueId) {
      setSelectedPatient({ ...selectedPatient, status: 'ready' });
    }
    
    console.log('Patient marked as ready (UI only)');
  };

  const callPatient = async (queueId) => {
    // Update status locally
    const updated = queueEntries.map(entry => 
      entry.id === queueId ? { ...entry, status: 'serving' } : entry
    );
    setQueueEntries(updated);
    
    console.log('Patient called (UI only)');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'serving': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQueueItemBorder = (priority, selected) => {
    if (selected) return 'border-2 border-blue-400';
    switch (priority) {
      case 'urgent': return 'border-l-4 border-l-red-400';
      case 'high': return 'border-l-4 border-l-orange-400';
      default: return 'border-l-4 border-l-blue-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              onClick={fetchQueueData}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {stats.urgentCases || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
              <p className="text-gray-500">Patient management and monitoring</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <StatCard 
            icon={<Users className="w-5 h-5" />} 
            label="Total Patients" 
            value={stats.totalPatients}
            color="text-blue-600"
          />
          <StatCard 
            icon={<Clock className="w-5 h-5" />} 
            label="Waiting" 
            value={stats.waitingPatients}
            color="text-orange-600"
          />
          <StatCard 
            icon={<CheckCircle className="w-5 h-5" />} 
            label="Ready" 
            value={stats.readyPatients}
            color="text-green-600"
          />
          <StatCard 
            icon={<AlertCircle className="w-5 h-5" />} 
            label="Urgent" 
            value={stats.urgentCases}
            color="text-red-600"
          />
          <StatCard 
            icon={<TrendingUp className="w-5 h-5" />} 
            label="Avg Wait" 
            value={`${stats.averageWaitTime}m`}
            color="text-purple-600"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Patient Queue */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Patient Queue</h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">All Patients</span>
                </div>
              </div>
              
              {queueEntries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No patients in queue</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="queue">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="divide-y divide-gray-100">
                        {queueEntries.map((entry, index) => (
                          <Draggable key={entry.id} draggableId={entry.id.toString()} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => {
                                  setSelectedPatient(entry);
                                  // Auto-generate pre-diagnosis if not already available
                                  if (entry && entry.patientId && !entry.ai_pre_diagnosis) {
                                    console.log('Auto-generating pre-diagnosis for selected patient:', entry.patientId);
                                    requestPreDiagnosis(entry.patientId);
                                  }
                                }}
                                className={`p-4 cursor-pointer hover:bg-gray-50 ${getQueueItemBorder(entry.priority, selectedPatient?.id === entry.id)} ${selectedPatient?.id === entry.id ? 'bg-blue-50' : ''}`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">Q{String(index + 1).padStart(3, '0')}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(entry.priority)}`}>
                                      {entry.priority?.toUpperCase() || 'NORMAL'}
                                    </span>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(entry.status)}`}>
                                    {entry.status || 'waiting'}
                                  </span>
                                </div>
                                <div className="mb-1">
                                  <p className="font-medium text-gray-900">{entry.name || 'Unknown Patient'}</p>
                                  <p className="text-sm text-gray-500">{entry.department || 'General'} • {entry.appointment_time || 'No time set'}</p>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{entry.chief_complaint || entry.complaint || 'No complaint recorded'}</p>
                                <p className="text-sm text-orange-600">{entry.estimatedWait || 0}m wait</p>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>

          {/* Patient Details */}
          <div className="col-span-2">
            {selectedPatient ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.name || 'Unknown Patient'}</h2>
                      <p className="text-gray-500">Q{String(queueEntries.findIndex(q => q.id === selectedPatient.id) + 1).padStart(3, '0')} • Age {selectedPatient.age || 'N/A'}</p>
                    </div>
                    <div className="flex space-x-3">
                      {selectedPatient.status === 'waiting' && (
                        <button
                          onClick={() => markAsReady(selectedPatient.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                        >
                          Mark Ready
                        </button>
                      )}
                      <button
                        onClick={() => callPatient(selectedPatient.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Call Patient
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">NRIC</p>
                        <p className="font-medium">{selectedPatient.nric || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="font-medium">{selectedPatient.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Department</p>
                        <p className="font-medium">{selectedPatient.department || 'General'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Appointment</p>
                        <p className="font-medium">{selectedPatient.appointment_time || 'Walk-in'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vital Signs */}
                  {selectedPatient.vitals && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Activity className="w-5 h-5 mr-2" />
                        Vital Signs
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-orange-600 font-medium">Heart Rate</p>
                            <p className="text-lg font-bold text-gray-900">{selectedPatient.vitals.heart_rate || 'N/A'} bpm</p>
                          </div>
                          <div>
                            <p className="text-sm text-orange-600 font-medium">Temperature</p>
                            <p className="text-lg font-bold text-gray-900">{selectedPatient.vitals.temperature || 'N/A'}°C</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Blood Pressure</p>
                            <p className="text-lg font-bold text-gray-900">
                              {selectedPatient.vitals.bp_systolic && selectedPatient.vitals.bp_diastolic 
                                ? `${selectedPatient.vitals.bp_systolic}/${selectedPatient.vitals.bp_diastolic}`
                                : 'N/A'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-green-600 font-medium">O₂ Saturation</p>
                            <p className="text-lg font-bold text-gray-900">{selectedPatient.vitals.oxygen_saturation || 'N/A'}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Medical History & Medications */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Medical History & Medications
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Medical History</p>
                        <div className="space-y-1">
                          {selectedPatient.medical_history && selectedPatient.medical_history.length > 0 
                            ? selectedPatient.medical_history.map((condition, index) => (
                                <span key={index} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-2 mb-1">
                                  {condition}
                                </span>
                              ))
                            : <span className="text-gray-500 text-sm">No medical history recorded</span>
                          }
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Current Medications</p>
                        <div className="space-y-1">
                          {selectedPatient.current_medications && selectedPatient.current_medications.length > 0
                            ? selectedPatient.current_medications.map((medication, index) => (
                                <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-1">
                                  {medication}
                                </span>
                              ))
                            : <span className="text-gray-500 text-sm">No current medications</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chief Complaint & AI Pre-Diagnosis */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Chief Complaint & AI Pre-Diagnosis</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Chief Complaint:</p>
                      <p className="text-yellow-900">{selectedPatient.chief_complaint || selectedPatient.complaint || 'No complaint recorded'}</p>
                    </div>
                    
                    {selectedPatient.ai_pre_diagnosis ? (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-blue-800 mb-1">AI Pre-Diagnosis Summary:</p>
                          <p className="text-blue-900">{selectedPatient.ai_pre_diagnosis.summary}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-purple-800 mb-2">Possible Conditions:</p>
                            <ul className="list-disc pl-5 text-purple-900 text-sm space-y-1">
                              {selectedPatient.ai_pre_diagnosis.possibleConditions?.map((condition, index) => (
                                <li key={index}>{condition}</li>
                              )) || <li>No conditions identified</li>}
                            </ul>
                          </div>
                          
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-green-800 mb-2">Recommended Tests:</p>
                            <ul className="list-disc pl-5 text-green-900 text-sm space-y-1">
                              {selectedPatient.ai_pre_diagnosis.recommendedTests?.map((test, index) => (
                                <li key={index}>{test}</li>
                              )) || <li>No tests recommended</li>}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-indigo-800 mb-2">Follow-up Questions:</p>
                            <ul className="list-disc pl-5 text-indigo-900 text-sm space-y-1">
                              {selectedPatient.ai_pre_diagnosis.followUpQuestions?.map((question, index) => (
                                <li key={index}>{question}</li>
                              )) || <li>No follow-up questions suggested</li>}
                            </ul>
                          </div>
                          
                          {selectedPatient.ai_pre_diagnosis.redFlags && selectedPatient.ai_pre_diagnosis.redFlags.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="text-sm font-medium text-red-800 mb-2">Red Flags:</p>
                              <ul className="list-disc pl-5 text-red-900 text-sm space-y-1">
                                {selectedPatient.ai_pre_diagnosis.redFlags.map((flag, index) => (
                                  <li key={index}>{flag}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : generatingDiagnosis.has(selectedPatient?.patientId) ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <p className="text-gray-500">Generating AI pre-diagnosis...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <p className="text-gray-500">No AI pre-diagnosis available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Patient</h3>
                <p className="text-gray-500">Choose a patient from the queue to view their details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-lg bg-gray-50 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value || 0}</p>
      </div>
    </div>
  </div>
);

export default StaffDashboard;