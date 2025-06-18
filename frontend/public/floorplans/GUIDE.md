# Using Your Floor Plans with the Navigation System

This guide explains how to integrate your floor plan images with the hospital navigation system.

## Step 1: Prepare Your Floor Plan Images

1. Create clear, high-resolution images of each floor plan
2. Save them as PNG or JPG files
3. Name them according to the floor:
   - `ground-floor.png` - Ground floor (G)
   - `first-floor.png` - First floor (1)
   - `second-floor.png` - Second floor (2)
   - `third-floor.png` - Third floor (3)
4. Place all images in this directory (`/frontend/public/floorplans/`)

## Step 2: Calibrate the Floor Plans

To properly position your floor plans on the map:

1. Enable calibration mode by setting `CALIBRATION_MODE = true` in `HospitalNavigation.jsx`
2. Run the application and navigate to the Hospital Navigation screen
3. For each floor:
   - Select the floor from the floor selector
   - Click on the southwest corner of your building on the map
   - Click on the northeast corner of your building
   - Note the coordinates displayed in the calibration panel
4. Update the `floorPlanBounds` in `mapService.js` with the coordinates for each floor

Example:
```javascript
floorPlanBounds: {
  'G': [[51.5045, -0.0915], [51.5065, -0.0885]], // [southwest corner, northeast corner]
  '1': [[51.5045, -0.0915], [51.5065, -0.0885]],
  '2': [[51.5045, -0.0915], [51.5065, -0.0885]],
  '3': [[51.5045, -0.0915], [51.5065, -0.0885]]
}
```

## Step 3: Update Destination Coordinates

Update the coordinates of each destination to match positions on your floor plans:

1. In `HospitalNavigation.jsx`, find the `availableDestinations` array
2. For each destination, update the coordinates to match a position on your floor plan
3. Make sure the floor value matches the correct floor for each destination

Example:
```javascript
{ 
  id: 'reception', 
  name: 'Main Reception', 
  floor: 'G', 
  coordinates: [51.5055, -0.09] 
}
```

## Step 4: Test the Navigation

1. Disable calibration mode by setting `CALIBRATION_MODE = false`
2. Run the application and test the navigation between different destinations
3. Verify that:
   - Floor plans display correctly
   - Destinations are positioned correctly on each floor
   - Routes are drawn properly between locations

## Additional Tips

- For multi-floor navigation, you'll need to define transition points (stairs, elevators) in your routing logic
- Consider adding landmarks or points of interest to help with orientation
- Use consistent scaling across all floor plans for accurate distance calculations