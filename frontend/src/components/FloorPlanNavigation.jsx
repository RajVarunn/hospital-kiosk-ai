import React, { useState, useRef, useEffect } from 'react';
import navigationService from '../services/navigationService';
import { MapPin, Navigation, Plus, Minus, Upload, Map } from 'lucide-react';

const FloorPlanNavigation = () => {
  const [floorPlans, setFloorPlans] = useState([]);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(null);
  const [navigationPoints, setNavigationPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [mode, setMode] = useState('view'); // view, add-point, navigate
  const [directions, setDirections] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pointName, setPointName] = useState('');
  const [pointType, setPointType] = useState('generic');
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageRef = useRef(new Image());
  
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
  }, [selectedFloorPlan, navigationPoints, selectedPoint, destinationPoint, zoom, imageLoaded]);
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const floorPlanId = navigationService.addFloorPlan({
          image: event.target.result,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          width: img.width,
          height: img.height
        });
        
        const updatedFloorPlans = navigationService.getFloorPlans();
        setFloorPlans(updatedFloorPlans);
        handleSelectFloorPlan(floorPlanId);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  
  const handleSelectFloorPlan = (floorPlanId) => {
    const floorPlan = navigationService.getFloorPlan(floorPlanId);
    setSelectedFloorPlan(floorPlan);
    
    const points = navigationService.getNavigationPoints(floorPlanId);
    setNavigationPoints(points);
    
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
  
  const handleCanvasClick = (e) => {
    if (!selectedFloorPlan || !canvasRef.current || !imageLoaded) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (mode === 'add-point') {
      // Add new navigation point
      const pointId = navigationService.addNavigationPoint(selectedFloorPlan.id, {
        x, y, name: pointName || `Point ${navigationPoints.length + 1}`, type: pointType
      });
      
      const updatedPoints = navigationService.getNavigationPoints(selectedFloorPlan.id);
      setNavigationPoints(updatedPoints);
      setPointName('');
      
      // Connect to selected point if exists
      if (selectedPoint) {
        navigationService.connectPoints(selectedPoint.id, pointId);
        setSelectedPoint(updatedPoints.find(p => p.id === pointId));
      }
    } else if (mode === 'navigate') {
      // Select point closest to click
      const closestPoint = findClosestPoint(x, y);
      if (closestPoint) {
        if (!selectedPoint) {
          setSelectedPoint(closestPoint);
        } else if (!destinationPoint) {
          setDestinationPoint(closestPoint);
          
          // Calculate directions
          const directions = navigationService.getDirections(selectedPoint.id, closestPoint.id);
          setDirections(directions);
        } else {
          // Reset and start new navigation
          setSelectedPoint(closestPoint);
          setDestinationPoint(null);
          setDirections(null);
        }
      }
    } else {
      // View mode - just select the point
      const closestPoint = findClosestPoint(x, y);
      setSelectedPoint(closestPoint);
      
      if (closestPoint && destinationPoint) {
        // Recalculate directions if we have a destination
        const directions = navigationService.getDirections(closestPoint.id, destinationPoint.id);
        setDirections(directions);
      } else {
        setDestinationPoint(null);
        setDirections(null);
      }
    }
  };
  
  const findClosestPoint = (x, y) => {
    const threshold = 20; // Clickable radius
    let closest = null;
    let minDistance = threshold;
    
    for (const point of navigationPoints) {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    }
    
    return closest;
  };
  
  const drawFloorPlan = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedFloorPlan || !imageLoaded) return;
    
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    // Set canvas size based on image and zoom
    canvas.width = img.width * zoom;
    canvas.height = img.height * zoom;
    
    // Draw the floor plan
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Draw connections between points
    ctx.strokeStyle = '#3b82f6'; // Blue
    ctx.lineWidth = 2 * zoom;
    
    for (const point of navigationPoints) {
      for (const connectedId of point.connections) {
        const connectedPoint = navigationPoints.find(p => p.id === connectedId);
        if (connectedPoint) {
          ctx.beginPath();
          ctx.moveTo(point.x * zoom, point.y * zoom);
          ctx.lineTo(connectedPoint.x * zoom, connectedPoint.y * zoom);
          ctx.stroke();
        }
      }
    }
    
    // Draw navigation path if available
    if (selectedPoint && destinationPoint && directions) {
      ctx.strokeStyle = '#10b981'; // Green
      ctx.lineWidth = 3 * zoom;
      
      let path = navigationService.findPath(selectedPoint.id, destinationPoint.id);
      if (path) {
        for (let i = 0; i < path.length - 1; i++) {
          const current = navigationPoints.find(p => p.id === path[i]);
          const next = navigationPoints.find(p => p.id === path[i + 1]);
          
          if (current && next) {
            ctx.beginPath();
            ctx.moveTo(current.x * zoom, current.y * zoom);
            ctx.lineTo(next.x * zoom, next.y * zoom);
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
      ctx.arc(point.x * zoom, point.y * zoom, 8 * zoom, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw label
      ctx.font = `${12 * zoom}px Arial`;
      ctx.fillStyle = '#000000';
      ctx.fillText(point.name, (point.x + 10) * zoom, (point.y + 5) * zoom);
    }
  };
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode !== 'navigate') {
      setDestinationPoint(null);
      setDirections(null);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <Map className="w-5 h-5 mr-2" />
          Hospital Navigation
        </h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => fileInputRef.current.click()}
            className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Floor Plan</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <button
            onClick={() => handleModeChange('view')}
            className={`px-3 py-1 rounded ${mode === 'view' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            View
          </button>
          <button
            onClick={() => handleModeChange('add-point')}
            className={`px-3 py-1 rounded ${mode === 'add-point' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Add Points
          </button>
          <button
            onClick={() => handleModeChange('navigate')}
            className={`px-3 py-1 rounded ${mode === 'navigate' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Navigate
          </button>
          
          <div className="ml-auto flex items-center space-x-1">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded bg-gray-200 hover:bg-gray-300"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded bg-gray-200 hover:bg-gray-300"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
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
        
        {mode === 'add-point' && (
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={pointName}
              onChange={(e) => setPointName(e.target.value)}
              placeholder="Point name"
              className="border border-gray-300 rounded px-2 py-1 flex-grow"
            />
            <select
              value={pointType}
              onChange={(e) => setPointType(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1"
            >
              <option value="generic">Generic</option>
              <option value="room">Room</option>
              <option value="elevator">Elevator</option>
              <option value="stairs">Stairs</option>
            </select>
          </div>
        )}
      </div>
      
      <div className="relative border border-gray-300 rounded overflow-hidden" style={{ height: '500px' }}>
        {selectedFloorPlan ? (
          <div className="overflow-auto h-full">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">Loading floor plan...</p>
              </div>
            )}
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="cursor-pointer"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <p className="text-gray-500">No floor plan selected. Please select a floor plan.</p>
          </div>
        )}
      </div>
      
      {mode === 'navigate' && (
        <div className="mt-4">
          <h3 className="font-medium text-gray-900 mb-2">Navigation</h3>
          
          <div className="flex space-x-4 mb-2">
            <div>
              <p className="text-sm text-gray-500">Start Point</p>
              <p className="font-medium">{selectedPoint?.name || 'Not selected'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Destination</p>
              <p className="font-medium">{destinationPoint?.name || 'Not selected'}</p>
            </div>
          </div>
          
          {directions && directions.length > 0 ? (
            <div className="border border-gray-200 rounded p-3 bg-gray-50">
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
          ) : selectedPoint && !destinationPoint ? (
            <p className="text-sm text-blue-600">Now select a destination point</p>
          ) : selectedPoint && destinationPoint && (!directions || directions.length === 0) ? (
            <p className="text-sm text-red-600">No path found between these points</p>
          ) : (
            <p className="text-sm text-gray-500">Select a starting point on the map</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FloorPlanNavigation;