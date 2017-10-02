import createMap from './create-map'
import addListeners from './add-listeners'
import createDrawControl from './create-draw-control'
import createEditableLayers from './create-editable-layers'
import createValidationLayers from './create-validation-layers'
import validate from './validate'

// Map Layers
const map = createMap()
const editableLayers = createEditableLayers(map)
const validationLayers = createValidationLayers(map)

// Map Tools
createDrawControl(map, editableLayers)

// Listeners
addListeners(map)
validate(map, editableLayers, validationLayers)
