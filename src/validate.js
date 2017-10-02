import * as L from 'leaflet'
import { impossibleAngle, closestEndNodes } from 'osmlinter'
import { featureEach } from '@turf/meta'
import { getType } from '@turf/invariant'
import polygonToLineString from '@turf/polygon-to-linestring'
import circle from '@turf/circle'

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

  // Validate on Start
  validate()

  function validate () {
    const geojson = editableLayers.toGeoJSON()

    // Remove any existing features in validation layer
    validationLayers.clearLayers()

    // Impossible Angle
    featureEach(geojson, (feature, featureIndex) => {
      if (getType(feature) !== 'LineString') return
      if (impossibleAngle(feature)) {
        L.geoJSON(feature.geometry, {
          style: {
            color: '#F00',
            weight: 15,
            opacity: 0.65
          }
        }).addTo(validationLayers)
      }
    })

    // Convert Polygon to LineString
    featureEach(geojson, (feature, featureIndex) => {
      if (getType(feature) === 'Polygon') {
        geojson.features[featureIndex] = polygonToLineString(feature)
      }
    })

    // Closest End Nodes
    const units = 'feet'
    const maxDistance = 100
    featureEach(closestEndNodes(geojson, {units, maxDistance}), node => {
      const radius = node.properties.distance

      // Red Circle
      L.geoJSON(circle(node, radius, {units}), {
        style: {
          color: '#F00',
          weight: 5,
          opacity: 0.65,
          fillOpacity: 0.65
        }
      }).addTo(validationLayers)
    })
  }
}
