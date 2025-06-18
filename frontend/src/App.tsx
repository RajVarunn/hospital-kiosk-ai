import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import StaffDashboard from './components/StaffDashboard';
import KioskInterface from './components/KioskInterface';
import MobileInterface from './components/MobileInterface';
import BedrockTest from './components/BedrockTest';
import useEnv from './hooks/useEnv';

function App() {
  const [bedrockResponse, setBedrockResponse] = useState<string | null>(null);
  // Get environment variables using our custom hook at the component level
  const env = useEnv();

  useEffect(() => {
    async function invokeBedrock() {
      // Use environment variables from the component scope
      const region = env.AWS_REGION;
      const accessKeyId = env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;

      // Check if credentials are available
      if (!region || !accessKeyId || !secretAccessKey) {
        console.warn('AWS credentials not found in environment variables');
        return;
      }

      const bedrockClient = new BedrockRuntimeClient({
        region,
        credentials: { accessKeyId, secretAccessKey }
      });

      const command = new InvokeModelCommand({
        modelId: 'meta.llama4-maverick-17b-instruct-v1:0',
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello world" }],
          max_tokens: 512,
          temperature: 0.5,
          top_p: 0.9
        }),
        contentType: 'application/json',
        accept: 'application/json'
      });

      try {
        const response = await bedrockClient.send(command);
        // In browser ReadableStream, wrap in Response to read as text
        const bodyString = await new Response(response.body).text();
        const parsedResponse = JSON.parse(bodyString);
        console.log('Bedrock response:', parsedResponse.content || bodyString);
        setBedrockResponse(parsedResponse.content || bodyString);
      } catch (err) {
        console.error('Bedrock invoke error:', err);
      }
    }
    
    invokeBedrock();
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
            <Link to="/bedrock-test" className="text-blue-600 hover:text-blue-800">
              Bedrock Test
            </Link>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<KioskInterface />} />
          <Route path="/mobile" element={<MobileInterface />} /> 
          <Route path="/dashboard" element={<StaffDashboard />} />
          <Route path="/bedrock-test" element={<BedrockTest />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;