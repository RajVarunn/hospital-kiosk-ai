# Hospital Floor Plans

Place your floor plan images in this directory with the following names:

- `ground-floor.png` - Ground floor (G)
- `first-floor.png` - First floor (1)
- `second-floor.png` - Second floor (2)
- `third-floor.png` - Third floor (3)

## Image Requirements

- Format: PNG or JPG
- Resolution: Minimum 1000x1000 pixels recommended
- Orientation: Match the orientation of the building on the map

## Calibration

The floor plans are positioned on the map using the coordinates defined in `mapService.js`. 
You may need to adjust these coordinates to match the actual position of your building.

```javascript
floorPlanBounds: {
  'G': [[51.5045, -0.0915], [51.5065, -0.0885]], // [southwest corner, northeast corner]
  '1': [[51.5045, -0.0915], [51.5065, -0.0885]],
  '2': [[51.5045, -0.0915], [51.5065, -0.0885]],
  '3': [[51.5045, -0.0915], [51.5065, -0.0885]]
}
```