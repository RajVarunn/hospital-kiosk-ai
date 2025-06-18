/**
 * Service for hospital navigation functionality
 */

// Default floor plans from public directory
const defaultFloorPlans = [
  {
    id: 'floor-1',
    image: '/floorplans/floor1.png',
    name: 'Ground Floor',
    level: 1,
    width: 1000,
    height: 800,
    createdAt: new Date().toISOString()
  },
  {
    id: 'floor-2',
    image: '/floorplans/floor2.png',
    name: 'Level 2',
    level: 2,
    width: 1000,
    height: 800,
    createdAt: new Date().toISOString()
  }
];

// Store floor plans and navigation points
let floorPlans = [...defaultFloorPlans];
let navigationPoints = [];

// Sample navigation points for the first floor
const samplePoints = [
  { id: 'point-1', floorPlanId: 'floor-1', x: 100, y: 150, name: 'Main Entrance', type: 'generic', connections: ['point-2'] },
  { id: 'point-2', floorPlanId: 'floor-1', x: 200, y: 150, name: 'Reception', type: 'generic', connections: ['point-1', 'point-3', 'point-4'] },
  { id: 'point-3', floorPlanId: 'floor-1', x: 300, y: 150, name: 'Waiting Area', type: 'generic', connections: ['point-2'] },
  { id: 'point-4', floorPlanId: 'floor-1', x: 200, y: 250, name: 'Elevator', type: 'elevator', connections: ['point-2', 'point-5'] },
  { id: 'point-5', floorPlanId: 'floor-1', x: 300, y: 250, name: 'Emergency Room', type: 'room', connections: ['point-4'] }
];

// Add sample points
navigationPoints = [...samplePoints];

const navigationService = {
  /**
   * Add a new floor plan
   * @param {Object} floorPlan - Floor plan object with image and metadata
   * @returns {string} - ID of the added floor plan
   */
  addFloorPlan: (floorPlan) => {
    const id = `floor-${Date.now()}`;
    const newFloorPlan = {
      id,
      image: floorPlan.image,
      name: floorPlan.name || `Floor ${floorPlans.length + 1}`,
      level: floorPlan.level || floorPlans.length + 1,
      width: floorPlan.width,
      height: floorPlan.height,
      createdAt: new Date().toISOString()
    };
    
    floorPlans.push(newFloorPlan);
    return id;
  },
  
  /**
   * Get all floor plans
   * @returns {Array} - List of floor plans
   */
  getFloorPlans: () => {
    return [...floorPlans];
  },
  
  /**
   * Get a specific floor plan by ID
   * @param {string} id - Floor plan ID
   * @returns {Object|null} - Floor plan object or null if not found
   */
  getFloorPlan: (id) => {
    return floorPlans.find(fp => fp.id === id) || null;
  },
  
  /**
   * Add a navigation point to a floor plan
   * @param {string} floorPlanId - Floor plan ID
   * @param {Object} point - Navigation point with x, y coordinates and metadata
   * @returns {string} - ID of the added navigation point
   */
  addNavigationPoint: (floorPlanId, point) => {
    const id = `point-${Date.now()}`;
    const newPoint = {
      id,
      floorPlanId,
      x: point.x,
      y: point.y,
      name: point.name || `Point ${navigationPoints.filter(p => p.floorPlanId === floorPlanId).length + 1}`,
      type: point.type || 'generic', // generic, room, elevator, stairs, etc.
      connections: point.connections || [],
      createdAt: new Date().toISOString()
    };
    
    navigationPoints.push(newPoint);
    return id;
  },
  
  /**
   * Get all navigation points for a floor plan
   * @param {string} floorPlanId - Floor plan ID
   * @returns {Array} - List of navigation points
   */
  getNavigationPoints: (floorPlanId) => {
    return navigationPoints.filter(point => point.floorPlanId === floorPlanId);
  },
  
  /**
   * Connect two navigation points
   * @param {string} pointId1 - First point ID
   * @param {string} pointId2 - Second point ID
   * @returns {boolean} - Success status
   */
  connectPoints: (pointId1, pointId2) => {
    const point1 = navigationPoints.find(p => p.id === pointId1);
    const point2 = navigationPoints.find(p => p.id === pointId2);
    
    if (!point1 || !point2) return false;
    
    if (!point1.connections.includes(pointId2)) {
      point1.connections.push(pointId2);
    }
    
    if (!point2.connections.includes(pointId1)) {
      point2.connections.push(pointId1);
    }
    
    return true;
  },
  
  /**
   * Find path between two points using breadth-first search
   * @param {string} startId - Starting point ID
   * @param {string} endId - Ending point ID
   * @returns {Array|null} - Array of point IDs forming the path, or null if no path found
   */
  findPath: (startId, endId) => {
    const visited = new Set();
    const queue = [[startId]];
    
    while (queue.length > 0) {
      const path = queue.shift();
      const currentId = path[path.length - 1];
      
      if (currentId === endId) {
        return path;
      }
      
      if (!visited.has(currentId)) {
        visited.add(currentId);
        
        const currentPoint = navigationPoints.find(p => p.id === currentId);
        if (!currentPoint) continue;
        
        for (const connectedId of currentPoint.connections) {
          if (!visited.has(connectedId)) {
            queue.push([...path, connectedId]);
          }
        }
      }
    }
    
    return null; // No path found
  },
  
  /**
   * Get directions between two points
   * @param {string} startId - Starting point ID
   * @param {string} endId - Ending point ID
   * @returns {Array|null} - Array of direction steps, or null if no path found
   */
  getDirections: (startId, endId) => {
    const path = navigationService.findPath(startId, endId);
    if (!path) return null;
    
    const directions = [];
    for (let i = 0; i < path.length - 1; i++) {
      const currentPoint = navigationPoints.find(p => p.id === path[i]);
      const nextPoint = navigationPoints.find(p => p.id === path[i + 1]);
      
      if (currentPoint && nextPoint) {
        // Calculate direction (simplified)
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        
        let direction = '';
        if (Math.abs(dx) > Math.abs(dy)) {
          direction = dx > 0 ? 'right' : 'left';
        } else {
          direction = dy > 0 ? 'down' : 'up';
        }
        
        directions.push({
          from: currentPoint.name,
          to: nextPoint.name,
          direction,
          instruction: `Go ${direction} from ${currentPoint.name} to ${nextPoint.name}`
        });
      }
    }
    
    return directions;
  }
};

export default navigationService;