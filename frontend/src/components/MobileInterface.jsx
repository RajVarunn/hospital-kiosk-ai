// frontend/src/components/MobileInterface.jsx

import { useParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

import {
  Home, MessageCircle, User, Calendar, MapPin, Menu, X,
  Phone, Bell, Settings, LogOut, ChevronRight, Clock,
  Activity, FileText, CreditCard, HelpCircle
} from 'lucide-react';

const MobileInterface = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const { patientId } = useParams();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'chat', label: 'AI Chat', icon: MessageCircle },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const quickActions = [
    { id: 'book', label: 'Book Appointment', icon: Calendar, color: 'blue' },
    { id: 'emergency', label: 'Emergency', icon: Phone, color: 'red' },
    { id: 'directions', label: 'Directions', icon: MapPin, color: 'green' },
    { id: 'vitals', label: 'Health Check', icon: Activity, color: 'purple' }
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setUserProfile(data);
      }
    };

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data);
      }
    };

    if (patientId) {
      fetchUserProfile();
      fetchNotifications();
    }
  }, [patientId]);

  const HomeScreen = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Welcome back,</h2>
            <p className="text-blue-100">{userProfile?.name}</p>
          </div>
          <div className="relative">
            <Bell className="w-6 h-6" />
            {notifications.length > 0 && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{notifications.length}</span>
              </div>
            )}
          </div>
        </div>

        {userProfile?.nextAppointment && (
          <div className="bg-white/20 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Next Appointment</span>
            </div>
            <p className="font-semibold mt-1">{userProfile.nextAppointment}</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map(action => (
            <button
              key={action.id}
              className={`p-4 rounded-xl border-2 border-transparent hover:border-${action.color}-200 bg-${action.color}-50 hover:bg-${action.color}-100 transition-all duration-200 transform hover:scale-105`}
            >
              <action.icon className={`w-8 h-8 text-${action.color}-600 mx-auto mb-2`} />
              <p className={`text-sm font-medium text-${action.color}-800`}>{action.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const ChatScreen = () => (
    <div className="p-4 text-gray-700">
      <p>Chat with our AI Assistant will be available soon!</p>
    </div>
  );

  const AppointmentsScreen = () => (
    <div className="p-4 text-gray-700">
      <p>View and manage your appointments here.</p>
    </div>
  );

  const ProfileScreen = () => (
    <div className="p-4 text-gray-700 space-y-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto text-white flex items-center justify-center">
          <User className="w-10 h-10" />
        </div>
        <h2 className="mt-2 text-xl font-bold">{userProfile?.name}</h2>
        <p className="text-sm text-gray-500">{userProfile?.nric}</p>
      </div>
      <div className="text-sm">
        <p><strong>Phone:</strong> {userProfile?.phone}</p>
        <p><strong>NRIC:</strong> {userProfile?.nric}</p>
      </div>
    </div>
  );

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen />;
      case 'chat': return <ChatScreen />;
      case 'appointments': return <AppointmentsScreen />;
      case 'profile': return <ProfileScreen />;
      default: return <HomeScreen />;
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading patient info...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">
          {tabs.find(tab => tab.id === activeTab)?.label}
        </h1>
        <div className="relative">
          <Bell className="w-6 h-6 text-gray-600" />
          {notifications.length > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-4">{renderActiveScreen()}</div>

      {/* Bottom Nav */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === tab.id ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="w-80 bg-white shadow-xl">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Additional sidebar content can go here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileInterface;