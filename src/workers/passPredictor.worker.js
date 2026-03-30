import * as satellite from 'satellite.js'

function getSatellitePosition(satrec, date) {
  const posVel = satellite.propagate(satrec, date)
  if (!posVel || !posVel.position || posVel.position === false) return null

  const gmst = satellite.gstime(date)
  const geographic = satellite.eciToGeodetic(posVel.position, gmst)

  return {
    lat: satellite.degreesLat(geographic.latitude),
    lon: satellite.degreesLong(geographic.longitude),
    altKm: geographic.height
  }
}

function getElevation(observerLat, observerLon, satLat, satLon, satAltKm) {
  const EARTH_RADIUS = 6371
  const obsLatR = observerLat * Math.PI / 180
  const obsLonR = observerLon * Math.PI / 180
  const satLatR = satLat * Math.PI / 180
  const satLonR = satLon * Math.PI / 180

  const obsX = EARTH_RADIUS * Math.cos(obsLatR) * Math.cos(obsLonR)
  const obsY = EARTH_RADIUS * Math.cos(obsLatR) * Math.sin(obsLonR)
  const obsZ = EARTH_RADIUS * Math.sin(obsLatR)

  const satR = EARTH_RADIUS + satAltKm
  const satX = satR * Math.cos(satLatR) * Math.cos(satLonR)
  const satY = satR * Math.cos(satLatR) * Math.sin(satLonR)
  const satZ = satR * Math.sin(satLatR)

  const dx = satX - obsX; const dy = satY - obsY; const dz = satZ - obsZ
  const upX = Math.cos(obsLatR) * Math.cos(obsLonR)
  const upY = Math.cos(obsLatR) * Math.sin(obsLonR)
  const upZ = Math.sin(obsLatR)

  const dot = dx * upX + dy * upY + dz * upZ
  const magSat = Math.sqrt(dx*dx + dy*dy + dz*dz)
  return Math.asin(dot / magSat) * 180 / Math.PI
}

async function predictPasses(satellites, observerLat, observerLon, hoursAhead = 24) {
  const passes = []
  const stepSeconds = 60
  const totalSteps = (hoursAhead * 3600) / stepSeconds
  const now = Date.now()

  // Iterate over raw satellite data (line1, line2)
  for (const satData of satellites) {
    try {
      const satrec = satellite.twoline2satrec(satData.line1, satData.line2)
      
      let inPass = false
      let passStart = null
      let maxElevation = 0

      for (let step = 0; step < totalSteps; step++) {
        const time = new Date(now + step * stepSeconds * 1000)
        const pos = getSatellitePosition(satrec, time)
        if (!pos) continue

        const elevation = getElevation(observerLat, observerLon, pos.lat, pos.lon, pos.altKm)

        if (elevation > 10) {
          if (!inPass) {
            inPass = true
            passStart = time
            maxElevation = elevation
          } else {
            maxElevation = Math.max(maxElevation, elevation)
          }
        } else if (inPass) {
          passes.push({
            satelliteName: satData.name,
            noradId: satData.noradId,
            startTime: passStart,
            endTime: time,
            maxElevation: maxElevation.toFixed(1),
            duration: Math.round((time - passStart) / 1000),
          })
          inPass = false
          maxElevation = 0
        }
      }
    } catch (e) {
      continue
    }
  }

  return passes.sort((a, b) => a.startTime - b.startTime).slice(0, 20)
}

self.onmessage = async (e) => {
  const { satellites, lat, lon } = e.data
  const passes = await predictPasses(satellites, lat, lon)
  self.postMessage(passes)
}
