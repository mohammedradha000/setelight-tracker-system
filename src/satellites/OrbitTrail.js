import * as THREE from 'three'
import { getSatellitePosition, latLonAltToVector3 } from '../utils/coordinates.js'

export function createOrbitTrail(sat, color = 0x00ffff) {
    const points = []
    const satrec = sat.satrec
    
    // Calculate 1 full orbit (approx 100 minutes for LEO)
    // 50 points is enough for a smooth circle at this scale
    for (let i = 0; i <= 6000; i += 120) { // every 2 mins for 100 mins
        const date = new Date(Date.now() + i * 1000)
        const pos = getSatellitePosition(satrec, date)
        if (pos) {
            points.push(latLonAltToVector3(pos.lat, pos.lon, pos.altKm))
        }
    }

    if (points.length < 2) return null

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending, // makes it "glow"
    })

    return new THREE.Line(geometry, material)
}
