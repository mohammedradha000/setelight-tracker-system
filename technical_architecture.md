# 🛰️ Satellite Tracker: Technical Architecture & Implementation Guide

This document provides a comprehensive, step-by-step technical breakdown of how the 3D Satellite Tracker was built, the APIs used, and the mathematical principles behind its real-time synchronization.

---

## 1. Core APIs & Data Sources

| Source | Role | Description |
| :--- | :--- | :--- |
| **CelesTrak** | TLE Data | The primary source of NORAD Two-Line Element (TLE) sets for all active satellites. |
| **satellite.js** | Orbital Mechanics | A JavaScript library used to implement SGP4/SDP4 propagation for orbital math. |
| **Three.js** | 3D Graphics | The WebGL engine used to render the Earth, clouds, and satellite instances. |
| **NASA Visible Earth** | Textures | High-resolution "Blue Marble" and "Black Marble" maps for the Earth's day and night sides. |
| **Nominatim (OSM)** | Geocoding | Used for the "Pass Predictor" to convert city names into latitude/longitude coordinates. |
| **Vite** | Build Tool | The development server and bundler that provides HMR and optimized production builds. |

---

## 2. Step-by-Step Build Process

### Phase 1: Environment & 3D Scene Setup
1. **Vite Initialization**: The project was scaffolded with Vite for a fast development experience.
2. **The Scene Graph**: Created a standard Three.js boilerplate (`main.js`):
   - `THREE.Scene`: The container for all objects.
   - `THREE.PerspectiveCamera`: Set with a 45° FOV for realistic distortion.
   - `THREE.WebGLRenderer`: Configured with `antialias: true` and `logarithmicDepthBuffer: false` for maximum rendering stability.
3. **Interactive Controls**: `OrbitControls` were integrated to allow the user to rotate, zoom, and pan around the globe.

### Phase 2: Building the "Living" Earth
1. **Geometry**: A `SphereGeometry` was used with 64 segments for a smooth spherical silhouette.
2. **Custom Day/Night Shader**: Instead of a simple texture, a `ShaderMaterial` was developed to handle the complex blending of:
   - **Day Map**: Standard sunlight texture.
   - **Night Map**: City lights texture with a 2.5x brightness boost for aesthetic "pop."
   - **Lighting Logic**: Calculating the `dot product` between the surface normal and the Sun's direction vector in World-Space. If the dot product is positive, it's day; if negative, it's night.
3. **Cloud Layer**: A slightly larger sphere (EARTH_RADIUS + 0.003) with a cloud texture and `depthWrite: false` was added to give the planet depth.

### Phase 3: Astronomical Synchronization
1. **Sun Position (`astronomy.js`)**:
   - Calculated the Julian Date from the current system time (`new Date()`).
   - Determined the Sun's Right Ascension (RA) and Declination (Dec).
   - Calculated the Greenwich Mean Sidereal Time (GMST) to find the Sun’s current subsolar longitude.
2. **Real-Time Update Loop**:
   - Every frame, the system recalculates the Sun's position and updates the `uSunDirection` uniform in the Earth's shader. This creates the moving day/night terminator.

### Phase 4: Satellite Management & Math
1. **Data Ingestion**: `SatelliteManager.js` fetches TLE data from CelesTrak. A Vercel proxy (`api/tle-proxy.js`) was implemented to bypass browser CORS restrictions.
2. **Orbital Propagation**:
   - Each TLE string is parsed into a `satrec` (Satellite Record).
   - Using the `satellite.propagate()` function, the app converts time into ECI (Earth-Centered Inertial) coordinates.
3. **Coordinate Calibration**:
   - ECI coordinates are converted to Geodetic (Latitude, Longitude, Altitude).
   - Geodetic coordinates are mapped to Three.js Cartesian (X, Y, Z) coordinates using a custom `latLonAltToVector3` utility.

### Phase 5: Massive Scale Performance
1. **InstancedMesh**: To render 5,000+ satellites at 60 FPS, we used `InstancedMesh`. This allows all satellites to be rendered in a **single GPU draw call**, rather than 5,000 separate calls.
2. **Dynamic Coloring**: Individual instances are colored based on their satellite group (e.g., Starlink, GPS).

### Phase 6: UI & Features
1. **Satellite Sidebar**: Clicking an instance retrieves its satellite record and displays its SATCAT metadata (Launch Date, Purpose, Owner).
2. **Pass Predictor**:
   - The user inputs a city name (fetched via Nominatim).
   - The system checks if any satellite’s geodetic position overlaps with the user's location within a defined elevation limit.

---

## 3. High-Tech Branding & Polishing
- **Glassmorphism UI**: The sidebar uses high-transparency backgrounds with blur filters (`backdrop-filter`) for a futuristic look.
- **Starfield**: A large `Points` object or high-resolution spherical map creates the deep-space background.
- **Fail-Safe Loading**: The animation loop starts immediately, ensuring the Earth is visible even if the satellite API is slow or blocked.

---
*Document produced as a technical summary for the Satellite Tracker System repository.*
