// src/ui/InfoPanel.js
import { getSatelliteSpeed } from '../utils/coordinates.js'
import * as satellite from 'satellite.js'

export function showSatelliteInfo(sat) {
  document.getElementById('sat-name').textContent = sat.name
  document.getElementById('sat-norad').textContent = sat.noradId
  document.getElementById('sat-alt').textContent = `${Math.round(sat.alt)} km`
  document.getElementById('sat-lat').textContent = `${sat.lat.toFixed(2)}°`
  document.getElementById('sat-lon').textContent = `${sat.lon.toFixed(2)}°`

  const speedKmS = getSatelliteSpeed(sat.satrec)
  document.getElementById('sat-speed').textContent = `${speedKmS.toFixed(2)} km/s`

  // Inclination is stored in the satrec object
  const incDeg = (sat.satrec.inclo * 180 / Math.PI).toFixed(1)
  document.getElementById('sat-inc').textContent = `${incDeg}°`

  // New metadata fields from SATCAT
  document.getElementById('sat-country').textContent = sat.country || 'Unknown'
  document.getElementById('sat-launch').textContent = sat.launchDate || 'Unknown'
  
  let typeLabel = sat.objectType || 'Unknown'
  if (typeLabel === 'PAY') typeLabel = 'Payload'
  if (typeLabel === 'R/B') typeLabel = 'Rocket Body'
  if (typeLabel === 'DEB') typeLabel = 'Debris'
  document.getElementById('sat-type').textContent = typeLabel

  document.getElementById('info-panel').classList.remove('hidden')
}

// Button listener initialization
export function initInfoPanel(onHide) {
    document.getElementById('close-panel').addEventListener('click', () => {
        document.getElementById('info-panel').classList.add('hidden')
        if (onHide) onHide()
    })
}
