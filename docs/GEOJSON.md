## This is the documentation of geojson files used for geographical map visualization.

During dataset upload, users can upload a geojson file for map visualization for segmentation variables.

Geojson structure must be:

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [ [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ] ]
    },
    "properties": { "name": "segmentation variable value" }
  }]
}
```

It is a must to match values of `properties.name` to segmentation variables in the uploaded dataset.

System uses `d3-geo` to project and render Geojson onto svg. For projection, system uses `Mercator` projection with `fitSize`.

In general, geojsons uses `Sperical` or `Planar` coordinate conventions. Our system handles both, but for sperical coordinates we need rewinding technique. It is described well on [d3-geo](https://github.com/d3/d3-geo#d3-geo) docs:

"Spherical polygons also require a winding order convention to determine which side of the polygon is the inside: the exterior ring for polygons smaller than a hemisphere must be clockwise, while the exterior ring for polygons larger than a hemisphere must be anticlockwise. Interior rings representing holes must use the opposite winding order of their exterior ring. This winding order convention is also used by TopoJSON and ESRI shapefiles; however, it is the opposite convention of GeoJSON’s RFC 7946. (Also note that standard GeoJSON WGS84 uses planar equirectangular coordinates, not spherical coordinates, and thus may require stitching to remove antimeridian cuts.)"

For geojson rewind, [geojson-rewind](https://github.com/mapbox/geojson-rewind) is used. Using parameter `clockwise = true`, because it is very rare where we need anticlockwise. 