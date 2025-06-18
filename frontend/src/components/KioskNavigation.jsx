import React, { useState, useRef, useEffect } from 'react';
import navigationService from '../services/navigationService';
import { MapPin, Navigation, Map } from 'lucide-react';

const KioskNavigation = () => {
  const [floorPlans, setFloorPlans] = useState([]);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(null);
  const [navigationPoints, setNavigationPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [directions, setDirections] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(new Image());
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Load floor plans on component mount
  useEffect(() => {
    const loadedFloorPlans = navigationService.getFloorPlans();
    setFloorPlans(loadedFloorPlans);
    
    if (loadedFloorPlans.length > 0) {
      handleSelectFloorPlan(loadedFloorPlans[0].id);
    }
  }, []);
  
  // Update canvas when floor plan or points change
  useEffect(() => {
    if (selectedFloorPlan && imageLoaded) {
      drawFloorPlan();
    }
  }, [selectedFloorPlan, navigationPoints, selectedPoint, destinationPoint, imageLoaded]);
  
  const handleSelectFloorPlan = (floorPlanId) => {
    const floorPlan = navigationService.getFloorPlan(floorPlanId);
    setSelectedFloorPlan(floorPlan);
    
    const points = navigationService.getNavigationPoints(floorPlanId);
    setNavigationPoints(points);
    
    // Reset navigation
    setSelectedPoint(null);
    setDestinationPoint(null);
    setDirections(null);
    
    // Load the image
    setImageLoaded(false);
    imageRef.current = new Image();
    imageRef.current.onload = () => {
      setImageLoaded(true);
    };
    imageRef.current.src = floorPlan.image;
  };
  
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Search across all floor plans
    const results = [];
    floorPlans.forEach(floorPlan => {
      const points = navigationService.getNavigationPoints(floorPlan.id);
      const matchingPoints = points.filter(point => 
        point.name.toLowerCase().includes(term.toLowerCase())
      );
      
      matchingPoints.forEach(point => {
        results.push({
          ...point,
          floorPlanName: floorPlan.name
        });
      });
    });
    
    setSearchResults(results);
  };
  
  const handleSelectDestination = (point) => {
    // Find the floor plan for this point
    const floorPlan = floorPlans.find(fp => fp.id === point.floorPlanId);
    if (floorPlan && floorPlan.id !== selectedFloorPlan?.id) {
      handleSelectFloorPlan(floorPlan.id);
    }
    
    setDestinationPoint(point);
    setSearchTerm('');
    setSearchResults([]);
    
    // If we have a starting point, calculate directions
    if (selectedPoint) {
      const directions = navigationService.getDirections(selectedPoint.id, point.id);
      setDirections(directions);
    }
  };
  
  const handleSelectStartingPoint = (point) => {
    setSelectedPoint(point);
    
    // If we have a destination point, calculate directions
    if (destinationPoint) {
      const directions = navigationService.getDirections(point.id, destinationPoint.id);
      setDirections(directions);
    }
  };
  
  const drawFloorPlan = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedFloorPlan || !imageLoaded) return;
    
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    // Set canvas size based on image
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw the floor plan
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Draw connections between points
    ctx.strokeStyle = '#3b82f6'; // Blue
    ctx.lineWidth = 2;
    
    for (const point of navigationPoints) {
      for (const connectedId of point.connections) {
        const connectedPoint = navigationPoints.find(p => p.id === connectedId);
        if (connectedPoint) {
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(connectedPoint.x, connectedPoint.y);
          ctx.stroke();
        }
      }
    }
    
    // Draw navigation path if available
    if (selectedPoint && destinationPoint && directions) {
      ctx.strokeStyle = '#10b981'; // Green
      ctx.lineWidth = 3;
      
      let path = navigationService.findPath(selectedPoint.id, destinationPoint.id);
      if (path) {
        for (let i = 0; i < path.length - 1; i++) {
          const current = navigationPoints.find(p => p.id === path[i]);
          const next = navigationPoints.find(p => p.id === path[i + 1]);
          
          if (current && next) {
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
        }
      }
    }
    
    // Draw navigation points
    for (const point of navigationPoints) {
      // Different colors based on point type
      switch (point.type) {
        case 'room':
          ctx.fillStyle = '#3b82f6'; // Blue
          break;
        case 'elevator':
          ctx.fillStyle = '#f59e0b'; // Amber
          break;
        case 'stairs':
          ctx.fillStyle = '#10b981'; // Green
          break;
        default:
          ctx.fillStyle = '#6b7280'; // Gray
      }
      
      // Highlight selected points
      if (point === selectedPoint) {
        ctx.fillStyle = '#ef4444'; // Red
      } else if (point === destinationPoint) {
        ctx.fillStyle = '#8b5cf6'; // Purple
      }
      
      // Draw point
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw label
      ctx.font = '12px Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText(point.name, point.x + 10, point.y + 5);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <Map className="w-5 h-5 mr-2" />
          Find Your Way
        </h2>
        
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search for a location..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
          
          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-sm max-h-60 overflow-y-auto">
              {searchResults.map(result => (
                <button
                  key={result.id}
                  onClick={() => handleSelectDestination(result)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                >
                  <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                  <div>
                    <p className="font-medium">{result.name}</p>
                    <p className="text-xs text-gray-500">{result.floorPlanName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {floorPlans.length > 0 && (
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
            {floorPlans.map(floorPlan => (
              <button
                key={floorPlan.id}
                onClick={() => handleSelectFloorPlan(floorPlan.id)}
                className={`px-3 py-1 rounded whitespace-nowrap ${
                  selectedFloorPlan?.id === floorPlan.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {floorPlan.name}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex space-x-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">You are at:</p>
            <select 
              value={selectedPoint?.id || ''}
              onChange={(e) => {
                const point = navigationPoints.find(p => p.id === e.target.value);
                if (point) handleSelectStartingPoint(point);
              }}
              className="border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Select starting point</option>
              {navigationPoints.map(point => (
                <option key={point.id} value={point.id}>{point.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Going to:</p>
            <select
              value={destinationPoint?.id || ''}
              onChange={(e) => {
                const point = navigationPoints.find(p => p.id === e.target.value);
                if (point) handleSelectDestination(point);
              }}
              className="border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Select destination</option>
              {navigationPoints.map(point => (
                <option key={point.id} value={point.id}>{point.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="relative border border-gray-300 rounded overflow-hidden" style={{ height: '400px' }}>
        {selectedFloorPlan ? (
          <div className="overflow-auto h-full">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">Loading floor plan...</p>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="mx-auto"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <p className="text-gray-500">No floor plan selected. Please select a floor plan.</p>
          </div>
        )}
      </div>
      
      {directions && directions.length > 0 && (
        <div className="mt-4 border border-gray-200 rounded p-3 bg-gray-50">
          <h4 className="font-medium mb-2 flex items-center">
            <Navigation className="w-4 h-4 mr-1 text-blue-600" />
            Directions
          </h4>
          <ol className="list-decimal pl-5 space-y-1">
            {directions.map((step, index) => (
              <li key={index} className="text-sm">
                {step.instruction}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default KioskNavigation;