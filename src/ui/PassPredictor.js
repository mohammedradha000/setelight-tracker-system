import { getSatellitePosition } from '../utils/coordinates.js'

export async function geocodeCity(cityName) {
  // Nominatim requires a User-Agent. In a real project, use your email.
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SatelliteTracker/1.0 (contact@example.com)'
    }
  })

  if (!response.ok) {
    throw new Error(`Geocoding service returned an error (Status: ${response.status}). Please try again later.`)
  }

  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Geocoding service returned an invalid format. The service might be temporarily down.')
  }

  const data = await response.json()
  if (!data || !data.length) throw new Error('City not found')

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    displayName: data[0].display_name
  }
}

export function initPassPredictor(satManager) {
  const cityInput = document.getElementById('city-input')
  const predictBtn = document.getElementById('predict-btn')
  const resultsTable = document.getElementById('passes-results')
  const resultsBody = document.getElementById('passes-body')

  // Use a worker for heavy lifting
  const worker = new Worker(new URL('../workers/passPredictor.worker.js', import.meta.url), { type: 'module' })

  predictBtn.addEventListener('click', async () => {
    const cityName = cityInput.value.trim()
    if (!cityName) return

    predictBtn.disabled = true
    predictBtn.textContent = 'SEARCHING...'

    try {
      const coords = await geocodeCity(cityName)
      console.log(`Found ${coords.displayName}: ${coords.lat}, ${coords.lon}`)
      
      predictBtn.textContent = 'CALCULATING...'
      
      // We need to send satrecs, but workers can't clone complex objects well.
      // We'll send the raw TLEs and names.
      const satData = satManager.satellites.map(s => ({
        name: s.name,
        noradId: s.noradId,
        line1: s.line1,
        line2: s.line2
      }))

      worker.postMessage({
        satellites: satData,
        lat: coords.lat,
        lon: coords.lon
      })

    } catch (e) {
      alert(`Error: ${e.message}`)
      predictBtn.disabled = false
      predictBtn.textContent = 'PREDICT'
    }
  })

  worker.onmessage = (e) => {
    const passes = e.data
    displayPasses(passes, resultsTable, resultsBody)
    predictBtn.disabled = false
    predictBtn.textContent = 'PREDICT'
  }
}

function displayPasses(passes, table, body) {
  body.innerHTML = ''
  if (passes.length === 0) {
    body.innerHTML = '<tr><td colspan="3">NO PASSES FOUND IN NEXT 24H</td></tr>'
  } else {
  passes.forEach(pass => {
    const row = document.createElement('tr')
    const time = new Date(pass.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    row.innerHTML = `
          <td title="${pass.satelliteName}">${pass.satelliteName.substring(0, 10)}...</td>
          <td>${time}</td>
          <td>${pass.maxElevation}°</td>
    `
    body.appendChild(row)
  })
  }
  table.classList.remove('hidden')
}
