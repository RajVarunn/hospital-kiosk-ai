import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StaffDashboard from './components/StaffDashboard';
import KioskInterface from './components/KioskInterface';
import MobileInterface from './components/MobileInterface';
import FloorPlanNavigation from './components/FloorPlanNavigation';
import useEnv from './hooks/useEnv';

function App() {
  // Get environment variables using our custom hook at the component level
  const env = useEnv();

  useEffect(() => {
    console.log('App initialized');
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-white shadow-lg p-4">
          <div className="max-w-7xl mx-auto flex space-x-4">
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Kiosk
            </Link>
            <Link to="/mobile" className="text-blue-600 hover:text-blue-800">
              Mobile
            </Link>
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
              Staff Dashboard
            </Link>
            <Link to="/navigation" className="text-blue-600 hover:text-blue-800">
              Navigation
            </Link>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<KioskInterface />} />
          <Route path="/mobile" element={<MobileInterface />} /> 
          <Route path="/dashboard" element={<StaffDashboard />} />
          <Route path="/navigation" element={<FloorPlanNavigation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;