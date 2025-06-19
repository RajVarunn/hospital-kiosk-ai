import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import StaffDashboard from './components/StaffDashboard';
import KioskInterface from './components/KioskInterface';
import MobileInterface from './components/MobileInterface';
import BedrockTest from './components/BedrockTest';
import NavigationPage from './components/NavigationPage';
import DirectBedrockTest from './components/DirectBedrockTest';
import useEnv from './hooks/useEnv';

function App() {
  const [bedrockResponse, setBedrockResponse] = useState<string | null>(null);
  // Get environment variables using our custom hook at the component level
  const env = useEnv();

  useEffect(() => {
    // Skip automatic Bedrock invocation on startup to avoid potential issues
    console.log('App initialized - Bedrock test available in the Bedrock Test page');
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
            <Link to="/bedrock-test" className="text-blue-600 hover:text-blue-800">
              Bedrock Test
            </Link>
            <Link to="/direct-bedrock" className="text-blue-600 hover:text-blue-800">
              Direct Bedrock
            </Link>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<KioskInterface />} />
          <Route path="/mobile" element={<MobileInterface />} /> 
          <Route path="/dashboard" element={<StaffDashboard />} />
          <Route path="/navigation" element={<NavigationPage />} />
          <Route path="/bedrock-test" element={<BedrockTest />} />
          <Route path="/direct-bedrock" element={<DirectBedrockTest />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;