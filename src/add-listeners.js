/**
 * Add Listerners
 *
 * @param {L.Map} map Leaflet Map
 * @returns {L.Map}
 */
export default function addListeners (map) {
  map.on('moveend', () => {
    const zoom = map.getZoom()
    const center = map.getCenter()
    localStorage.setItem('mapCenter', JSON.stringify(center))
    localStorage.setItem('mapZoom', JSON.stringify(zoom))
  })
  return map
}
