import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StaffDashboard from './components/StaffDashboard';
import KioskInterface from './components/KioskInterface';
import MobileInterface from './components/MobileInterface';

function App() {
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
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<KioskInterface />} />
          <Route path="/mobile" element={<MobileInterface />} /> 
          <Route path="/dashboard" element={<StaffDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;