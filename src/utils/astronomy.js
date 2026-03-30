import * as satellite from 'satellite.js'

/**
 * Calculates the Sun's subsolar point (latitude and longitude) for a given date.
 * Based on the low-precision astronomical algorithm from the Astronomical Almanac.
 */
export function getSunSubsolarPoint(date = new Date()) {
  const j2000 = new Date('2000-01-01T12:00:00Z')
  const daysSinceJ2000 = (date - j2000) / (1000 * 60 * 60 * 24)

  // Mean anomaly of the Sun
  const g = (357.529 + 0.98560028 * daysSinceJ2000) * (Math.PI / 180)
  // Mean longitude of the Sun
  const q = (280.459 + 0.98564736 * daysSinceJ2000) * (Math.PI / 180)
  // Geocentric apparent ecliptic longitude
  const L = q + (1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * (Math.PI / 180)
  // Obliquity of the ecliptic
  const e = (23.439 - 0.00000036 * daysSinceJ2000) * (Math.PI / 180)

  // Right Ascension and Declination
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L))
  const dec = Math.asin(Math.sin(e) * Math.sin(L))

  // Greenwich Sidereal Time
  const gmst = satellite.gstime(date)

  // Subsolar Point
  // Lat = Declination
  // Lon = (RA - GMST)
  let lat = dec * (180 / Math.PI)
  let lon = (ra - gmst) * (180 / Math.PI)

  // Normalize longitude to [-180, 180]
  lon = ((lon + 180) % 360 + 360) % 360 - 180

  return { lat, lon }
}
