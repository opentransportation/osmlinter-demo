import * as L from 'leaflet'
import { featureEach } from '@turf/meta'

/**
 * Create Editable Layers
 *
 * @param {L.Map} map Leaflet Map
 * @returns {L.FeatureGroup} Editable Layers
 */
export default function createEditableLayers (map) {
  const editableLayers = L.featureGroup()

  // Load Map Objects from LocalStorage
  const mapObjects = localStorage.getItem('mapObjects')
  if (mapObjects) {
    featureEach(JSON.parse(mapObjects), feature => {
      const layer = L.geoJSON(feature).getLayers()[0]
      editableLayers.addLayer(layer)
    })
  }
  editableLayers.addTo(map)
  return editableLayers
}
