import * as L from 'leaflet'
import { featureEach } from '@turf/meta'
import defaultGeojson from './default-geojson'

/**
 * Create Editable Layers
 *
 * @param {L.Map} map Leaflet Map
 * @returns {L.FeatureGroup} Editable Layers
 */
export default function createEditableLayers (map) {
  const editableLayers = L.featureGroup()

  // Load Map Objects from LocalStorage
  let mapObjects = localStorage.getItem('mapObjects')
  if (mapObjects) {
    mapObjects = JSON.parse(mapObjects)
    // Set GeoJSON to default if no features exists
    if (!mapObjects.length) mapObjects = defaultGeojson
  } else mapObjects = defaultGeojson

  // Load Map Objects to Leaflet Layer
  if (mapObjects) {
    featureEach(mapObjects, feature => {
      const layer = L.geoJSON(feature).getLayers()[0]
      editableLayers.addLayer(layer)
    })
  }
  editableLayers.addTo(map)
  return editableLayers
}
