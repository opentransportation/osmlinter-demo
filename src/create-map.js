import * as L from 'leaflet'

/**
 * Create map
 *
 * @returns {L.Map} Leaflet Map
 */
export default function createMap () {
  let zoom = localStorage.getItem('mapZoom') || 17
  let center = localStorage.getItem('mapCenter')
  if (center) center = JSON.parse(center)
  else center = [42.354142, -71.069776]

  const map = L.map('app').setView(center, zoom)

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    maxZoom: 20,
    id: 'mapbox.streets',
    attribution: 'Map data &copy <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    accessToken: 'pk.eyJ1IjoiYWRkeHkiLCJhIjoiY2lsdmt5NjZwMDFsdXZka3NzaGVrZDZtdCJ9.ZUE-LebQgHaBduVwL68IoQ'
  }).addTo(map)

  map.doubleClickZoom.disable()
  return map
}
