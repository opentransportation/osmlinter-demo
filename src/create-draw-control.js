import * as L from 'leaflet'

/**
 * Create Draw Control
 *
 * @param {L.Map} map Leaflet Map
 * @param {L.FeatureGroup} editableLayers Editable Layers
 * @returns {L.Control}
 */
export default function createDrawControl (map, editableLayers) {
  const drawControl = new L.Control.Draw({
    position: 'topright',
    edit: {
      featureGroup: editableLayers
    },
    draw: {
      polygon: {
        allowIntersection: false // Restricts shapes to simple polygons
      },
      rectangle: {},
      circlemarker: false,
      circle: false,
      polyline: true,
      marker: true
    }
  }).addTo(map)

  // Save Drawn objects
  map.on(L.Draw.Event.CREATED, e => {
    editableLayers.addLayer(e.layer)
    saveMapObjects(editableLayers)
  })
  map.on(L.Draw.Event.EDITED, () => saveMapObjects(editableLayers))
  map.on(L.Draw.Event.EDITSTOP, () => saveMapObjects(editableLayers))
  map.on(L.Draw.Event.DELETESTOP, () => saveMapObjects(editableLayers))
  map.on(L.Draw.Event.DELETED, () => saveMapObjects(editableLayers))
  return drawControl
}

/**
 * Save Map Objects
 *
 * @param {L.FeatureGroup} editableLayers Editable Layers
 */
function saveMapObjects (editableLayers) {
  const geojson = editableLayers.toGeoJSON()
  localStorage.setItem('mapObjects', JSON.stringify(geojson))
}
