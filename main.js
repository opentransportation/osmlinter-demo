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

function coordEach(geojson, callback, excludeWrapCoord) {
    if (geojson === null) return;
    var featureIndex, geometryIndex, j, k, l, geometry, stopG, coords,
        geometryMaybeCollection,
        wrapShrink = 0,
        coordIndex = 0,
        isGeometryCollection,
        type = geojson.type,
        isFeatureCollection = type === 'FeatureCollection',
        isFeature = type === 'Feature',
        stop = isFeatureCollection ? geojson.features.length : 1;
    for (featureIndex = 0; featureIndex < stop; featureIndex++) {
        geometryMaybeCollection = (isFeatureCollection ? geojson.features[featureIndex].geometry :
            (isFeature ? geojson.geometry : geojson));
        isGeometryCollection = (geometryMaybeCollection) ? geometryMaybeCollection.type === 'GeometryCollection' : false;
        stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;
        for (geometryIndex = 0; geometryIndex < stopG; geometryIndex++) {
            var featureSubIndex = 0;
            geometry = isGeometryCollection ?
                geometryMaybeCollection.geometries[geometryIndex] : geometryMaybeCollection;
            if (geometry === null) continue;
            coords = geometry.coordinates;
            var geomType = geometry.type;
            wrapShrink = (excludeWrapCoord && (geomType === 'Polygon' || geomType === 'MultiPolygon')) ? 1 : 0;
            switch (geomType) {
            case null:
                break;
            case 'Point':
                callback(coords, coordIndex, featureIndex, featureSubIndex);
                coordIndex++;
                featureSubIndex++;
                break;
            case 'LineString':
            case 'MultiPoint':
                for (j = 0; j < coords.length; j++) {
                    callback(coords[j], coordIndex, featureIndex, featureSubIndex);
                    coordIndex++;
                    if (geomType === 'MultiPoint') featureSubIndex++;
                }
                if (geomType === 'LineString') featureSubIndex++;
                break;
            case 'Polygon':
            case 'MultiLineString':
                for (j = 0; j < coords.length; j++) {
                    for (k = 0; k < coords[j].length - wrapShrink; k++) {
                        callback(coords[j][k], coordIndex, featureIndex, featureSubIndex);
                        coordIndex++;
                    }
                    if (geomType === 'MultiLineString') featureSubIndex++;
                }
                if (geomType === 'Polygon') featureSubIndex++;
                break;
            case 'MultiPolygon':
                for (j = 0; j < coords.length; j++) {
                    for (k = 0; k < coords[j].length; k++)
                        for (l = 0; l < coords[j][k].length - wrapShrink; l++) {
                            callback(coords[j][k][l], coordIndex, featureIndex, featureSubIndex);
                            coordIndex++;
                        }
                    featureSubIndex++;
                }
                break;
            case 'GeometryCollection':
                for (j = 0; j < geometry.geometries.length; j++)
                    coordEach(geometry.geometries[j], callback, excludeWrapCoord);
                break;
            default:
                throw new Error('Unknown Geometry Type');
            }
        }
    }
}
function coordReduce(geojson, callback, initialValue, excludeWrapCoord) {
    var previousValue = initialValue;
    coordEach(geojson, function (currentCoord, coordIndex, featureIndex, featureSubIndex) {
        if (coordIndex === 0 && initialValue === undefined) previousValue = currentCoord;
        else previousValue = callback(previousValue, currentCoord, coordIndex, featureIndex, featureSubIndex);
    }, excludeWrapCoord);
    return previousValue;
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


function geomEach(geojson, callback) {
    var i, j, g, geometry, stopG,
        geometryMaybeCollection,
        isGeometryCollection,
        geometryProperties,
        featureIndex = 0,
        isFeatureCollection = geojson.type === 'FeatureCollection',
        isFeature = geojson.type === 'Feature',
        stop = isFeatureCollection ? geojson.features.length : 1;
    for (i = 0; i < stop; i++) {
        geometryMaybeCollection = (isFeatureCollection ? geojson.features[i].geometry :
            (isFeature ? geojson.geometry : geojson));
        geometryProperties = (isFeatureCollection ? geojson.features[i].properties :
            (isFeature ? geojson.properties : {}));
        isGeometryCollection = (geometryMaybeCollection) ? geometryMaybeCollection.type === 'GeometryCollection' : false;
        stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;
        for (g = 0; g < stopG; g++) {
            geometry = isGeometryCollection ?
                geometryMaybeCollection.geometries[g] : geometryMaybeCollection;
            if (geometry === null) {
                callback(null, featureIndex, geometryProperties);
                continue;
            }
            switch (geometry.type) {
            case 'Point':
            case 'LineString':
            case 'MultiPoint':
            case 'Polygon':
            case 'MultiLineString':
            case 'MultiPolygon': {
                callback(geometry, featureIndex, geometryProperties);
                break;
            }
            case 'GeometryCollection': {
                for (j = 0; j < geometry.geometries.length; j++) {
                    callback(geometry.geometries[j], featureIndex, geometryProperties);
                }
                break;
            }
            default:
                throw new Error('Unknown Geometry Type');
            }
        }
        featureIndex++;
    }
}

function flattenEach(geojson, callback) {
    geomEach(geojson, function (geometry, featureIndex, properties) {
        var type = (geometry === null) ? null : geometry.type;
        switch (type) {
        case null:
        case 'Point':
        case 'LineString':
        case 'Polygon':
            callback(feature(geometry, properties), featureIndex, 0);
            return;
        }
        var geomType;
        switch (type) {
        case 'MultiPoint':
            geomType = 'Point';
            break;
        case 'MultiLineString':
            geomType = 'LineString';
            break;
        case 'MultiPolygon':
            geomType = 'Polygon';
            break;
        }
        geometry.coordinates.forEach(function (coordinate, featureSubIndex) {
            var geom = {
                type: geomType,
                coordinates: coordinate
            };
            callback(feature(geom, properties), featureIndex, featureSubIndex);
        });
    });
}

function segmentEach(geojson, callback) {
    flattenEach(geojson, function (feature, featureIndex, featureSubIndex) {
        var segmentIndex = 0;
        if (!feature.geometry) return;
        var type = feature.geometry.type;
        if (type === 'Point' || type === 'MultiPoint') return;
        coordReduce(feature, function (previousCoords, currentCoord) {
            var currentSegment = lineString([previousCoords, currentCoord], feature.properties);
            callback(currentSegment, featureIndex, featureSubIndex, segmentIndex);
            segmentIndex++;
            return currentCoord;
        });
    });
}
function segmentReduce(geojson, callback, initialValue) {
    var previousValue = initialValue;
    var started = false;
    segmentEach(geojson, function (currentSegment, featureIndex, featureSubIndex, segmentIndex) {
        if (started === false && initialValue === undefined) previousValue = currentSegment;
        else previousValue = callback(previousValue, currentSegment, featureIndex, featureSubIndex, segmentIndex);
        started = true;
    });
    return previousValue;
}
function feature(geometry, properties) {
    if (geometry === undefined) throw new Error('No geometry passed');
    return {
        type: 'Feature',
        properties: properties || {},
        geometry: geometry
    };
}
function lineString(coordinates, properties) {
    if (!coordinates) throw new Error('No coordinates passed');
    if (coordinates.length < 2) throw new Error('Coordinates must be an array of two or more positions');
    return {
        type: 'Feature',
        properties: properties || {},
        geometry: {
            type: 'LineString',
            coordinates: coordinates
        }
    };
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

function createValidationLayers (map$$1) {
  const validationLayers = L.featureGroup();
  validationLayers.addTo(map$$1);
  return validationLayers
}

function getCoord(obj) {
    if (!obj) throw new Error('obj is required');
    var coordinates = getCoords(obj);
    if (coordinates.length > 1 &&
        typeof coordinates[0] === 'number' &&
        typeof coordinates[1] === 'number') {
        return coordinates;
    } else {
        throw new Error('Coordinate is not a valid Point');
    }
}
function getCoords(obj) {
    if (!obj) throw new Error('obj is required');
    var coordinates;
    if (obj.length) {
        coordinates = obj;
    } else if (obj.coordinates) {
        coordinates = obj.coordinates;
    } else if (obj.geometry && obj.geometry.coordinates) {
        coordinates = obj.geometry.coordinates;
    }
    if (coordinates) {
        containsNumber(coordinates);
        return coordinates;
    }
    throw new Error('No valid coordinates');
}
function containsNumber(coordinates) {
    if (coordinates.length > 1 &&
        typeof coordinates[0] === 'number' &&
        typeof coordinates[1] === 'number') {
        return true;
    }
    if (Array.isArray(coordinates[0]) && coordinates[0].length) {
        return containsNumber(coordinates[0]);
    }
    throw new Error('coordinates must only contain numbers');
}

function featureOf(feature, type, name) {
    if (!feature) throw new Error('No feature passed');
    if (!name) throw new Error('.featureOf() requires a name');
    if (!feature || feature.type !== 'Feature' || !feature.geometry) {
        throw new Error('Invalid input to ' + name + ', Feature with geometry required');
    }
    if (!feature.geometry || feature.geometry.type !== type) {
        throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + feature.geometry.type);
    }
}



function getType(geojson, name) {
    if (!geojson) throw new Error((name || 'geojson') + ' is required');
    if (geojson.geometry && geojson.geometry.type) return geojson.geometry.type;
    if (geojson.type) return geojson.type;
    throw new Error((name || 'geojson') + ' is invalid');
}

function feature$1(geometry, properties, bbox, id) {
    if (geometry === undefined) throw new Error('geometry is required');
    if (properties && properties.constructor !== Object) throw new Error('properties must be an Object');
    if (bbox && bbox.length !== 4) throw new Error('bbox must be an Array of 4 numbers');
    if (id && ['string', 'number'].indexOf(typeof id) === -1) throw new Error('id must be a number or a string');
    var feat = {type: 'Feature'};
    if (id) feat.id = id;
    if (bbox) feat.bbox = bbox;
    feat.properties = properties || {};
    feat.geometry = geometry;
    return feat;
}

function point(coordinates, properties, bbox, id) {
    if (!coordinates) throw new Error('No coordinates passed');
    if (coordinates.length === undefined) throw new Error('Coordinates must be an array');
    if (coordinates.length < 2) throw new Error('Coordinates must be at least 2 numbers long');
    if (!isNumber(coordinates[0]) || !isNumber(coordinates[1])) throw new Error('Coordinates must contain numbers');
    return feature$1({
        type: 'Point',
        coordinates: coordinates
    }, properties, bbox, id);
}
function polygon(coordinates, properties, bbox, id) {
    if (!coordinates) throw new Error('No coordinates passed');
    for (var i = 0; i < coordinates.length; i++) {
        var ring = coordinates[i];
        if (ring.length < 4) {
            throw new Error('Each LinearRing of a Polygon must have 4 or more Positions.');
        }
        for (var j = 0; j < ring[ring.length - 1].length; j++) {
            if (i === 0 && j === 0 && !isNumber(ring[0][0]) || !isNumber(ring[0][1])) throw new Error('Coordinates must contain numbers');
            if (ring[ring.length - 1][j] !== ring[0][j]) {
                throw new Error('First and last Position are not equivalent.');
            }
        }
    }
    return feature$1({
        type: 'Polygon',
        coordinates: coordinates
    }, properties, bbox, id);
}
function lineString$1(coordinates, properties, bbox, id) {
    if (!coordinates) throw new Error('No coordinates passed');
    if (coordinates.length < 2) throw new Error('Coordinates must be an array of two or more positions');
    if (!isNumber(coordinates[0][1]) || !isNumber(coordinates[0][1])) throw new Error('Coordinates must contain numbers');
    return feature$1({
        type: 'LineString',
        coordinates: coordinates
    }, properties, bbox, id);
}
function featureCollection(features, bbox, id) {
    if (!features) throw new Error('No features passed');
    if (!Array.isArray(features)) throw new Error('features must be an Array');
    if (bbox && bbox.length !== 4) throw new Error('bbox must be an Array of 4 numbers');
    if (id && ['string', 'number'].indexOf(typeof id) === -1) throw new Error('id must be a number or a string');
    var fc = {type: 'FeatureCollection'};
    if (id) fc.id = id;
    if (bbox) fc.bbox = bbox;
    fc.features = features;
    return fc;
}
function multiLineString(coordinates, properties, bbox, id) {
    if (!coordinates) throw new Error('No coordinates passed');
    return feature$1({
        type: 'MultiLineString',
        coordinates: coordinates
    }, properties, bbox, id);
}



var factors = {
    miles: 3960,
    nauticalmiles: 3441.145,
    degrees: 57.2957795,
    radians: 1,
    inches: 250905600,
    yards: 6969600,
    meters: 6373000,
    metres: 6373000,
    centimeters: 6.373e+8,
    centimetres: 6.373e+8,
    kilometers: 6373,
    kilometres: 6373,
    feet: 20908792.65
};
function round(num, precision) {
    if (num === undefined || num === null || isNaN(num)) throw new Error('num is required');
    if (precision && !(precision >= 0)) throw new Error('precision must be a positive number');
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(num * multiplier) / multiplier;
}
function radiansToDistance(radians, units) {
    if (radians === undefined || radians === null) throw new Error('radians is required');
    if (units && typeof units !== 'string') throw new Error('units must be a string');
    var factor = factors[units || 'kilometers'];
    if (!factor) throw new Error(units + ' units is invalid');
    return radians * factor;
}
function distanceToRadians(distance, units) {
    if (distance === undefined || distance === null) throw new Error('distance is required');
    if (units && typeof units !== 'string') throw new Error('units must be a string');
    var factor = factors[units || 'kilometers'];
    if (!factor) throw new Error(units + ' units is invalid');
    return distance / factor;
}

function bearingToAngle(bearing) {
    if (bearing === null || bearing === undefined) throw new Error('bearing is required');
    var angle = bearing % 360;
    if (angle < 0) angle += 360;
    return angle;
}
function radians2degrees(radians) {
    if (radians === null || radians === undefined) throw new Error('radians is required');
    var degrees = radians % (2 * Math.PI);
    return degrees * 180 / Math.PI;
}
function degrees2radians(degrees) {
    if (degrees === null || degrees === undefined) throw new Error('degrees is required');
    var radians = degrees % 360;
    return radians * Math.PI / 180;
}
function convertDistance(distance, originalUnit, finalUnit) {
    if (distance === null || distance === undefined) throw new Error('distance is required');
    if (!(distance >= 0)) throw new Error('distance must be a positive number');
    var convertedDistance = radiansToDistance(distanceToRadians(distance, originalUnit), finalUnit || 'kilometers');
    return convertedDistance;
}

function isNumber(num) {
    return !isNaN(num) && num !== null && !Array.isArray(num);
}

var earthRadius = 6371008.8;

function findAngle (startPoint, midPoint, endPoint, options) {
  options = options || {};
  var precision = options.precision || 6;
  var A = getCoord(startPoint);
  var B = getCoord(midPoint);
  var C = getCoord(endPoint);
  var pi = 3.14159265;
  var AB = Math.sqrt(Math.pow(B[0] - A[0], 2) + Math.pow(B[1] - A[1], 2));
  var BC = Math.sqrt(Math.pow(B[0] - C[0], 2) + Math.pow(B[1] - C[1], 2));
  var AC = Math.sqrt(Math.pow(C[0] - A[0], 2) + Math.pow(C[1] - A[1], 2));
  var angle = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB)) * (180 / pi);
  return round(angle, precision)
}

function impossibleAngle (lines, options) {
  options = options || {};
  var threshold = (options.threshold !== undefined) ? options.threshold : 10;
  if (!lines) throw new Error('line is required')
  var isImpossible = false;
  segmentReduce(lines, function (previousSegment, currentSegment, featureIndex, featureSubIndex, segmentIndex) {
    var startPoint = getCoords(previousSegment)[0];
    var midPoint = getCoords(currentSegment)[0];
    var endPoint = getCoords(currentSegment)[1];
    var angle = findAngle(startPoint, midPoint, endPoint);
    if (angle < threshold) isImpossible = true;
    return currentSegment
  });
  return isImpossible
}

function bearing(start, end, options) {
    var final = (typeof options === 'object') ? options.final : options;
    if (final === true) return calculateFinalBearing(start, end);
    var degrees2radians = Math.PI / 180;
    var radians2degrees = 180 / Math.PI;
    var coordinates1 = getCoord(start);
    var coordinates2 = getCoord(end);
    var lon1 = degrees2radians * coordinates1[0];
    var lon2 = degrees2radians * coordinates2[0];
    var lat1 = degrees2radians * coordinates1[1];
    var lat2 = degrees2radians * coordinates2[1];
    var a = Math.sin(lon2 - lon1) * Math.cos(lat2);
    var b = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    var bear = radians2degrees * Math.atan2(a, b);
    return bear;
}
function calculateFinalBearing(start, end) {
    var bear = bearing(end, start);
    bear = (bear + 180) % 360;
    return bear;
}

function distance(from, to, options) {
    var units = (typeof options === 'object') ? options.units : options;
    var degrees2radians$$1 = Math.PI / 180;
    var coordinates1 = getCoord(from);
    var coordinates2 = getCoord(to);
    var dLat = degrees2radians$$1 * (coordinates2[1] - coordinates1[1]);
    var dLon = degrees2radians$$1 * (coordinates2[0] - coordinates1[0]);
    var lat1 = degrees2radians$$1 * coordinates1[1];
    var lat2 = degrees2radians$$1 * coordinates2[1];
    var a = Math.pow(Math.sin(dLat / 2), 2) +
          Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
    return radiansToDistance(2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), units);
}

function destination(origin, distance, bearing, options) {
    var units = (typeof options === 'object') ? options.units : options;
    var degrees2radians$$1 = Math.PI / 180;
    var radians2degrees$$1 = 180 / Math.PI;
    var coordinates1 = getCoord(origin);
    var longitude1 = degrees2radians$$1 * coordinates1[0];
    var latitude1 = degrees2radians$$1 * coordinates1[1];
    var bearing_rad = degrees2radians$$1 * bearing;
    var radians = distanceToRadians(distance, units);
    var latitude2 = Math.asin(Math.sin(latitude1) * Math.cos(radians) +
        Math.cos(latitude1) * Math.sin(radians) * Math.cos(bearing_rad));
    var longitude2 = longitude1 + Math.atan2(Math.sin(bearing_rad) * Math.sin(radians) * Math.cos(latitude1),
        Math.cos(radians) - Math.sin(latitude1) * Math.sin(latitude2));
    return point([radians2degrees$$1 * longitude2, radians2degrees$$1 * latitude2]);
}

var quickselect = function (arr, k, left, right, compare) {
    quickselect$1(arr, k, left || 0, right || (arr.length - 1), compare || defaultCompare);
};
function quickselect$1(arr, k, left, right, compare) {
    while (right > left) {
        if (right - left > 600) {
            var n = right - left + 1;
            var m = k - left + 1;
            var z = Math.log(n);
            var s = 0.5 * Math.exp(2 * z / 3);
            var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
            var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
            var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
            quickselect$1(arr, k, newLeft, newRight, compare);
        }
        var t = arr[k];
        var i = left;
        var j = right;
        swap(arr, left, k);
        if (compare(arr[right], t) > 0) swap(arr, left, right);
        while (i < j) {
            swap(arr, i, j);
            i++;
            j--;
            while (compare(arr[i], t) < 0) i++;
            while (compare(arr[j], t) > 0) j--;
        }
        if (compare(arr[left], t) === 0) swap(arr, left, j);
        else {
            j++;
            swap(arr, j, right);
        }
        if (j <= k) left = j + 1;
        if (k <= j) right = j - 1;
    }
}
function swap(arr, i, j) {
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
}
function defaultCompare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

function rbush(maxEntries, format) {
    if (!(this instanceof rbush)) return new rbush(maxEntries, format);
    this._maxEntries = Math.max(4, maxEntries || 9);
    this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));
    if (format) {
        this._initFormat(format);
    }
    this.clear();
}
rbush.prototype = {
    all: function () {
        return this._all(this.data, []);
    },
    search: function (bbox) {
        var node = this.data,
            result = [],
            toBBox = this.toBBox;
        if (!intersects$1(bbox, node)) return result;
        var nodesToSearch = [],
            i, len, child, childBBox;
        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {
                child = node.children[i];
                childBBox = node.leaf ? toBBox(child) : child;
                if (intersects$1(bbox, childBBox)) {
                    if (node.leaf) result.push(child);
                    else if (contains(bbox, childBBox)) this._all(child, result);
                    else nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }
        return result;
    },
    collides: function (bbox) {
        var node = this.data,
            toBBox = this.toBBox;
        if (!intersects$1(bbox, node)) return false;
        var nodesToSearch = [],
            i, len, child, childBBox;
        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {
                child = node.children[i];
                childBBox = node.leaf ? toBBox(child) : child;
                if (intersects$1(bbox, childBBox)) {
                    if (node.leaf || contains(bbox, childBBox)) return true;
                    nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }
        return false;
    },
    load: function (data) {
        if (!(data && data.length)) return this;
        if (data.length < this._minEntries) {
            for (var i = 0, len = data.length; i < len; i++) {
                this.insert(data[i]);
            }
            return this;
        }
        var node = this._build(data.slice(), 0, data.length - 1, 0);
        if (!this.data.children.length) {
            this.data = node;
        } else if (this.data.height === node.height) {
            this._splitRoot(this.data, node);
        } else {
            if (this.data.height < node.height) {
                var tmpNode = this.data;
                this.data = node;
                node = tmpNode;
            }
            this._insert(node, this.data.height - node.height - 1, true);
        }
        return this;
    },
    insert: function (item) {
        if (item) this._insert(item, this.data.height - 1);
        return this;
    },
    clear: function () {
        this.data = createNode([]);
        return this;
    },
    remove: function (item, equalsFn) {
        if (!item) return this;
        var node = this.data,
            bbox = this.toBBox(item),
            path = [],
            indexes = [],
            i, parent, index, goingUp;
        while (node || path.length) {
            if (!node) {
                node = path.pop();
                parent = path[path.length - 1];
                i = indexes.pop();
                goingUp = true;
            }
            if (node.leaf) {
                index = findItem(item, node.children, equalsFn);
                if (index !== -1) {
                    node.children.splice(index, 1);
                    path.push(node);
                    this._condense(path);
                    return this;
                }
            }
            if (!goingUp && !node.leaf && contains(node, bbox)) {
                path.push(node);
                indexes.push(i);
                i = 0;
                parent = node;
                node = node.children[0];
            } else if (parent) {
                i++;
                node = parent.children[i];
                goingUp = false;
            } else node = null;
        }
        return this;
    },
    toBBox: function (item) { return item; },
    compareMinX: compareNodeMinX,
    compareMinY: compareNodeMinY,
    toJSON: function () { return this.data; },
    fromJSON: function (data) {
        this.data = data;
        return this;
    },
    _all: function (node, result) {
        var nodesToSearch = [];
        while (node) {
            if (node.leaf) result.push.apply(result, node.children);
            else nodesToSearch.push.apply(nodesToSearch, node.children);
            node = nodesToSearch.pop();
        }
        return result;
    },
    _build: function (items, left, right, height) {
        var N = right - left + 1,
            M = this._maxEntries,
            node;
        if (N <= M) {
            node = createNode(items.slice(left, right + 1));
            calcBBox(node, this.toBBox);
            return node;
        }
        if (!height) {
            height = Math.ceil(Math.log(N) / Math.log(M));
            M = Math.ceil(N / Math.pow(M, height - 1));
        }
        node = createNode([]);
        node.leaf = false;
        node.height = height;
        var N2 = Math.ceil(N / M),
            N1 = N2 * Math.ceil(Math.sqrt(M)),
            i, j, right2, right3;
        multiSelect(items, left, right, N1, this.compareMinX);
        for (i = left; i <= right; i += N1) {
            right2 = Math.min(i + N1 - 1, right);
            multiSelect(items, i, right2, N2, this.compareMinY);
            for (j = i; j <= right2; j += N2) {
                right3 = Math.min(j + N2 - 1, right2);
                node.children.push(this._build(items, j, right3, height - 1));
            }
        }
        calcBBox(node, this.toBBox);
        return node;
    },
    _chooseSubtree: function (bbox, node, level, path) {
        var i, len, child, targetNode, area, enlargement, minArea, minEnlargement;
        while (true) {
            path.push(node);
            if (node.leaf || path.length - 1 === level) break;
            minArea = minEnlargement = Infinity;
            for (i = 0, len = node.children.length; i < len; i++) {
                child = node.children[i];
                area = bboxArea(child);
                enlargement = enlargedArea(bbox, child) - area;
                if (enlargement < minEnlargement) {
                    minEnlargement = enlargement;
                    minArea = area < minArea ? area : minArea;
                    targetNode = child;
                } else if (enlargement === minEnlargement) {
                    if (area < minArea) {
                        minArea = area;
                        targetNode = child;
                    }
                }
            }
            node = targetNode || node.children[0];
        }
        return node;
    },
    _insert: function (item, level, isNode) {
        var toBBox = this.toBBox,
            bbox = isNode ? item : toBBox(item),
            insertPath = [];
        var node = this._chooseSubtree(bbox, this.data, level, insertPath);
        node.children.push(item);
        extend(node, bbox);
        while (level >= 0) {
            if (insertPath[level].children.length > this._maxEntries) {
                this._split(insertPath, level);
                level--;
            } else break;
        }
        this._adjustParentBBoxes(bbox, insertPath, level);
    },
    _split: function (insertPath, level) {
        var node = insertPath[level],
            M = node.children.length,
            m = this._minEntries;
        this._chooseSplitAxis(node, m, M);
        var splitIndex = this._chooseSplitIndex(node, m, M);
        var newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
        newNode.height = node.height;
        newNode.leaf = node.leaf;
        calcBBox(node, this.toBBox);
        calcBBox(newNode, this.toBBox);
        if (level) insertPath[level - 1].children.push(newNode);
        else this._splitRoot(node, newNode);
    },
    _splitRoot: function (node, newNode) {
        this.data = createNode([node, newNode]);
        this.data.height = node.height + 1;
        this.data.leaf = false;
        calcBBox(this.data, this.toBBox);
    },
    _chooseSplitIndex: function (node, m, M) {
        var i, bbox1, bbox2, overlap, area, minOverlap, minArea, index;
        minOverlap = minArea = Infinity;
        for (i = m; i <= M - m; i++) {
            bbox1 = distBBox(node, 0, i, this.toBBox);
            bbox2 = distBBox(node, i, M, this.toBBox);
            overlap = intersectionArea(bbox1, bbox2);
            area = bboxArea(bbox1) + bboxArea(bbox2);
            if (overlap < minOverlap) {
                minOverlap = overlap;
                index = i;
                minArea = area < minArea ? area : minArea;
            } else if (overlap === minOverlap) {
                if (area < minArea) {
                    minArea = area;
                    index = i;
                }
            }
        }
        return index;
    },
    _chooseSplitAxis: function (node, m, M) {
        var compareMinX = node.leaf ? this.compareMinX : compareNodeMinX,
            compareMinY = node.leaf ? this.compareMinY : compareNodeMinY,
            xMargin = this._allDistMargin(node, m, M, compareMinX),
            yMargin = this._allDistMargin(node, m, M, compareMinY);
        if (xMargin < yMargin) node.children.sort(compareMinX);
    },
    _allDistMargin: function (node, m, M, compare) {
        node.children.sort(compare);
        var toBBox = this.toBBox,
            leftBBox = distBBox(node, 0, m, toBBox),
            rightBBox = distBBox(node, M - m, M, toBBox),
            margin = bboxMargin(leftBBox) + bboxMargin(rightBBox),
            i, child;
        for (i = m; i < M - m; i++) {
            child = node.children[i];
            extend(leftBBox, node.leaf ? toBBox(child) : child);
            margin += bboxMargin(leftBBox);
        }
        for (i = M - m - 1; i >= m; i--) {
            child = node.children[i];
            extend(rightBBox, node.leaf ? toBBox(child) : child);
            margin += bboxMargin(rightBBox);
        }
        return margin;
    },
    _adjustParentBBoxes: function (bbox, path, level) {
        for (var i = level; i >= 0; i--) {
            extend(path[i], bbox);
        }
    },
    _condense: function (path) {
        for (var i = path.length - 1, siblings; i >= 0; i--) {
            if (path[i].children.length === 0) {
                if (i > 0) {
                    siblings = path[i - 1].children;
                    siblings.splice(siblings.indexOf(path[i]), 1);
                } else this.clear();
            } else calcBBox(path[i], this.toBBox);
        }
    },
    _initFormat: function (format) {
        var compareArr = ['return a', ' - b', ';'];
        this.compareMinX = new Function('a', 'b', compareArr.join(format[0]));
        this.compareMinY = new Function('a', 'b', compareArr.join(format[1]));
        this.toBBox = new Function('a',
            'return {minX: a' + format[0] +
            ', minY: a' + format[1] +
            ', maxX: a' + format[2] +
            ', maxY: a' + format[3] + '};');
    }
};
function findItem(item, items, equalsFn) {
    if (!equalsFn) return items.indexOf(item);
    for (var i = 0; i < items.length; i++) {
        if (equalsFn(item, items[i])) return i;
    }
    return -1;
}
function calcBBox(node, toBBox) {
    distBBox(node, 0, node.children.length, toBBox, node);
}
function distBBox(node, k, p, toBBox, destNode) {
    if (!destNode) destNode = createNode(null);
    destNode.minX = Infinity;
    destNode.minY = Infinity;
    destNode.maxX = -Infinity;
    destNode.maxY = -Infinity;
    for (var i = k, child; i < p; i++) {
        child = node.children[i];
        extend(destNode, node.leaf ? toBBox(child) : child);
    }
    return destNode;
}
function extend(a, b) {
    a.minX = Math.min(a.minX, b.minX);
    a.minY = Math.min(a.minY, b.minY);
    a.maxX = Math.max(a.maxX, b.maxX);
    a.maxY = Math.max(a.maxY, b.maxY);
    return a;
}
function compareNodeMinX(a, b) { return a.minX - b.minX; }
function compareNodeMinY(a, b) { return a.minY - b.minY; }
function bboxArea(a)   { return (a.maxX - a.minX) * (a.maxY - a.minY); }
function bboxMargin(a) { return (a.maxX - a.minX) + (a.maxY - a.minY); }
function enlargedArea(a, b) {
    return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) *
           (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY));
}
function intersectionArea(a, b) {
    var minX = Math.max(a.minX, b.minX),
        minY = Math.max(a.minY, b.minY),
        maxX = Math.min(a.maxX, b.maxX),
        maxY = Math.min(a.maxY, b.maxY);
    return Math.max(0, maxX - minX) *
           Math.max(0, maxY - minY);
}
function contains(a, b) {
    return a.minX <= b.minX &&
           a.minY <= b.minY &&
           b.maxX <= a.maxX &&
           b.maxY <= a.maxY;
}
function intersects$1(a, b) {
    return b.minX <= a.maxX &&
           b.minY <= a.maxY &&
           b.maxX >= a.minX &&
           b.maxY >= a.minY;
}
function createNode(children) {
    return {
        children: children,
        height: 1,
        leaf: true,
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
    };
}
function multiSelect(arr, left, right, n, compare) {
    var stack = [left, right],
        mid;
    while (stack.length) {
        right = stack.pop();
        left = stack.pop();
        if (right - left <= n) continue;
        mid = left + Math.ceil((right - left) / n / 2) * n;
        quickselect(arr, mid, left, right, compare);
        stack.push(left, mid, mid, right);
    }
}

function geojsonRbush(maxEntries) {
    var tree = rbush(maxEntries);
    tree.insert = function (feature) {
        if (Array.isArray(feature)) {
            var bbox = feature;
            feature = bboxPolygon(bbox);
            feature.bbox = bbox;
        } else {
            feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
        }
        return rbush.prototype.insert.call(this, feature);
    };
    tree.load = function (features) {
        var load = [];
        if (Array.isArray(features)) {
            features.forEach(function (bbox) {
                var feature = bboxPolygon(bbox);
                feature.bbox = bbox;
                load.push(feature);
            });
        } else {
            featureEach(features, function (feature) {
                feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
                load.push(feature);
            });
        }
        return rbush.prototype.load.call(this, load);
    };
    tree.remove = function (feature) {
        if (Array.isArray(feature)) {
            var bbox = feature;
            feature = bboxPolygon(bbox);
            feature.bbox = bbox;
        }
        return rbush.prototype.remove.call(this, feature);
    };
    tree.clear = function () {
        return rbush.prototype.clear.call(this);
    };
    tree.search = function (geojson) {
        var features = rbush.prototype.search.call(this, this.toBBox(geojson));
        return {
            type: 'FeatureCollection',
            features: features
        };
    };
    tree.collides = function (geojson) {
        return rbush.prototype.collides.call(this, this.toBBox(geojson));
    };
    tree.all = function () {
        var features = rbush.prototype.all.call(this);
        return {
            type: 'FeatureCollection',
            features: features
        };
    };
    tree.toJSON = function () {
        return rbush.prototype.toJSON.call(this);
    };
    tree.fromJSON = function (json) {
        return rbush.prototype.fromJSON.call(this, json);
    };
    tree.toBBox = function (geojson) {
        var bbox;
        if (geojson.bbox) bbox = geojson.bbox;
        else if (Array.isArray(geojson) && geojson.length === 4) bbox = geojson;
        else bbox = turfBBox(geojson);
        return {
            minX: bbox[0],
            minY: bbox[1],
            maxX: bbox[2],
            maxY: bbox[3]
        };
    };
    return tree;
}
function bboxPolygon(bbox) {
    var lowLeft = [bbox[0], bbox[1]];
    var topLeft = [bbox[0], bbox[3]];
    var topRight = [bbox[2], bbox[3]];
    var lowRight = [bbox[2], bbox[1]];
    var coordinates = [[lowLeft, lowRight, topRight, topLeft, lowLeft]];
    return {
        type: 'Feature',
        bbox: bbox,
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: coordinates
        }
    };
}
function turfBBox(geojson) {
    var bbox = [Infinity, Infinity, -Infinity, -Infinity];
    coordEach(geojson, function (coord) {
        if (bbox[0] > coord[0]) bbox[0] = coord[0];
        if (bbox[1] > coord[1]) bbox[1] = coord[1];
        if (bbox[2] < coord[0]) bbox[2] = coord[0];
        if (bbox[3] < coord[1]) bbox[3] = coord[1];
    });
    return bbox;
}

function lineSegment(geojson) {
    if (!geojson) throw new Error('geojson is required');
    var results = [];
    flattenEach(geojson, function (feature) {
        lineSegmentFeature(feature, results);
    });
    return featureCollection(results);
}
function lineSegmentFeature(geojson, results) {
    var coords = [];
    var geometry$$1 = geojson.geometry;
    switch (geometry$$1.type) {
    case 'Polygon':
        coords = getCoords(geometry$$1);
        break;
    case 'LineString':
        coords = [getCoords(geometry$$1)];
    }
    coords.forEach(function (coord) {
        var segments = createSegments(coord, geojson.properties);
        segments.forEach(function (segment) {
            segment.id = results.length;
            results.push(segment);
        });
    });
}
function createSegments(coords, properties) {
    var segments = [];
    coords.reduce(function (previousCoords, currentCoords) {
        var segment = lineString$1([previousCoords, currentCoords], properties);
        segment.bbox = bbox(previousCoords, currentCoords);
        segments.push(segment);
        return currentCoords;
    });
    return segments;
}
function bbox(coords1, coords2) {
    var x1 = coords1[0];
    var y1 = coords1[1];
    var x2 = coords2[0];
    var y2 = coords2[1];
    var west = (x1 < x2) ? x1 : x2;
    var south = (y1 < y2) ? y1 : y2;
    var east = (x1 > x2) ? x1 : x2;
    var north = (y1 > y2) ? y1 : y2;
    return [west, south, east, north];
}

function lineIntersect(line1, line2) {
    var unique = {};
    var results = [];
    if (line1.type === 'LineString') line1 = feature$1(line1);
    if (line2.type === 'LineString') line2 = feature$1(line2);
    if (line1.type === 'Feature' &&
        line2.type === 'Feature' &&
        line1.geometry.type === 'LineString' &&
        line2.geometry.type === 'LineString' &&
        line1.geometry.coordinates.length === 2 &&
        line2.geometry.coordinates.length === 2) {
        var intersect = intersects(line1, line2);
        if (intersect) results.push(intersect);
        return featureCollection(results);
    }
    var tree = geojsonRbush();
    tree.load(lineSegment(line2));
    featureEach(lineSegment(line1), function (segment) {
        featureEach(tree.search(segment), function (match) {
            var intersect = intersects(segment, match);
            if (intersect) {
                var key = getCoords(intersect).join(',');
                if (!unique[key]) {
                    unique[key] = true;
                    results.push(intersect);
                }
            }
        });
    });
    return featureCollection(results);
}
function intersects(line1, line2) {
    var coords1 = getCoords(line1);
    var coords2 = getCoords(line2);
    if (coords1.length !== 2) {
        throw new Error('<intersects> line1 must only contain 2 coordinates');
    }
    if (coords2.length !== 2) {
        throw new Error('<intersects> line2 must only contain 2 coordinates');
    }
    var x1 = coords1[0][0];
    var y1 = coords1[0][1];
    var x2 = coords1[1][0];
    var y2 = coords1[1][1];
    var x3 = coords2[0][0];
    var y3 = coords2[0][1];
    var x4 = coords2[1][0];
    var y4 = coords2[1][1];
    var denom = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
    var numeA = ((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3));
    var numeB = ((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3));
    if (denom === 0) {
        if (numeA === 0 && numeB === 0) {
            return null;
        }
        return null;
    }
    var uA = numeA / denom;
    var uB = numeB / denom;
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        var x = x1 + (uA * (x2 - x1));
        var y = y1 + (uA * (y2 - y1));
        return point([x, y]);
    }
    return null;
}

function pointOnLine(lines, pt, options) {
    var units = (typeof options === 'object') ? options.units : options;
    var type = (lines.geometry) ? lines.geometry.type : lines.type;
    if (type !== 'LineString' && type !== 'MultiLineString') {
        throw new Error('lines must be LineString or MultiLineString');
    }
    var closestPt = point([Infinity, Infinity], {
        dist: Infinity
    });
    var length = 0.0;
    flattenEach(lines, function (line) {
        var coords = getCoords(line);
        for (var i = 0; i < coords.length - 1; i++) {
            var start = point(coords[i]);
            start.properties.dist = distance(pt, start, units);
            var stop = point(coords[i + 1]);
            stop.properties.dist = distance(pt, stop, units);
            var sectionLength = distance(start, stop, units);
            var heightDistance = Math.max(start.properties.dist, stop.properties.dist);
            var direction = bearing(start, stop);
            var perpendicularPt1 = destination(pt, heightDistance, direction + 90, units);
            var perpendicularPt2 = destination(pt, heightDistance, direction - 90, units);
            var intersect = lineIntersect(lineString$1([perpendicularPt1.geometry.coordinates, perpendicularPt2.geometry.coordinates]), lineString$1([start.geometry.coordinates, stop.geometry.coordinates]));
            var intersectPt = null;
            if (intersect.features.length > 0) {
                intersectPt = intersect.features[0];
                intersectPt.properties.dist = distance(pt, intersectPt, units);
                intersectPt.properties.location = length + distance(start, intersectPt, units);
            }
            if (start.properties.dist < closestPt.properties.dist) {
                closestPt = start;
                closestPt.properties.index = i;
                closestPt.properties.location = length;
            }
            if (stop.properties.dist < closestPt.properties.dist) {
                closestPt = stop;
                closestPt.properties.index = i + 1;
                closestPt.properties.location = length + sectionLength;
            }
            if (intersectPt && intersectPt.properties.dist < closestPt.properties.dist) {
                closestPt = intersectPt;
                closestPt.properties.index = i;
            }
            length += sectionLength;
        }
    });
    return closestPt;
}

function rhumbBearing(start, end, options) {
    if (!start) throw new Error('start point is required');
    if (!end) throw new Error('end point is required');
    var final = (typeof options === 'object') ? options.final : options;
    var bear360;
    if (final) bear360 = calculateRhumbBearing(getCoord(end), getCoord(start));
    else bear360 = calculateRhumbBearing(getCoord(start), getCoord(end));
    var bear180 = (bear360 > 180) ? -(360 - bear360) : bear360;
    return bear180;
}
function calculateRhumbBearing(from, to) {
    var phi1 = degrees2radians(from[1]);
    var phi2 = degrees2radians(to[1]);
    var deltaLambda = degrees2radians((to[0] - from[0]));
    if (deltaLambda > Math.PI) deltaLambda -= 2 * Math.PI;
    if (deltaLambda < -Math.PI) deltaLambda += 2 * Math.PI;
    var deltaPsi = Math.log(Math.tan(phi2 / 2 + Math.PI / 4) / Math.tan(phi1 / 2 + Math.PI / 4));
    var theta = Math.atan2(deltaLambda, deltaPsi);
    return (radians2degrees(theta) + 360) % 360;
}

function rhumbDistance(from, to, options) {
    if (!from) throw new Error('from point is required');
    if (!to) throw new Error('to point is required');
    var units = (typeof options === 'object') ? options.units : options || 'kilometers';
    var origin = getCoord(from);
    var destination = getCoord(to);
    destination[0] += (destination[0] - origin[0] > 180) ? -360 : (origin[0] - destination[0] > 180) ? 360 : 0;
    var distanceInMeters = calculateRhumbDistance(origin, destination);
    var distance = convertDistance(distanceInMeters, 'meters', units);
    return distance;
}
function calculateRhumbDistance(origin, destination, radius) {
    radius = (radius === undefined) ? earthRadius : Number(radius);
    var R = radius;
    var phi1 = origin[1] * Math.PI / 180;
    var phi2 = destination[1] * Math.PI / 180;
    var DeltaPhi = phi2 - phi1;
    var DeltaLambda = Math.abs(destination[0] - origin[0]) * Math.PI / 180;
    if (DeltaLambda > Math.PI) DeltaLambda -= 2 * Math.PI;
    var DeltaPsi = Math.log(Math.tan(phi2 / 2 + Math.PI / 4) / Math.tan(phi1 / 2 + Math.PI / 4));
    var q = Math.abs(DeltaPsi) > 10e-12 ? DeltaPhi / DeltaPsi : Math.cos(phi1);
    var delta = Math.sqrt(DeltaPhi * DeltaPhi + q * q * DeltaLambda * DeltaLambda);
    var dist = delta * R;
    return dist;
}

function pointToLineDistance(pt, line, options) {
    options = options || {};
    if (typeof options !== 'object') throw new Error('options must be an object');
    if (!pt) throw new Error('pt is required');
    if (Array.isArray(pt)) pt = point(pt);
    else if (pt.type === 'Point') pt = feature$1(pt);
    else featureOf(pt, 'Point', 'point');
    if (!line) throw new Error('line is required');
    if (Array.isArray(line)) line = lineString$1(line);
    else if (line.type === 'LineString') line = feature$1(line);
    else featureOf(line, 'LineString', 'line');
    var distance$$1 = Infinity;
    var p = pt.geometry.coordinates;
    segmentEach(line, function (segment) {
        var a = segment.geometry.coordinates[0];
        var b = segment.geometry.coordinates[1];
        var d = distanceToSegment(p, a, b, options);
        if (distance$$1 > d) distance$$1 = d;
    });
    return distance$$1;
}
function distanceToSegment(p, a, b, options) {
    options = options || {};
    var units = options.units;
    var mercator = options.mercator;
    var distanceAP = (mercator !== true) ? distance(a, p, units) : euclideanDistance(a, p, units);
    var azimuthAP = bearingToAngle((mercator !== true) ? bearing(a, p) : rhumbBearing(a, p));
    var azimuthAB = bearingToAngle((mercator !== true) ? bearing(a, b) : rhumbBearing(a, b));
    var angleA = Math.abs(azimuthAP - azimuthAB);
    if (angleA > 90) return distanceAP;
    var azimuthBA = (azimuthAB + 180) % 360;
    var azimuthBP = bearingToAngle((mercator !== true) ? bearing(b, p) : rhumbBearing(b, p));
    var angleB = Math.abs(azimuthBP - azimuthBA);
    if (angleB > 180) angleB = Math.abs(angleB - 360);
    if (angleB > 90) return (mercator !== true) ? distance(p, b, units) : euclideanDistance(p, b, units);
    if (mercator !== true) return distanceAP * Math.sin(degrees2radians(angleA));
    return mercatorPH(a, b, p, units);
}
function mercatorPH(a, b, p, units) {
    var delta = 0;
    if (Math.abs(a[0]) >= 180 || Math.abs(b[0]) >= 180 || Math.abs(p[0]) >= 180) {
        delta = (a[0] > 0 || b[0] > 0 || p[0] > 0) ? -180 : 180;
    }
    var origin = point(p);
    var A = toMercator([a[0] + delta, a[1]]);
    var B = toMercator([b[0] + delta, b[1]]);
    var P = toMercator([p[0] + delta, p[1]]);
    var h = toWGS84(euclideanIntersection(A, B, P));
    if (delta !== 0) h[0] -= delta;
    var distancePH = rhumbDistance(origin, h, units);
    return distancePH;
}
function euclideanIntersection(a, b, p) {
    var x1 = a[0], y1 = a[1],
        x2 = b[0], y2 = b[1],
        x3 = p[0], y3 = p[1];
    var px = x2 - x1, py = y2 - y1;
    var dab = px * px + py * py;
    var u = ((x3 - x1) * px + (y3 - y1) * py) / dab;
    var x = x1 + u * px, y = y1 + u * py;
    return [x, y];
}
function euclideanDistance(from, to, units) {
    var delta = 0;
    if (Math.abs(from[0]) >= 180) {
        delta = (from[0] > 0) ? -180 : 180;
    }
    if (Math.abs(to[0]) >= 180) {
        delta = (to[0] > 0) ? -180 : 180;
    }
    var p1 = toMercator([from[0] + delta, from[1]]);
    var p2 = toMercator([to[0] + delta, to[1]]);
    var sqr = function (n) { return n * n; };
    var squareD = sqr(p1[0] - p2[0]) + sqr(p1[1] - p2[1]);
    var d = Math.sqrt(squareD);
    return convertDistance(d, 'meters', units);
}
function toMercator(lonLat) {
    var D2R = Math.PI / 180,
        A = 6378137.0,
        MAXEXTENT = 20037508.342789244;
    var xy = [
        A * lonLat[0] * D2R,
        A * Math.log(Math.tan((Math.PI * 0.25) + (0.5 * lonLat[1] * D2R)))
    ];
    if (xy[0] > MAXEXTENT) xy[0] = MAXEXTENT;
    if (xy[0] < -MAXEXTENT) xy[0] = -MAXEXTENT;
    if (xy[1] > MAXEXTENT) xy[1] = MAXEXTENT;
    if (xy[1] < -MAXEXTENT) xy[1] = -MAXEXTENT;
    return xy;
}
function toWGS84(xy) {
    var R2D = 180 / Math.PI,
        A = 6378137.0;
    return [
        (xy[0] * R2D / A),
        ((Math.PI * 0.5) - 2.0 * Math.atan(Math.exp(-xy[1] / A))) * R2D
    ];
}

function closestEndNodes (lines, options) {
  options = options || {};
  const maxDistance = (options.maxDistance !== undefined) ? options.maxDistance : 7.5;
  const units = (options.units !== undefined) ? options.units : 'meters';
  if (!lines) throw new Error('lines is required')
  const closestEndNodes = [];
  flattenEach(lines, function (line1, featureIndex1, featureSubIndex1) {
    if (getType(line1) !== 'LineString') return null
    const coords = getCoords(line1);
    const start = coords[0];
    const end = coords[coords.length - 1];
    flattenEach(lines, (line2, featureIndex2, featureSubIndex2) => {
      if (getType(line1) !== 'LineString') return null
      if (getType(line2) !== 'LineString') return null;
      [start, end].forEach(endNode => {
        if (featureIndex1 === featureIndex2) return null
        const distance = pointToLineDistance(endNode, line2, {units: units});
        if (distance !== 0 && maxDistance > distance) {
          const properties = {
            distance: distance,
            featureIndex: featureIndex1,
            closestFeatureIndex: featureIndex2,
            closestPoint: getCoords(pointOnLine(line2, endNode))
          };
          closestEndNodes.push(point(endNode, properties));
        }
      });
    });
  });
  return featureCollection(closestEndNodes)
}

function polygonToLinestring(polygon$$1, properties) {
    var geom = getType(polygon$$1);
    var coords = getCoords(polygon$$1);
    properties = properties || polygon$$1.properties || {};
    if (!coords.length) throw new Error('polygon must contain coordinates');
    switch (geom) {
    case 'Polygon':
        return coordsToLine(coords, properties);
    case 'MultiPolygon':
        var lines = [];
        coords.forEach(function (coord) {
            lines.push(coordsToLine(coord, properties));
        });
        return featureCollection(lines);
    default:
        throw new Error('geom ' + geom + ' not supported');
    }
}
function coordsToLine(coords, properties) {
    if (coords.length > 1) return multiLineString(coords, properties);
    return lineString$1(coords[0], properties);
}

function circle(center, radius, options) {
    options = options || {};
    var steps = options.steps || 64;
    var units = options.units;
    var properties = options.properties;
    if (!center) throw new Error('center is required');
    if (!radius) throw new Error('radius is required');
    if (typeof options !== 'object') throw new Error('options must be an object');
    if (typeof steps !== 'number') throw new Error('steps must be a number');
    steps = steps || 64;
    properties = properties || center.properties || {};
    var coordinates = [];
    for (var i = 0; i < steps; i++) {
        coordinates.push(destination(center, radius, i * 360 / steps, units).geometry.coordinates);
    }
    coordinates.push(coordinates[0]);
    return polygon([coordinates], properties);
}

var validate = function (map$$1, editableLayers, validationLayers) {
  map$$1.on(L.Draw.Event.EDITSTOP, validate);
  map$$1.on(L.Draw.Event.CREATED, validate);
  map$$1.on(L.Draw.Event.DELETESTOP, validate);
  validate();
  function validate () {
    const geojson = editableLayers.toGeoJSON();
    validationLayers.clearLayers();
    featureEach(geojson, (feature, featureIndex) => {
      if (getType(feature) !== 'LineString') return
      if (impossibleAngle(feature)) {
        L.geoJSON(feature.geometry, {
          style: {
            color: '#F00',
            weight: 15,
            opacity: 0.65
          }
        }).addTo(validationLayers);
      }
    });
    featureEach(geojson, (feature, featureIndex) => {
      if (getType(feature) === 'Polygon') {
        geojson.features[featureIndex] = polygonToLinestring(feature);
      }
    });
    const units = 'feet';
    const maxDistance = 100;
    featureEach(closestEndNodes(geojson, {units, maxDistance}), node => {
      const radius = node.properties.distance;
      L.geoJSON(circle(node, radius, {units}), {
        style: {
          color: '#F00',
          weight: 5,
          opacity: 0.65,
          fillOpacity: 0.65
        }
      }).addTo(validationLayers);
    });
  }
};

const map$1 = createMap();
const editableLayers = createEditableLayers(map$1);
const validationLayers = createValidationLayers(map$1);
createDrawControl(map$1, editableLayers);
addListeners(map$1);
validate(map$1, editableLayers, validationLayers);

})));
