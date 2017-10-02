import * as L from 'leaflet'
import createMap from './create-map'
import addListeners from './add-listeners'
import createDrawControl from './create-draw-control'
import createEditableLayers from './create-editable-layers'
import createValidationLayers from './create-validation-layers'
import validate from './validate'

// Map Layers
const map = createMap()
const validationLayers = createValidationLayers(map)
const editableLayers = createEditableLayers(map)

// Map Tools
createDrawControl(map, editableLayers)

// Listeners
addListeners(map)
validate(map, editableLayers, validationLayers)

var overlayMaps = {
  Features: editableLayers,
  Validation: validationLayers
}
L.control.layers({}, overlayMaps, {position: 'topleft'}).addTo(map)
