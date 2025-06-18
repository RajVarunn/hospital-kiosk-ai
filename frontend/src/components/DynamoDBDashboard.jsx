import React, { useState, useEffect } from 'react';
import { Users, Activity, Clock, AlertCircle, CheckCircle, User, FileText, TrendingUp, RefreshCw, Heart } from 'lucide-react';
import dynamoService from '../services/dynamoService';

const DynamoDBDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [queue, setQueue] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [patientsResponse, visitsResponse, queueResponse] = await Promise.all([
        dynamoService.getPatients(),
        dynamoService.getVisits(),
        dynamoService.getQueue()
      ]);
      
      console.log('Patients response:', patientsResponse);
      console.log('Visits response:', visitsResponse);
      console.log('Queue response:', queueResponse);
      
      // Ensure we have arrays for each data type
      const patientsData = Array.isArray(patientsResponse) ? patientsResponse : [];
      const visitsData = Array.isArray(visitsResponse) ? visitsResponse : [];
      const queueData = Array.isArray(queueResponse) ? queueResponse : [];
      
      setPatients(patientsData);
      setVisits(visitsData);
      setQueue(queueData);
      
      // Create enriched queue with patient and visit data
      const enrichedQueue = (queueData || []).map(queueEntry => {
        const patient = (patientsData || []).find(p => p.patient_id === queueEntry.patient_id) || {};
        const patientVisits = (visitsData || []).filter(v => v.patient_id === queueEntry.patient_id) || [];
        const latestVisit = patientVisits.length > 0 ? patientVisits[0] : {};
        
        return {
          ...queueEntry,
          name: patient.name,
          age: patient.age,
          nric: patient.nric,
          dob: patient.dob,
          gender: patient.gender,
          user_input: latestVisit.user_input,
          symptoms: latestVisit.symptoms,
          systolic: latestVisit.systolic,
          diastolic: latestVisit.diastolic,
          heart_rate: latestVisit.heart_rate
        };
      });
      
      // Sort by order if available
      const sortedQueue = enrichedQueue.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Set first patient as selected if none selected
      if (!selectedPatient && sortedQueue.length > 0) {
        setSelectedPatient(sortedQueue[0]);
      }
      
      // Calculate stats
      const waiting = sortedQueue.filter(q => q.status === 'waiting');
      const ready = sortedQueue.filter(q => q.status === 'ready');
      const urgent = sortedQueue.filter(q => q.priority === 'urgent');
      
      setStats({
        totalPatients: patientsData?.length || 0,
        waitingPatients: waiting.length,
        readyPatients: ready.length,
        urgentCases: urgent.length,
        totalVisits: visitsData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading patient data from DynamoDB...</p>
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
              onClick={fetchData}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button 
              onClick={async () => {
                try {
                  const rawResponse = await dynamoService.getRawPatients();
                  console.log('Raw API response:', rawResponse);
                  alert(`Raw API response logged to console. Status: ${rawResponse.status}`);
                } catch (error) {
                  console.error('Error fetching raw data:', error);
                  alert(`Error: ${error.message}`);
                }
              }}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              <span>Debug API</span>
            </button>
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
              <h1 className="text-2xl font-bold text-gray-900">DynamoDB Dashboard</h1>
              <p className="text-gray-500">Patient data from DynamoDB</p>
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
            label="Total Visits" 
            value={stats.totalVisits}
            color="text-purple-600"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Patient List */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{patients.length} Total</span>
                </div>
              </div>
              
              {patients.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No patients found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {patients.map((patient) => (
                    <div
                      key={patient.patient_id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedPatient?.patient_id === patient.patient_id ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''}`}
                    >
                      <div className="mb-1">
                        <p className="font-medium text-gray-900">{patient.name || 'Unknown Patient'}</p>
                        <p className="text-sm text-gray-500">NRIC: {patient.nric || 'N/A'} • Age: {patient.age || 'N/A'}</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {visits.filter(v => v.patient_id === patient.patient_id).length} visits
                      </p>
                    </div>
                  ))}
                </div>
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
                      <p className="text-gray-500">NRIC: {selectedPatient.nric || 'N/A'} • Age: {selectedPatient.age || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Patient Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Patient ID</p>
                        <p className="font-medium">{selectedPatient.patient_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Gender</p>
                        <p className="font-medium">{selectedPatient.gender || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date of Birth</p>
                        <p className="font-medium">{selectedPatient.dob || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Preferred Language</p>
                        <p className="font-medium">{selectedPatient.preferred_language || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Visits */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Visit History
                    </h3>
                    
                    {visits.filter(v => v.patient_id === selectedPatient.patient_id).length === 0 ? (
                      <p className="text-gray-500">No visits recorded</p>
                    ) : (
                      <div className="space-y-4">
                        {visits
                          .filter(v => v.patient_id === selectedPatient.patient_id)
                          .map((visit) => (
                            <div key={visit.visit_id} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <p className="font-medium text-gray-900">Visit ID: {visit.visit_id}</p>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {new Date(visit.timestamp || Date.now()).toLocaleDateString()}
                                </span>
                              </div>
                              
                              {/* Vitals */}
                              {(visit.systolic || visit.diastolic || visit.heart_rate) && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Vitals:</p>
                                  <div className="grid grid-cols-3 gap-2">
                                    {(visit.systolic && visit.diastolic) && (
                                      <div className="bg-white p-2 rounded border border-gray-200">
                                        <p className="text-xs text-gray-500">Blood Pressure</p>
                                        <p className="font-medium">{visit.systolic}/{visit.diastolic} mmHg</p>
                                      </div>
                                    )}
                                    {visit.heart_rate && (
                                      <div className="bg-white p-2 rounded border border-gray-200">
                                        <p className="text-xs text-gray-500">Heart Rate</p>
                                        <p className="font-medium">{visit.heart_rate} bpm</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Symptoms */}
                              {visit.user_input && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">Reported Symptoms:</p>
                                  <p className="text-gray-900 bg-white p-2 rounded border border-gray-200">
                                    {visit.user_input}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Patient</h3>
                <p className="text-gray-500">Choose a patient from the list to view their details</p>
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

export default DynamoDBDashboard;