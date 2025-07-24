import React, { useState, useEffect } from 'react';
import { Clock, Users, AlertCircle, CheckCircle, User, Calendar, Activity, GripVertical } from 'lucide-react';
import supabaseService, { supabase } from '../services/supabaseService';

const QueueDisplay = () => {
  const [currentQueue, setCurrentQueue] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentlyServing, setCurrentlyServing] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchQueueAndAnnouncements = async () => {
      const { data: queue, error: queueError } = await supabase
        .from('queue')
        .select('*, patients(name, department)')
        .order('order_position', { ascending: true })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      const { data: notices, error: noticeError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { descending: true });

      if (queueError || noticeError) {
        console.error('Error fetching from DB:', queueError || noticeError);
        return;
      }

      const validQueue = queue.map(q => ({
        ...q,
        name: q.patients?.name || 'Unknown',
        department: q.patients?.department || 'General',
        time: new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        estimatedWait: q.estimated_wait || 15
      }));

      setCurrentQueue(validQueue || []);
      setCurrentlyServing(validQueue?.find(q => q.status === 'serving') || null);
      setAnnouncements(notices || []);
    };

    fetchQueueAndAnnouncements();

    const interval = setInterval(fetchQueueAndAnnouncements, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'called': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'serving': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Queue Management System</h1>
                <p className="text-gray-600">Real-time patient queue status</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-gray-600">
                {currentTime.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
              Now Serving
            </h2>
            {currentlyServing && (
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                <div className="text-3xl font-bold text-green-700 mb-2">
                  {currentlyServing.id}
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {currentlyServing.name}
                </div>
                <div className="text-green-600 font-medium">
                  {currentlyServing.department}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Users className="w-6 h-6 text-blue-500 mr-2" />
              Queue Stats
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Waiting</span>
                <span className="text-2xl font-bold text-blue-600">{currentQueue.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Urgent Cases</span>
                <span className="text-2xl font-bold text-red-600">
                  {currentQueue.filter(p => p.priority === 'urgent').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Wait Time</span>
                <span className="text-2xl font-bold text-orange-600">
                  {Math.round(currentQueue.reduce((acc, p) => acc + (p.estimatedWait || 0), 0) / currentQueue.length) || 0}m
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Clock className="w-6 h-6 text-blue-500 mr-2" />
              Waiting Queue
            </h2>
            <div className="space-y-3">
              {currentQueue.map((patient, index) => (
                <div
                  key={patient.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', index.toString());
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const dropIndex = index;
                    
                    console.log('Drag from', dragIndex, 'to', dropIndex);
                    
                    if (dragIndex !== dropIndex) {
                      const newQueue = [...currentQueue];
                      const [draggedItem] = newQueue.splice(dragIndex, 1);
                      newQueue.splice(dropIndex, 0, draggedItem);
                      
                      console.log('New queue order:', newQueue.map(q => ({ id: q.id, name: q.name })));
                      
                      // Update each item's position in database
                      for (let i = 0; i < newQueue.length; i++) {
                        console.log('Updating patient', newQueue[i].patient_id, 'to position', i + 1);
                        const { error } = await supabase
                          .from('queue')
                          .update({ order_position: i + 1 })
                          .eq('patient_id', newQueue[i].patient_id);
                        
                        if (error) {
                          console.error('Update failed for patient', newQueue[i].patient_id, error);
                        } else {
                          console.log('Updated patient', newQueue[i].patient_id, 'successfully');
                        }
                      }
                      
                      setCurrentQueue(newQueue);
                    }
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-move ${
                    patient.priority === 'urgent' 
                      ? 'border-red-200 bg-red-50' 
                      : patient.priority === 'high'
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(patient.status)}
                        <span className="text-2xl font-bold text-gray-900">
                          {patient.id}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {patient.name}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {patient.department} • {patient.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(patient.priority)}`}>
                        {patient.priority.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Est. {patient.estimatedWait}m
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-6 h-6 text-orange-500 mr-2" />
            Announcements
          </h2>
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-4 rounded-xl border-l-4 ${
                  announcement.type === 'warning' 
                    ? 'border-orange-400 bg-orange-50' 
                    : announcement.type === 'info'
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-400 bg-gray-50'
                }`}
              >
                <p className="text-gray-800">{announcement.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueDisplay;
