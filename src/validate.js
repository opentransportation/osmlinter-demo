import * as L from 'leaflet'
import { impossibleAngle, closestEndNodes } from 'osmlinter'
import { featureEach } from '@turf/meta'
import { getType } from '@turf/invariant'
import polygonToLineString from '@turf/polygon-to-linestring'
import circle from '@turf/circle'
import { lineString } from '@turf/helpers'

/**
 * Create Editable Layers
 *
 * @param {L.Map} map Leaflet Map
 * @param {L.FeatureGroup} editableLayers Editable Layers
 * @param {L.FeatureGroup} validationLayers Validation Layers
 * @returns {void}
 */
export default function (map, editableLayers, validationLayers) {
  // Validate on Draw event
  map.on(L.Draw.Event.EDITSTOP, validate)
  map.on(L.Draw.Event.CREATED, validate)
  map.on(L.Draw.Event.DELETESTOP, validate)
  document.getElementById('maxDistance').onchange = validate
  document.getElementById('maxDistance').onkeyup = validate
  document.getElementById('minAngle').onchange = validate
  document.getElementById('minAngle').onkeyup = validate

  // Validate on Start
  validate()

  function validate () {
    const geojson = editableLayers.toGeoJSON()

    // Counters
    let impossibleAngleCounter = 0
    let closestEndNodesCounter = 0

    // Settings
    const maxDistance = JSON.parse(document.getElementById('maxDistance').value || 50)
    const minAngle = JSON.parse(document.getElementById('minAngle').value || 10)
    const units = 'feet'

    // Remove any existing features in validation layer
    validationLayers.clearLayers()

    // Impossible Angle
    featureEach(geojson, (feature, featureIndex) => {
      if (getType(feature) !== 'LineString') return
      if (impossibleAngle(feature, {minAngle})) {
        L.geoJSON(feature.geometry, {
          style: {
            color: '#F00',
            weight: 15,
            opacity: 0.65
          }
        }).addTo(validationLayers)
        impossibleAngleCounter++
      }
    })

    // Convert Polygon to LineString
    featureEach(geojson, (feature, featureIndex) => {
      if (getType(feature) === 'Polygon') {
        geojson.features[featureIndex] = polygonToLineString(feature)
      }
    })

    // Closest End Nodes
    featureEach(closestEndNodes(geojson, {units, maxDistance}), node => {
      const radius = node.properties.distance
      const closestPoint = node.properties.closestPoint

      // Red Circle
      L.geoJSON(circle(node, radius, {units}), {
        style: {
          color: '#F00',
          weight: 3,
          opacity: 0.65,
          fillOpacity: 0.25
        }
      }).addTo(validationLayers)

      // Red Line
      L.geoJSON(lineString([closestPoint, node.geometry.coordinates]).geometry, {
        style: {
          color: '#900',
          weight: 5,
          opacity: 1
        }
      }).addTo(validationLayers)
      closestEndNodesCounter++
    })

    // Update Counters
    document.getElementById('closest-end-nodes-counter').innerHTML = closestEndNodesCounter
    document.getElementById('impossible-angle-counter').innerHTML = impossibleAngleCounter
  }
}
