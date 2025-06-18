import React from 'react';
import FloorPlanNavigation from './FloorPlanNavigation';
import { Map, Info } from 'lucide-react';

const NavigationPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Map className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hospital Navigation</h1>
              <p className="text-gray-500">Find your way around the hospital</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <FloorPlanNavigation />
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              How to Use
            </h2>
            
            <div className="space-y-3 text-gray-700">
              <div>
                <h3 className="font-medium">Upload a Floor Plan</h3>
                <p className="text-sm">Click the "Upload Floor Plan" button to add a new floor plan image.</p>
              </div>
              
              <div>
                <h3 className="font-medium">Add Navigation Points</h3>
                <p className="text-sm">Switch to "Add Points" mode, enter a name and type, then click on the floor plan to add points. Points added consecutively will be connected automatically.</p>
              </div>
              
              <div>
                <h3 className="font-medium">Navigate</h3>
                <p className="text-sm">Switch to "Navigate" mode, click on a starting point, then click on a destination. The system will show the path and directions.</p>
              </div>
              
              <div>
                <h3 className="font-medium">Point Types</h3>
                <ul className="text-sm list-disc pl-5">
                  <li>Generic (gray): General navigation points</li>
                  <li>Room (blue): Patient rooms, offices, etc.</li>
                  <li>Elevator (amber): Elevator locations</li>
                  <li>Stairs (green): Staircase locations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationPage;