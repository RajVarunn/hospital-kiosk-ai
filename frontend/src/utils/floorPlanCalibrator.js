/**
 * Utility for calibrating floor plan images on the map
 * 
 * This can be used in development to help position floor plans correctly
 */

const floorPlanCalibrator = {
  /**
   * Initialize the calibration tool
   * @param {Object} map - Leaflet map instance
   */
  init: (map) => {
    // Create control panel
    const controlDiv = document.createElement('div');
    controlDiv.className = 'leaflet-control-calibration leaflet-control';
    controlDiv.style.backgroundColor = 'white';
    controlDiv.style.padding = '10px';
    controlDiv.style.borderRadius = '4px';
    controlDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    
    // Add title
    const title = document.createElement('h4');
    title.textContent = 'Floor Plan Calibration';
    title.style.margin = '0 0 8px 0';
    controlDiv.appendChild(title);
    
    // Add coordinates display
    const coordsDisplay = document.createElement('div');
    coordsDisplay.id = 'coords-display';
    coordsDisplay.style.marginBottom = '8px';
    coordsDisplay.style.fontSize = '12px';
    controlDiv.appendChild(coordsDisplay);
    
    // Add bounds display
    const boundsDisplay = document.createElement('div');
    boundsDisplay.id = 'bounds-display';
    boundsDisplay.style.fontSize = '12px';
    boundsDisplay.style.wordBreak = 'break-all';
    controlDiv.appendChild(boundsDisplay);
    
    // Create custom control
    const calibrationControl = window.L.Control.extend({
      options: {
        position: 'topright'
      },
      onAdd: () => controlDiv
    });
    
    // Add control to map
    new calibrationControl().addTo(map);
    
    // Update coordinates on mouse move
    map.on('mousemove', (e) => {
      const { lat, lng } = e.latlng;
      document.getElementById('coords-display').textContent = 
        `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    });
    
    // Track bounds for calibration
    let bounds = [];
    
    // Add click handler to set bounds
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      
      if (bounds.length < 2) {
        bounds.push([lat, lng]);
        
        if (bounds.length === 2) {
          const boundsText = JSON.stringify(bounds);
          document.getElementById('bounds-display').textContent = 
            `Bounds: ${boundsText}`;
          
          // Draw rectangle
          window.L.rectangle(bounds, {
            color: '#ff7800',
            weight: 1
          }).addTo(map);
        }
      } else {
        // Reset bounds
        bounds = [[lat, lng]];
        
        // Clear previous rectangles
        map.eachLayer((layer) => {
          if (layer instanceof window.L.Rectangle) {
            map.removeLayer(layer);
          }
        });
      }
    });
    
    console.log('Floor plan calibration tool initialized');
  }
};

export default floorPlanCalibrator;