import * as L from 'leaflet'

/**
 * Create Editable Layers
 *
 * @param {L.Map} map Leaflet Map
 * @param {L.FeatureGroup} editableLayers Editable Layers
 * @param {L.FeatureGroup} validationLayers Validation Layers
 * @returns {void}
 */
export default function (map, editableLayers, validationLayers) {
  map.on(L.Draw.Event.EDITSTOP, validate)
  map.on(L.Draw.Event.CREATED, validate)
  map.on(L.Draw.Event.DELETESTOP, validate)

  function validate () {
    const geojson = editableLayers.toGeoJSON()
    console.log(geojson)
  }
}
