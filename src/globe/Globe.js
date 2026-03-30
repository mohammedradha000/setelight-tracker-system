import * as THREE from 'three'
import { latLonAltToVector3 } from '../utils/coordinates.js'
import { getSunSubsolarPoint } from '../utils/astronomy.js'

// Import textures for Bullet-Proof production handling
import dayMapUrl from '../assets/textures/earth_daymap.jpg'
import nightMapUrl from '../assets/textures/earth_nightmap.jpg'
import normalMapUrl from '../assets/textures/earth_normal.jpg'
import cloudMapUrl from '../assets/textures/earth_clouds.jpg'

const EARTH_RADIUS = 1  // all distances in Earth-radii units

export class Globe {
  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera
    this.earthMesh = null
    this.cloudsMesh = null
    this.atmosphereMesh = null
    this.sunLight = null
    this.fillLight = null
    this.dayTexture = null
    this.nightTexture = null
    this.normalTexture = null
  }

  async init() {
    const loader = new THREE.TextureLoader()

    // Load all textures in parallel using Vite-resolved URLs
    const [dayMap, nightMap, normalMap, cloudMap] = await Promise.all([
      loader.loadAsync(dayMapUrl),
      loader.loadAsync(nightMapUrl),
      loader.loadAsync(normalMapUrl),
      loader.loadAsync(cloudMapUrl),
    ])

    this.dayTexture = dayMap
    this.nightTexture = nightMap
    this.normalTexture = normalMap

    // Earth sphere
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64)

    // Robust ShaderMaterial for Day/Night/City Lights
    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        uDayTexture: { value: dayMap },
        uNightTexture: { value: nightMap },
        uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          // World Space Normal (since globe is at origin and doesn't rotate)
          vNormal = normalize(normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uDayTexture;
        uniform sampler2D uNightTexture;
        uniform vec3 uSunDirection;

        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
          vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
          
          // Basic diffuse lighting in WORLD SPACE
          // Since globe is fixed0, this is the most stable calculation.
          float intensity = dot(vNormal, uSunDirection);
          
          // Transition blending
          float dayWeight = smoothstep(-0.1, 0.1, intensity);
          
          vec3 color = mix(nightColor * 2.5, dayColor, dayWeight);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false,
      depthWrite: true,
      depthTest: true,
    })

    this.earthMesh = new THREE.Mesh(earthGeo, earthMat)
    this.scene.add(this.earthMesh)

    // Cloud layer
    const cloudsGeo = new THREE.SphereGeometry(EARTH_RADIUS + 0.003, 64, 64)
    const cloudsMat = new THREE.MeshPhongMaterial({
      map: cloudMap,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    })
    this.cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat)
    this.scene.add(this.cloudsMesh)

    // Principal Sun Light (Directional)
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.5)
    this.scene.add(this.sunLight)

    // Subtle fill light
    this.ambientLight = new THREE.AmbientLight(0x111122, 0.3)
    this.scene.add(this.ambientLight)
    
    // Initial update
    this.update()
  }

  update() {
    console.log('Updating globe state...')
    // 1. Rotate clouds
    if (this.cloudsMesh) {
      this.cloudsMesh.rotation.y += 0.00005
    }

    // 2. Update Sun position based on real-time
    const now = new Date()
    const sunPoint = getSunSubsolarPoint(now)
    
    // Convert to WORLD SPACE vector
    const sunPos = latLonAltToVector3(sunPoint.lat, sunPoint.lon, 10) 
    const sunDir = new THREE.Vector3().copy(sunPos).normalize()

    // 3. Update lighting and shader uniforms directly in WORLD SPACE
    if (this.sunLight) {
        this.sunLight.position.copy(sunPos)
    }

    if (this.earthMesh && this.earthMesh.material.uniforms) {
        this.earthMesh.material.uniforms.uSunDirection.value.copy(sunDir)
    }
  }
}
