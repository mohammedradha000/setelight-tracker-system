import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Globe } from './globe/Globe.js'
import { SatelliteManager } from './satellites/SatelliteManager.js'
import { showSatelliteInfo, initInfoPanel } from './ui/InfoPanel.js'
import { createOrbitTrail } from './satellites/OrbitTrail.js'
import { initPassPredictor } from './ui/PassPredictor.js'
import { SatelliteList } from './ui/SatelliteList.js'
import { getActiveBrandingLink } from './config.js'

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000005) // near-black space, NOT pure black

// Camera
const camera = new THREE.PerspectiveCamera(
  45,                                    // FOV — 45 feels natural for a globe
  window.innerWidth / window.innerHeight,
  0.1,                                   // near clip
  1000                                   // far clip
)
camera.position.set(0, 0, 2.8)  // Start a bit away from the globe (globe radius = 1)

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  logarithmicDepthBuffer: false
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // cap at 2x for performance
renderer.outputColorSpace = THREE.SRGBColorSpace
document.body.appendChild(renderer.domElement)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true       // smooth deceleration
controls.dampingFactor = 0.05
controls.minDistance = 1.05          // can't go inside the Earth
controls.maxDistance = 10           // can't zoom out to infinity
controls.autoRotate = true          // slowly spin when idle
controls.autoRotateSpeed = 0.3

// Stars background
const starsGeometry = new THREE.BufferGeometry()
const starsCount = 10000
const starsPositions = new Float32Array(starsCount * 3)
for (let i = 0; i < starsCount * 3; i++) {
  starsPositions[i] = (Math.random() - 0.5) * 500
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3))
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 })
const stars = new THREE.Points(starsGeometry, starsMaterial)
scene.add(stars)

// Component Instances
const globe = new Globe(scene, camera)
const satManager = new SatelliteManager(scene, globe)

// Selection & Tracking state
let selectedSatellite = null
let currentTrail = null

const satList = new SatelliteList(satManager, (sat) => {
    handleSelectSatellite(sat)
    satList.close() // Auto-close as requested
})

function handleSelectSatellite(sat) {
    selectedSatellite = sat
    satManager.renderer.setSelectedSatellite(sat.noradId)
    showSatelliteInfo(sat)

    // Orbit Trail (Red for tracking)
    if (currentTrail) {
        scene.remove(currentTrail)
        currentTrail.geometry.dispose()
        currentTrail.material.dispose()
    }
    const trail = createOrbitTrail(sat, 0xff0000) // Red trail for selected
    if (trail) {
        scene.add(trail)
        currentTrail = trail
    }

    // Stop auto-rotate when tracking
    controls.autoRotate = false
}

function handleDeselectSatellite() {
    selectedSatellite = null
    satManager.renderer.setSelectedSatellite(null)
    
    if (currentTrail) {
        scene.remove(currentTrail)
        currentTrail.geometry.dispose()
        currentTrail.material.dispose()
        currentTrail = null
    }

    satList.selectSatellite(null) // Reset sidebar selection
    controls.target.set(0, 0, 0)
    controls.autoRotate = true
}

// Global state for animation synchronization
let globeReady = false

// Animation loop - RE-STRUCTURED TO BE TOP-LEVEL AND FAIL-SAFE
function animate() {
  requestAnimationFrame(animate)
  
  if (selectedSatellite && selectedSatellite.position3D) {
      // Smoothly move controls target to satellite
      controls.target.lerp(selectedSatellite.position3D, 0.1)
  }

  controls.update()                  // required for damping
  
  // Safe updates: only run once components are initialized
  if (globeReady) {
      globe.update()
  }
  
  if (satManager && satManager.satellites && satManager.satellites.length > 0) {
      satManager.update()
  }

  renderer.render(scene, camera)
}

// Start the loop immediately. 
// Rendering will begin as soon as the scene is populated.
animate()

// Initialize background components without blocking the render loop
;(async () => {
    try {
        console.log('Main: Initializing Globe...')
        await globe.init()
        globeReady = true // Activate globe updates
        
        console.log('Main: Initializing Satellites...')
        try {
            await satManager.init()
            satList.setSatellites(satManager.satellites)
            
            const countEl = document.getElementById('sat-count')
            if (countEl) {
                countEl.textContent = `TRACKING ${satManager.satellites.length} SATELLITES`
            }
        } catch (satError) {
            console.error('Main: Satellites failed to load:', satError)
            const countEl = document.getElementById('sat-count')
            if (countEl) {
                countEl.textContent = 'SATELLITE DATA UNAVAILABLE'
                countEl.style.color = '#ffcc00'
            }
        }
        
        initInfoPanel(handleDeselectSatellite)
        initPassPredictor(satManager)
        
        // --- HUD Visibility & Branding Sync ---
        initHUDControls()

        console.log('Main: Initialization complete.')
    } catch (error) {
        console.error('Main: Fatal Initialization error:', error)
        const countEl = document.getElementById('sat-count')
        if (countEl) {
            countEl.textContent = `FATAL ERROR: ${error.message || 'Check console'}`
            countEl.style.color = '#ff4444'
        }
    }
})()

// Raycasting for clicks
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
raycaster.params.Points = { threshold: 0.05 } 

renderer.domElement.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const mesh = satManager.renderer.getMesh()
  if (!mesh) return 
  
  const intersects = raycaster.intersectObject(mesh)

  if (intersects.length > 0) {
    const instanceId = intersects[0].instanceId
    const sat = satManager.satellites[instanceId]
    handleSelectSatellite(sat)
    satList.selectSatellite(sat.noradId) // Sync with sidebar state
  }
})

// Search functionality
document.getElementById('search-input').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase()
  const results = satManager.satellites.filter(s => s.name.toLowerCase().includes(query))
  satManager.renderer.highlightSatellites(query ? results.map(s => s.noradId) : [])
})

// HUD UI Controls
function initHUDControls() {
    const toggleBtn = document.getElementById('toggle-hud')
    const branding = document.getElementById('branding')
    
    // Set dynamic branding link from Admin config
    if (branding) {
        branding.href = getActiveBrandingLink()
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('hud-hidden')
            
            // Interaction feedback
            toggleBtn.style.transform = "scale(0.9)"
            setTimeout(() => toggleBtn.style.transform = "", 150)
        })
    }
}

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
