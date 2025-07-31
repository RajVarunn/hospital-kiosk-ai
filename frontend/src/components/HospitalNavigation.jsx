import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Target, Clock } from 'lucide-react';

const HospitalNavigation = () => {
  const [currentLocation, setCurrentLocation] = useState({ x: 50, y: 300 }); // Starting point
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Hospital floor plan locations
  const locations = {
    'main-entrance': { x: 50, y: 300, name: 'Main Entrance' },
    'reception': { x: 150, y: 300, name: 'Reception' },
    'emergency': { x: 100, y: 100, name: 'Emergency Department' },
    'radiology': { x: 400, y: 150, name: 'Radiology' },
    'pharmacy': { x: 300, y: 400, name: 'Pharmacy' },
    'cardiology': { x: 500, y: 200, name: 'Cardiology' },
    'laboratory': { x: 350, y: 300, name: 'Laboratory' },
    'cafeteria': { x: 200, y: 450, name: 'Cafeteria' },
    'elevator-1': { x: 250, y: 200, name: 'Elevator 1' },
    'elevator-2': { x: 450, y: 350, name: 'Elevator 2' }
  };

  // Generate route between two points
  const generateRoute = (start, end) => {
    const startPos = locations[start] || currentLocation;
    const endPos = locations[end];
    
    if (!endPos) return [];

    // Simple pathfinding - create waypoints
    const waypoints = [
      startPos,
      { x: startPos.x, y: endPos.y }, // Turn corner
      endPos
    ];

    return waypoints;
  };

  const startNavigation = (destinationKey) => {
    const dest = locations[destinationKey];
    if (!dest) return;

    setDestination(dest);
    const newRoute = generateRoute('current', destinationKey);
    setRoute(newRoute);
    setCurrentStep(0);
    setIsNavigating(true);
  };

  const nextStep = () => {
    if (currentStep < route.length - 1) {
      setCurrentStep(currentStep + 1);
      setCurrentLocation(route[currentStep + 1]);
    } else {
      setIsNavigating(false);
      alert('You have arrived at your destination!');
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setRoute([]);
    setCurrentStep(0);
    setDestination(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Navigation className="w-6 h-6 mr-2" />
        Hospital Navigation
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Floor Plan */}
        <div className="lg:col-span-2">
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Floor Plan</h3>
            <div className="relative bg-white border-2 border-gray-300 rounded-lg" style={{ height: '500px', width: '600px' }}>
              
              {/* Floor plan background elements */}
              <div className="absolute inset-0">
                {/* Corridors */}
                <div className="absolute bg-gray-200" style={{ left: '40px', top: '290px', width: '520px', height: '20px' }}></div>
                <div className="absolute bg-gray-200" style={{ left: '240px', top: '90px', width: '20px', height: '220px' }}></div>
                <div className="absolute bg-gray-200" style={{ left: '440px', top: '140px', width: '20px', height: '220px' }}></div>
                
                {/* Rooms */}
                {Object.entries(locations).map(([key, location]) => (
                  <div
                    key={key}
                    className="absolute bg-blue-100 border border-blue-300 rounded flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-blue-200"
                    style={{
                      left: `${location.x - 25}px`,
                      top: `${location.y - 15}px`,
                      width: '50px',
                      height: '30px'
                    }}
                    onClick={() => startNavigation(key)}
                  >
                    {location.name.split(' ')[0]}
                  </div>
                ))}
              </div>

              {/* Route visualization */}
              {route.length > 0 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {route.map((point, index) => {
                    if (index === route.length - 1) return null;
                    const nextPoint = route[index + 1];
                    return (
                      <line
                        key={index}
                        x1={point.x}
                        y1={point.y}
                        x2={nextPoint.x}
                        y2={nextPoint.y}
                        stroke={index <= currentStep ? "#10B981" : "#D1D5DB"}
                        strokeWidth="3"
                        strokeDasharray={index <= currentStep ? "0" : "5,5"}
                      />
                    );
                  })}
                  
                  {/* Route points */}
                  {route.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="6"
                      fill={index <= currentStep ? "#10B981" : "#D1D5DB"}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
              )}

              {/* Current location marker */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: `${currentLocation.x}px`, top: `${currentLocation.y}px` }}
              >
                <div className="relative">
                  <MapPin className="w-6 h-6 text-red-500 animate-bounce" />
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    You are here
                  </div>
                </div>
              </div>

              {/* Destination marker */}
              {destination && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ left: `${destination.x}px`, top: `${destination.y}px` }}
                >
                  <Target className="w-6 h-6 text-green-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Panel */}
        <div className="space-y-6">
          {/* Destination Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Select Destination</h3>
            <div className="space-y-2">
              {Object.entries(locations).map(([key, location]) => (
                <button
                  key={key}
                  onClick={() => startNavigation(key)}
                  className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Instructions */}
          {isNavigating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Navigation className="w-5 h-5 mr-2" />
                Navigation to {destination?.name}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Step {currentStep + 1} of {route.length}</span>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    ~{Math.max(1, route.length - currentStep)} min
                  </div>
                </div>
                
                <div className="bg-white rounded p-3">
                  <p className="font-medium">
                    {currentStep === 0 && "Starting from your current location"}
                    {currentStep > 0 && currentStep < route.length - 1 && "Continue straight ahead"}
                    {currentStep === route.length - 1 && `You have arrived at ${destination?.name}!`}
                  </p>
                </div>

                <div className="flex space-x-2">
                  {currentStep < route.length - 1 ? (
                    <button
                      onClick={nextStep}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      onClick={stopNavigation}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                    >
                      Finish
                    </button>
                  )}
                  <button
                    onClick={stopNavigation}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Current Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Current Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Current Location:</span>
                <span className="font-medium">
                  {Object.values(locations).find(loc => 
                    Math.abs(loc.x - currentLocation.x) < 10 && 
                    Math.abs(loc.y - currentLocation.y) < 10
                  )?.name || 'Moving...'}
                </span>
              </div>
              {destination && (
                <div className="flex justify-between">
                  <span>Destination:</span>
                  <span className="font-medium">{destination.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-medium ${isNavigating ? 'text-blue-600' : 'text-gray-600'}`}>
                  {isNavigating ? 'Navigating' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalNavigation;