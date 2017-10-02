(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('leaflet')) :
	typeof define === 'function' && define.amd ? define(['leaflet'], factory) :
	(factory(global.L));
}(this, (function (L) { 'use strict';

function createMap () {
  let zoom = localStorage.getItem('mapZoom') || 17;
  let center = localStorage.getItem('mapCenter');
  if (center) center = JSON.parse(center);
  else center = [42.354142, -71.069776];
  const map$$1 = L.map('app').setView(center, zoom);
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    maxZoom: 18,
    id: 'mapbox.streets',
    attribution: 'Map data &copy <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    accessToken: 'pk.eyJ1IjoiYWRkeHkiLCJhIjoiY2lsdmt5NjZwMDFsdXZka3NzaGVrZDZtdCJ9.ZUE-LebQgHaBduVwL68IoQ'
  }).addTo(map$$1);
  map$$1.doubleClickZoom.disable();
  return map$$1
}

function addListeners (map$$1) {
  map$$1.on('moveend', () => {
    const zoom = map$$1.getZoom();
    const center = map$$1.getCenter();
    localStorage.setItem('mapCenter', JSON.stringify(center));
    localStorage.setItem('mapZoom', JSON.stringify(zoom));
  });
  return map$$1
}

function createDrawControl (map$$1, editableLayers) {
  const drawControl = new L.Control.Draw({
    position: 'topright',
    edit: {
      featureGroup: editableLayers
    },
    draw: {
      polygon: {
        allowIntersection: false
      },
      rectangle: {},
      circlemarker: false,
      circle: false,
      polyline: true,
      marker: true
    }
  }).addTo(map$$1);
  map$$1.on(L.Draw.Event.CREATED, e => {
    editableLayers.addLayer(e.layer);
    saveMapObjects(editableLayers);
  });
  map$$1.on(L.Draw.Event.EDITED, () => saveMapObjects(editableLayers));
  map$$1.on(L.Draw.Event.EDITSTOP, () => saveMapObjects(editableLayers));
  map$$1.on(L.Draw.Event.DELETESTOP, () => saveMapObjects(editableLayers));
  map$$1.on(L.Draw.Event.DELETED, () => saveMapObjects(editableLayers));
  return drawControl
}
function saveMapObjects (editableLayers) {
  const geojson = editableLayers.toGeoJSON();
  localStorage.setItem('mapObjects', JSON.stringify(geojson));
}

function featureEach(geojson, callback) {
    if (geojson.type === 'Feature') {
        callback(geojson, 0);
    } else if (geojson.type === 'FeatureCollection') {
        for (var i = 0; i < geojson.features.length; i++) {
            callback(geojson.features[i], i);
        }
    }
}

function createEditableLayers (map$$1) {
  const editableLayers = L.featureGroup();
  const mapObjects = localStorage.getItem('mapObjects');
  if (mapObjects) {
    featureEach(JSON.parse(mapObjects), feature => {
      const layer = L.geoJSON(feature).getLayers()[0];
      editableLayers.addLayer(layer);
    });
  }
  editableLayers.addTo(map$$1);
  return editableLayers
}

var validate = function (map$$1, editableLayers, validationLayers) {
  map$$1.on(L.Draw.Event.EDITSTOP, validate);
  map$$1.on(L.Draw.Event.CREATED, validate);
  map$$1.on(L.Draw.Event.DELETESTOP, validate);
  function validate () {
    const geojson = editableLayers.toGeoJSON();
    console.log(geojson);
  }
};

const map$1 = createMap();
const editableLayers = createEditableLayers(map$1);
const validationLayers = L.featureGroup();
const drawControl = createDrawControl(map$1, editableLayers);
addListeners(map$1);
validate(map$1, editableLayers, validationLayers);

})));
