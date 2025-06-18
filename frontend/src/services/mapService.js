/**
 * Service for map-related functionality using Leaflet with floor plans
 */

const mapService = {
  // Floor plan image bounds (coordinates for image overlay)
  floorPlanBounds: {
    'G': [[51.5045, -0.0915], [51.5065, -0.0885]],
    '1': [[51.5045, -0.0915], [51.5065, -0.0885]],
    '2': [[51.5045, -0.0915], [51.5065, -0.0885]],
    '3': [[51.5045, -0.0915], [51.5065, -0.0885]]
  },
  
  // Floor plan image paths
  floorPlanImages: {
    'G': '/floorplans/ground-floor.png',
    '1': '/floorplans/first-floor.png',
    '2': '/floorplans/second-floor.png',
    '3': '/floorplans/third-floor.png'
  },
  
  // Store floor plan layers
  floorLayers: {},
  
  /**
   * Initialize a map instance
   */
  initializeMap: (container, options = {}) => {
    // Initialize Leaflet map
    const map = window.L.map(container, {
      center: options.center || [51.505, -0.09],
      zoom: options.zoom || 18,
      minZoom: 17,
      maxZoom: 22
    });
    
    // Add OpenStreetMap base layer (can be hidden if using only floor plans)
    const baseLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      opacity: 0.3 // Make base map semi-transparent
    }).addTo(map);
    
    return map;
  },
  
  /**
   * Load hospital floor plans
   */
  loadHospitalMap: async (map, hospitalId) => {
    try {
      const floors = [
        { id: 'G', name: 'Ground Floor', level: 0 },
        { id: '1', name: 'First Floor', level: 1 },
        { id: '2', name: 'Second Floor', level: 2 },
        { id: '3', name: 'Third Floor', level: 3 }
      ];
      
      // Add floor plan image overlays
      floors.forEach(floor => {
        const bounds = window.L.latLngBounds(mapService.floorPlanBounds[floor.id]);
        const imageUrl = mapService.floorPlanImages[floor.id];
        
        // Create a colored rectangle as fallback if image doesn't exist
        const floorColors = {
          'G': '#a3e635', // Light green
          '1': '#60a5fa', // Light blue
          '2': '#f472b6', // Light pink
          '3': '#fbbf24'  // Light yellow
        };
        
        // Create colored rectangle for the floor
        const rectangle = window.L.rectangle(bounds, {
          color: floorColors[floor.id] || '#888888',
          weight: 1,
          fillOpacity: 0.2,
          fillColor: floorColors[floor.id] || '#888888'
        });
        
        // Try to create image overlay (will use rectangle as fallback)
        let floorLayer;
        try {
          floorLayer = window.L.imageOverlay(imageUrl, bounds, {
            opacity: 0.8,
            interactive: true
          });
          
          // Add rectangle underneath for context
          rectangle.addTo(map);
        } catch (err) {
          console.warn(`Floor plan image for floor ${floor.id} not found, using colored rectangle instead`);
          floorLayer = rectangle;
        }
        
        // Store layer reference
        mapService.floorLayers[floor.id] = floorLayer;
        
        // Only show ground floor by default
        if (floor.id === 'G') {
          floorLayer.addTo(map);
        }
      });
      
      return { floors };
    } catch (error) {
      console.error('Error loading hospital map:', error);
      throw error;
    }
  },
  
  /**
   * Switch to a different floor
   */
  switchFloor: (map, floorId) => {
    // Remove all floor layers
    Object.values(mapService.floorLayers).forEach(layer => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    
    // Add selected floor layer
    if (mapService.floorLayers[floorId]) {
      mapService.floorLayers[floorId].addTo(map);
    }
  },
  
  /**
   * Calculate route between two points in the hospital
   */
  calculateRoute: async (start, destination) => {
    try {
      // In a real app, this would call a routing API
      // For demo, we'll return a placeholder route
      return {
        route: [
          [start.lat, start.lng],
          [start.lat + 0.0002, start.lng + 0.0005],
          [destination.lat - 0.0001, destination.lng - 0.0003],
          [destination.lat, destination.lng]
        ],
        duration: 120, // seconds
        distance: 80, // meters
        instructions: [
          'Head east from your current location',
          'Turn right at the main corridor',
          'Continue straight past the elevators',
          'Your destination will be on the left'
        ]
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      throw error;
    }
  }
};

export default mapService;