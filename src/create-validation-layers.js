import * as L from 'leaflet'

/**
 * Create Validation Layers
 *
 * @param {L.Map} map Leaflet Map
 * @returns {L.FeatureGroup} Validation Layers
 */
export default function createValidationLayers (map) {
  const validationLayers = L.featureGroup()
  validationLayers.addTo(map)

  return validationLayers
}
