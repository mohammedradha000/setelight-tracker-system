import * as satellite from 'satellite.js'
import { getCachedTLEs, setCachedTLEs } from '../utils/cache.js'
import { getSatellitePosition, latLonAltToVector3 } from '../utils/coordinates.js'
import { SatelliteRenderer } from './SatelliteRenderer.js'

const TLE_GROUPS = [
  { id: 'stations', label: 'Space Stations', color: 0x00ffff },
  { id: 'starlink', label: 'Starlink', color: 0x4488ff },
  { id: 'active', label: 'Active Satellites', color: 0xffffff },
  { id: 'weather', label: 'Weather', color: 0x88ff44 },
  { id: 'gps-ops', label: 'GPS', color: 0xffaa00 },
]

export class SatelliteManager {
  constructor(scene, globe) {
    this.scene = scene
    this.globe = globe
    this.satellites = []
    this.renderer = new SatelliteRenderer(scene)
    this.lastUpdateTime = 0
    this.batchSize = 500
    this.currentBatch = 0
  }

  async init() {
    console.log('SatelliteManager: Loading SATCAT and TLEs...')
    
    // Load metadata and TLEs in parallel
    const [rawData, catalog] = await Promise.all([
      this.fetchTLEGroup('active'),
      this.loadSatCatalog()
    ])

    this.satellites = this.parseTLEs(rawData)
    
    // Merge metadata
    if (catalog) {
      this.satellites.forEach(sat => {
        const meta = catalog[sat.noradId]
        if (meta) {
          sat.country = meta.country
          sat.launchDate = meta.launchDate
          sat.objectType = meta.objectType
        }
      })
    }
    
    this.renderer.init(this.satellites)
    this.updatePositions(new Date())
  }

  async loadSatCatalog() {
    try {
      const response = await fetch('/api/satcat')
      if (!response.ok) throw new Error(`SATCAT fetch failed: ${response.status}`)
      const text = await response.text()
      const lines = text.split('\n')
      const catalog = {}

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',')
        if (cols.length < 10) continue
        const noradId = parseInt(cols[1])
        catalog[noradId] = {
          name: cols[0].trim(),
          country: cols[6].trim(),
          launchDate: cols[9].trim(),
          objectType: cols[2].trim(), // 'PAY' = payload, 'R/B' = rocket body, 'DEB' = debris
        }
      }
      return catalog
    } catch (e) {
      console.warn('Failed to load SATCAT catalog:', e)
      return null
    }
  }

  async fetchTLEGroup(groupId) {
    // Check cache first
    const cached = getCachedTLEs(groupId)
    if (cached) {
      return cached
    }

    // Use local Vite proxy
    const url = `/api/tle?GROUP=${groupId}&FORMAT=tle`
    
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch TLEs for ${groupId}: ${response.status}`)

    const text = await response.text()
    setCachedTLEs(groupId, text)
    return text
  }

  parseTLEs(rawText) {
    const lines = rawText.trim().split('\n').map(l => l.trim()).filter(Boolean)
    const satellites = []

    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 >= lines.length) break

      const name = lines[i].replace(/^0 /, '').trim()
      const line1 = lines[i + 1]
      const line2 = lines[i + 2]

      if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) continue

      try {
        const satrec = satellite.twoline2satrec(line1, line2)
        const noradId = parseInt(line1.substring(2, 7).trim())

        satellites.push({
          name,
          noradId,
          satrec,
          line1,
          line2,
          lat: 0,
          lon: 0,
          alt: 0,
          position3D: null,
        })
      } catch (e) {
        console.warn(`Skipped malformed TLE: ${name}`)
      }
    }

    return satellites
  }

  update() {
    const now = Date.now()
    // Staggered updates as per Phase 10
    if (now - this.lastUpdateTime > 100) { // every 100ms
       this.updateBatch()
       this.lastUpdateTime = now
    }
    this.renderer.update()
  }

  updateBatch() {
    const date = new Date()
    const start = this.currentBatch * this.batchSize
    const end = Math.min(start + this.batchSize, this.satellites.length)

    for (let i = start; i < end; i++) {
      this.updateSatellitePosition(this.satellites[i], date)
    }

    this.currentBatch = (this.currentBatch + 1) % Math.ceil(this.satellites.length / this.batchSize)
  }

  updateSatellitePosition(sat, date) {
    const pos = getSatellitePosition(sat.satrec, date)

    if (!pos) {
      sat.position3D = null
      return
    }

    sat.lat = pos.lat
    sat.lon = pos.lon
    sat.alt = pos.altKm

    const v3 = latLonAltToVector3(pos.lat, pos.lon, pos.altKm)
    sat.position3D = v3
  }

  // legacy update for initial load
  updatePositions(date) {
    for (let i = 0; i < this.satellites.length; i++) {
        this.updateSatellitePosition(this.satellites[i], date)
    }
  }
}
