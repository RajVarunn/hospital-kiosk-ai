import React, { useState, useEffect, useRef } from 'react';
import { Map, Navigation, MapPin, CornerDownLeft, Compass, Loader, Layers } from 'lucide-react';
import dynamoService from '../services/dynamoService';
import bedrockService from '../services/bedrockService';
import './HospitalNavigation.css';

const HospitalNavigation = ({ onBack, userId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('reception');
  const [destination, setDestination] = useState(null);
  const [navigationData, setNavigationData] = useState(null);
  const [currentFloor, setCurrentFloor] = useState('G');
  
  // Floor plan images
  const floorPlans = {
    'G': '/floorplans/ground-floor.svg',
    '1': '/floorplans/first-floor.svg',
    '2': '/floorplans/second-floor.svg',
    '3': '/floorplans/third-floor.svg'
  };
  
  // Destinations with coordinates (x, y as percentages of the image)
  const [availableDestinations] = useState([
    { id: 'reception', name: 'Main Reception', floor: 'G', coordinates: [50, 50] },
    { id: 'emergency', name: 'Emergency Department', floor: 'G', coordinates: [70, 30] },
    { id: 'radiology', name: 'Radiology', floor: '1', coordinates: [60, 40] },
    { id: 'cardiology', name: 'Cardiology Department', floor: '2', coordinates: [55, 45] },
    { id: 'cafeteria', name: 'Cafeteria', floor: 'G', coordinates: [30, 70] },
    { id: 'pharmacy', name: 'Pharmacy', floor: 'G', coordinates: [80, 60] },
    { id: 'laboratory', name: 'Laboratory', floor: '1', coordinates: [40, 50] },
    { id: 'pediatrics', name: 'Pediatrics', floor: '3', coordinates: [60, 60] }
  ]);
  
  const navigationInterval = useRef(null);
  const userMarkerRef = useRef({ x: 50, y: 50 }); // Start at center

  // Get navigation data when destination changes
  useEffect(() => {
    if (!destination) return;
    
    const getNavData = async () => {
      try {
        setLoading(true);
        
        // Get selected destination details
        const destObj = availableDestinations.find(d => d.id === destination);
        if (!destObj) {
          setError('Destination not found');
          setLoading(false);
          return;
        }
        
        // Switch to destination floor if needed
        if (currentFloor !== destObj.floor) {
          setCurrentFloor(destObj.floor);
        }
        
        // Calculate route with AI-generated instructions
        const route = await calculateSimpleRoute(
          userMarkerRef.current, 
          {
            x: destObj.coordinates[0],
            y: destObj.coordinates[1]
          },
          destObj.name
        );
        
        // Update navigation data
        setNavigationData({
          remainingDistance: route.distance,
          estimatedTime: Math.round(route.distance / 5), // 5 meters per second
          currentStep: route.instructions[0],
          instructions: route.instructions
        });
        
        // Update user location in database
        await dynamoService.updateUserLocation({
          userId,
          currentLocation,
          destination
        });
        
        setLoading(false);
        
        // Start simulated navigation updates
        startNavigationUpdates(route);
        
      } catch (err) {
        console.error('Failed to load navigation data:', err);
        setError('Failed to load navigation data');
        setLoading(false);
      }
    };
    
    getNavData();
    
    return () => {
      if (navigationInterval.current) {
        clearInterval(navigationInterval.current);
      }
    };
  }, [destination, currentLocation, userId, availableDestinations, currentFloor]);

  // Calculate a route between two points with AI-generated instructions
  const calculateSimpleRoute = async (start, end, destName) => {
    // Calculate distance (using percentage units)
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.round(Math.sqrt(dx * dx + dy * dy) * 2); // Scale to meters
    
    // Default instructions in case AI generation fails
    let instructions = [
      `Head ${Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : (dy > 0 ? 'south' : 'north')} from your current location`,
      'Continue straight ahead',
      'Your destination will be ahead'
    ];
    
    try {
      // Try to get AI-generated instructions from Bedrock
      const aiInstructions = await bedrockService.generateNavigationInstructions('current location', destName);
      if (aiInstructions && aiInstructions.length > 0) {
        instructions = aiInstructions;
      }
    } catch (error) {
      console.warn('Failed to generate AI instructions, using default:', error);
    }
    
    return {
      distance,
      duration: Math.round(distance / 5), // 5 meters per second
      instructions,
      path: [
        { x: start.x, y: start.y },
        { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        { x: end.x, y: end.y }
      ]
    };
  };

  const startNavigationUpdates = (routeData) => {
    // Clear any existing interval
    if (navigationInterval.current) {
      clearInterval(navigationInterval.current);
    }
    
    let stepIndex = 0;
    let progress = 0;
    let pathIndex = 0;
    
    // Simulate navigation updates
    navigationInterval.current = setInterval(() => {
      // Update progress
      progress += 0.05;
      
      if (progress >= 1) {
        // Move to next instruction
        stepIndex = Math.min(stepIndex + 1, routeData.instructions.length - 1);
        pathIndex = Math.min(pathIndex + 1, routeData.path.length - 2);
        progress = 0;
      }
      
      // Calculate remaining distance and time
      const remainingDistance = Math.max(0, routeData.distance * (1 - (stepIndex / routeData.instructions.length) - (progress / routeData.instructions.length)));
      const remainingTime = Math.max(0, routeData.duration * (1 - (stepIndex / routeData.instructions.length) - (progress / routeData.instructions.length)));
      
      // Update navigation data
      setNavigationData(prev => ({
        ...prev,
        remainingDistance: Math.round(remainingDistance),
        estimatedTime: Math.round(remainingTime),
        currentStep: routeData.instructions[stepIndex]
      }));
      
      // Update user marker position along the route
      const currentPath = routeData.path[pathIndex];
      const nextPath = routeData.path[pathIndex + 1];
      
      if (currentPath && nextPath) {
        userMarkerRef.current = {
          x: currentPath.x + (nextPath.x - currentPath.x) * progress,
          y: currentPath.y + (nextPath.y - currentPath.y) * progress
        };
      }
      
      // End navigation when destination is reached
      if (stepIndex === routeData.instructions.length - 1 && progress > 0.9) {
        clearInterval(navigationInterval.current);
        setNavigationData(prev => ({
          ...prev,
          remainingDistance: 0,
          estimatedTime: 0,
          currentStep: 'You have arrived at your destination'
        }));
      }
    }, 1000);
  };

  const handleSelectDestination = (destId) => {
    setDestination(destId);
  };

  const handleFloorChange = (floor) => {
    setCurrentFloor(floor);
  };

  // Render user marker and destination on the floor plan
  const renderMarkers = () => {
    const destObj = destination ? availableDestinations.find(d => d.id === destination) : null;
    
    return (
      <>
        {/* User marker */}
        <div 
          className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ 
            left: `${userMarkerRef.current.x}%`, 
            top: `${userMarkerRef.current.y}%`,
            animation: 'pulse 2s infinite'
          }}
        />
        
        {/* Destination marker (if on current floor) */}
        {destObj && destObj.floor === currentFloor && (
          <div 
            className="absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ 
              left: `${destObj.coordinates[0]}%`, 
              top: `${destObj.coordinates[1]}%` 
            }}
          >
            <div className="text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3" fill="white"></circle>
              </svg>
            </div>
          </div>
        )}
        
        {/* Path line (if on current floor) */}
        {destObj && destObj.floor === currentFloor && destination && (
          <svg className="absolute inset-0 w-full h-full z-0" style={{ pointerEvents: 'none' }}>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
              </marker>
            </defs>
            <path 
              d={`M ${userMarkerRef.current.x},${userMarkerRef.current.y} L ${destObj.coordinates[0]},${destObj.coordinates[1]}`}
              stroke="#3b82f6" 
              strokeWidth="3" 
              strokeDasharray="5,5" 
              fill="none"
              markerEnd="url(#arrowhead)"
            />
          </svg>
        )}
      </>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back
        </button>
        <h2 className="text-xl font-semibold">Hospital Navigation</h2>
        <div></div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      ) : (
        <>
          {/* Floor plan view */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 h-64 relative overflow-hidden">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-30">
                <div className="flex flex-col items-center">
                  <Loader className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                  <p className="text-blue-700">Loading navigation...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Floor plan image */}
                <img 
                  src={floorPlans[currentFloor]} 
                  alt={`Floor ${currentFloor}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for missing images
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23f0f9ff"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%2360a5fa" text-anchor="middle">Floor ${currentFloor}</text></svg>'.replace('${currentFloor}', currentFloor);
                  }}
                />
                
                {/* Markers and path */}
                {renderMarkers()}
                
                {/* Floor selector */}
                <div className="absolute top-2 right-2 bg-white rounded-md shadow-md z-10">
                  <div className="p-1">
                    <Layers className="w-4 h-4 text-gray-600 mx-auto" />
                  </div>
                  {['G', '1', '2', '3'].map(floor => (
                    <button
                      key={floor}
                      onClick={() => handleFloorChange(floor)}
                      className={`w-8 h-8 flex items-center justify-center ${
                        currentFloor === floor 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {floor}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Navigation info */}
          {navigationData && destination && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center mb-3">
                <Navigation className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-medium">Navigation to {availableDestinations.find(d => d.id === destination)?.name}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">Distance</p>
                  <p className="text-xl font-semibold">{navigationData.remainingDistance || 0}m</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-700">Est. Time</p>
                  <p className="text-xl font-semibold">{navigationData.estimatedTime || 0}s</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Current Direction:</p>
                <div className="flex items-center">
                  <CornerDownLeft className="w-5 h-5 text-gray-600 mr-2" />
                  <p className="text-gray-800">{navigationData.currentStep || 'Calculating route...'}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Destination selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-medium mb-3">Select Destination</h3>
            
            <div className="grid grid-cols-1 gap-2">
              {availableDestinations.map((dest) => (
                <button
                  key={dest.id}
                  onClick={() => handleSelectDestination(dest.id)}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    destination === dest.id 
                      ? 'bg-blue-100 border border-blue-300' 
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <MapPin className={`w-5 h-5 mr-2 ${destination === dest.id ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div>
                      <p className={`font-medium ${destination === dest.id ? 'text-blue-800' : 'text-gray-800'}`}>
                        {dest.name}
                      </p>
                      <p className="text-xs text-gray-500">Floor {dest.floor}</p>
                    </div>
                  </div>
                  {destination === dest.id && (
                    <div className="bg-blue-600 rounded-full w-4 h-4"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HospitalNavigation;