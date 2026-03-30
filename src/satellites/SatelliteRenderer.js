import * as THREE from 'three'
import { latLonAltToVector3 } from '../utils/coordinates.js'

export class SatelliteRenderer {
  constructor(scene, maxCount = 6000) {
    this.scene = scene
    this.maxCount = maxCount
    this.instancedMesh = null
    this.dummy = new THREE.Object3D()  // reusable transform object
    this.satellites = []               // reference to satellite data array
  }

  init(satellites) {
    this.satellites = satellites

    // Small sphere for each satellite dot
    // SphereGeometry is expensive — use a simple octahedron for low-poly dots
    const geo = new THREE.OctahedronGeometry(0.004, 0)  // tiny, 0 detail = 8 faces

    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      // No lighting calculation — MeshBasicMaterial is fastest
    })

    this.instancedMesh = new THREE.InstancedMesh(geo, mat, this.maxCount)
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    // DynamicDrawUsage tells GPU "this will change every frame" — huge perf boost

    // Set initial count to actual number of satellites
    this.instancedMesh.count = Math.min(satellites.length, this.maxCount)

    // Enable per-instance color (default to white)
    const colors = new Float32Array(this.maxCount * 3)
    for (let i = 0; i < this.maxCount; i++) {
        colors[i * 3] = 1.0     // R
        colors[i * 3 + 1] = 1.0 // G
        colors[i * 3 + 2] = 1.0 // B
    }
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3)

    this.scene.add(this.instancedMesh)
  }

  highlightSatellites(noradIds) {
    const highlighted = new Set(noradIds)
    for (let i = 0; i < this.satellites.length; i++) {
        const isHighlighted = highlighted.size === 0 || highlighted.has(this.satellites[i].noradId)
        const brightness = isHighlighted ? 1.0 : 0.1
        this.instancedMesh.setColorAt(i, new THREE.Color(brightness, brightness, brightness))
    }
    this.instancedMesh.instanceColor.needsUpdate = true
  }

  setSelectedSatellite(noradId) {
    for (let i = 0; i < this.satellites.length; i++) {
        if (noradId === null) {
            // Default: All White
            this.instancedMesh.setColorAt(i, new THREE.Color(1, 1, 1))
        } else if (this.satellites[i].noradId === noradId) {
            // Target: Red
            this.instancedMesh.setColorAt(i, new THREE.Color(1, 0, 0))
        } else {
            // Others: Dimmed Grey
            this.instancedMesh.setColorAt(i, new THREE.Color(0.2, 0.2, 0.2))
        }
    }
    this.instancedMesh.instanceColor.needsUpdate = true
  }

  // Call this every frame
  update() {
    if (!this.instancedMesh) return

    const now = new Date()
    const count = Math.min(this.satellites.length, this.maxCount)

    for (let i = 0; i < count; i++) {
      const sat = this.satellites[i]
      if (!sat.position3D) continue

      this.dummy.position.set(sat.position3D.x, sat.position3D.y, sat.position3D.z)
      this.dummy.updateMatrix()
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix)

      // Color by type (set once, not every frame — optimization)
      // This is shown here for clarity; in practice move color setting to init
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true  // CRITICAL: tells Three.js to re-upload to GPU
  }

  // Set individual satellite color (call during init, not every frame)
  setSatelliteColor(index, r, g, b) {
    this.instancedMesh.setColorAt(index, new THREE.Color(r, g, b))
    this.instancedMesh.instanceColor.needsUpdate = true
  }

  // Called from SatelliteManager for raycasting (click detection)
  getMesh() {
    return this.instancedMesh
  }
}
