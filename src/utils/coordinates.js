import * as satellite from 'satellite.js'

// Convert lat/lon/altitude to Three.js 3D vector
// altitude is in km; Earth radius = 6371km; our globe radius = 1.0
// So scale factor = 1.0 / 6371
export function latLonAltToVector3(lat, lon, altKm, globeRadius = 1.0) {
  const EARTH_RADIUS_KM = 6371
  const r = globeRadius + (altKm / EARTH_RADIUS_KM)

  // Convert to radians
  const phi = (90 - lat) * (Math.PI / 180)    // polar angle from Y axis
  const theta = (lon + 180) * (Math.PI / 180)  // azimuthal angle from +Z axis

  return {
    x: -r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta),
  }
}

// Calculate position of one satellite at a given time
// Returns null if satellite has decayed or TLE is too old
export function getSatellitePosition(satrec, date = new Date()) {
  const posVel = satellite.propagate(satrec, date)

  // propagate returns false if the satellite has decayed
  if (!posVel || !posVel.position || posVel.position === false) return null

  // Convert ECI (Earth-Centered Inertial) to geographic
  const gmst = satellite.gstime(date)
  const geographic = satellite.eciToGeodetic(posVel.position, gmst)

  const lat = satellite.degreesLat(geographic.latitude)
  const lon = satellite.degreesLong(geographic.longitude)
  const altKm = geographic.height  // in km

  // Sanity check — some decaying satellites give crazy values
  if (Math.abs(lat) > 90 || altKm < 0 || altKm > 50000) return null

  return { lat, lon, altKm }
}

// Calculate satellite speed from velocity vector
export function getSatelliteSpeed(satrec, date = new Date()) {
  const posVel = satellite.propagate(satrec, date)
  if (!posVel || !posVel.velocity) return 0

  const { x, y, z } = posVel.velocity
  return Math.sqrt(x * x + y * y + z * z)  // km/s
}
