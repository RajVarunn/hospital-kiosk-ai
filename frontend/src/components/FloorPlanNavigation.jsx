import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Target, Clock, Building, ChevronUp, ChevronDown } from 'lucide-react';

const FloorPlanNavigation = () => {
  const [currentFloor, setCurrentFloor] = useState('G');
  const [currentLocation, setCurrentLocation] = useState({ x: 100, y: 400 });
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [floorPlanLoaded, setFloorPlanLoaded] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Available floor plans
  const floors = [
    { id: 'G', name: 'Ground Floor', image: '/floorplans/TTSH-1.jpg' },
    { id: '1', name: '1st Floor', image: '/floorplans/TTSH-2.jpg' },
    { id: '2', name: '2nd Floor', image: '/floorplans/TTSH-3.jpg' },
    { id: '3', name: '3rd Floor', image: '/floorplans/TTSH-4.jpg' }
  ];

  // Predefined locations for each floor (you can expand this)
  const floorLocations = {
    'G': [
      { id: 'main-entrance', name: 'Main Entrance', x: 100, y: 400 },
      { id: 'reception', name: 'Reception', x: 200, y: 350 },
      { id: 'emergency', name: 'Emergency', x: 150, y: 200 },
      { id: 'pharmacy', name: 'Pharmacy', x: 300, y: 380 },
      { id: 'cafeteria', name: 'Cafeteria', x: 250, y: 450 },
      { id: 'elevator-g', name: 'Elevator', x: 350, y: 300 }
    ],
    '1': [
      { id: 'cardiology', name: 'Cardiology', x: 200, y: 250 },
      { id: 'radiology', name: 'Radiology', x: 400, y: 200 },
      { id: 'laboratory', name: 'Laboratory', x: 300, y: 350 },
      { id: 'elevator-1', name: 'Elevator', x: 350, y: 300 }
    ],
    '2': [
      { id: 'surgery', name: 'Surgery', x: 250, y: 200 },
      { id: 'icu', name: 'ICU', x: 350, y: 250 },
      { id: 'elevator-2', name: 'Elevator', x: 350, y: 300 }
    ],
    '3': [
      { id: 'maternity', name: 'Maternity', x: 200, y: 200 },
      { id: 'pediatrics', name: 'Pediatrics', x: 300, y: 250 },
      { id: 'elevator-3', name: 'Elevator', x: 350, y: 300 }
    ]
  };

  const getCurrentFloorImage = () => {
    return floors.find(floor => floor.id === currentFloor)?.image;
  };

  const getCurrentLocations = () => {
    return floorLocations[currentFloor] || [];
  };

  // Generate route between two points
  const generateRoute = (startLoc, endLoc) => {
    if (!startLoc || !endLoc) return [];

    // Simple pathfinding - create waypoints
    const waypoints = [
      startLoc,
      { x: startLoc.x, y: endLoc.y }, // Turn corner
      endLoc
    ];

    return waypoints;
  };

  const startNavigation = (destinationId) => {
    const locations = getCurrentLocations();
    const dest = locations.find(loc => loc.id === destinationId);
    if (!dest) return;

    setDestination(dest);
    const currentLoc = { x: currentLocation.x, y: currentLocation.y };
    const newRoute = generateRoute(currentLoc, dest);
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

  const changeFloor = (floorId) => {
    setCurrentFloor(floorId);
    stopNavigation();
    // Reset to elevator location when changing floors
    const elevatorLoc = floorLocations[floorId]?.find(loc => loc.id.includes('elevator'));
    if (elevatorLoc) {
      setCurrentLocation({ x: elevatorLoc.x, y: elevatorLoc.y });
    }
  };

  // Handle floor plan image load
  const handleImageLoad = () => {
    setFloorPlanLoaded(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Navigation className="w-6 h-6 mr-2" />
        Hospital Floor Plan Navigation
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Floor Plan Display */}
        <div className="lg:col-span-3">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {floors.find(f => f.id === currentFloor)?.name}
              </h3>
              
              {/* Floor Selector */}
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5" />
                <select
                  value={currentFloor}
                  onChange={(e) => changeFloor(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1"
                >
                  {floors.map(floor => (
                    <option key={floor.id} value={floor.id}>
                      {floor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative bg-white border-2 border-gray-300 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              {/* Floor Plan Image */}
              <img
                ref={imageRef}
                src={getCurrentFloorImage()}
                alt={`Floor plan for ${currentFloor}`}
                className="w-full h-full object-contain"
                onLoad={handleImageLoad}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />

              {/* Overlay for locations and navigation */}
              {floorPlanLoaded && (
                <div className="absolute inset-0">
                  {/* Location markers */}
                  {getCurrentLocations().map((location) => (
                    <div
                      key={location.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ 
                        left: `${(location.x / 500) * 100}%`, 
                        top: `${(location.y / 600) * 100}%` 
                      }}
                      onClick={() => startNavigation(location.id)}
                    >
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg hover:bg-blue-600 transition-colors">
                        {location.name}
                      </div>
                    </div>
                  ))}

                  {/* Route visualization */}
                  {route.length > 0 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {route.map((point, index) => {
                        if (index === route.length - 1) return null;
                        const nextPoint = route[index + 1];
                        return (
                          <line
                            key={index}
                            x1={`${(point.x / 500) * 100}%`}
                            y1={`${(point.y / 600) * 100}%`}
                            x2={`${(nextPoint.x / 500) * 100}%`}
                            y2={`${(nextPoint.y / 600) * 100}%`}
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
                          cx={`${(point.x / 500) * 100}%`}
                          cy={`${(point.y / 600) * 100}%`}
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
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                    style={{ 
                      left: `${(currentLocation.x / 500) * 100}%`, 
                      top: `${(currentLocation.y / 600) * 100}%` 
                    }}
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
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                      style={{ 
                        left: `${(destination.x / 500) * 100}%`, 
                        top: `${(destination.y / 600) * 100}%` 
                      }}
                    >
                      <Target className="w-6 h-6 text-green-500" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Panel */}
        <div className="space-y-6">
          {/* Floor Navigation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Floor Navigation</h3>
            <div className="space-y-2">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() => changeFloor(floor.id)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    currentFloor === floor.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border border-gray-200 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{floor.name}</span>
                    {currentFloor === floor.id && <Building className="w-4 h-4" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Destination Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Destinations on {floors.find(f => f.id === currentFloor)?.name}</h3>
            <div className="space-y-2">
              {getCurrentLocations().map((location) => (
                <button
                  key={location.id}
                  onClick={() => startNavigation(location.id)}
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
                    {currentStep > 0 && currentStep < route.length - 1 && "Continue following the highlighted path"}
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
                <span>Current Floor:</span>
                <span className="font-medium">{floors.find(f => f.id === currentFloor)?.name}</span>
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

export default FloorPlanNavigation;