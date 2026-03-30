#  Satellite Tracker

**See every satellite orbiting Earth, right now, in real-time 3D.**

A WebGL globe showing 5,000+ active satellites with live orbital positions calculated using real aerospace mathematics. Click any satellite to see its details, or enter your city to find out which ones are flying over you tonight.

[**→ Live Demo**](https://your-demo-url.vercel.app)

![Satellite Tracker Preview](./preview.png)

---

## What it does

Most people don't realize how crowded Earth's orbit has become. This app makes that visible.

- **Real-time positions** — Every satellite's location is calculated live using SGP4 orbital mechanics, the same model used by NASA and NORAD
- **Click any satellite** — See its name, country, altitude, speed, launch date, and purpose
- **Pass predictor** — Type your city and see which satellites will fly overhead, with exact times and elevations
- **Search and filter** — Find satellites by name, country, or type (Starlink, GPS, weather, ISS, etc.)
- **Orbital trails** — See the path each satellite is currently traveling

---

## Built with

| Tool | Purpose |
|------|---------|
| [Three.js](https://threejs.org) | WebGL 3D rendering |
| [satellite.js](https://github.com/shashwatak/satellite-js) | SGP4 orbital mechanics |
| [Vite](https://vitejs.dev) | Build tool and dev server |
| [CelesTrak](https://celestrak.org) | Live NORAD satellite data — free, no key |
| [NASA Visible Earth](https://visibleearth.nasa.gov) | Earth textures — public domain |
| [Nominatim](https://nominatim.org) | City geocoding — free, no key |

**Total running cost: $0**

---

## How the positions work

Every satellite is described by a **TLE** (Two-Line Element set) — two lines of numbers encoding its orbital parameters. Feed a TLE and the current time into the **SGP4 propagator** and you get the satellite's exact position in space.

```
TLE data → SGP4 propagator → ECI coordinates → lat/lon/alt → 3D point on globe
```

Positions recalculate every second. TLE data is fetched once and cached for 2 hours since it only changes every few hours anyway.

---

## Getting started

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/yourusername/satellite-tracker
cd satellite-tracker
npm install
npm run dev
```

Open `http://localhost:5173`.

### Download the Earth textures

Too large for the repo — download free and place in `public/textures/`:

| File | Source |
|------|--------|
| `earth_daymap.jpg` | [NASA Blue Marble](https://visibleearth.nasa.gov/collection/1484/blue-marble) |
| `earth_nightmap.jpg` | [NASA Black Marble](https://visibleearth.nasa.gov/images/144898) |
| `earth_normal.jpg` | [Solar System Scope](https://www.solarsystemscope.com/textures) |
| `earth_clouds.jpg` | [Solar System Scope](https://www.solarsystemscope.com/textures) |

---

## Deploy

```bash
npm install -g vercel
vercel --prod
```

The `api/tle-proxy.js` file deploys as a Vercel Edge Function automatically. It proxies CelesTrak requests and handles CORS — no extra configuration needed.

---

## Project structure

```
src/
├── main.js                    # Scene setup and animation loop
├── globe/
│   └── Globe.js               # Earth mesh, World-Space Day/Night shader
├── satellites/
│   ├── SatelliteManager.js    # TLE fetching, parsing, position updates
│   ├── SatelliteRenderer.js   # InstancedMesh — 60fps with 5000+ objects
│   └── OrbitTrail.js          # Orbital path visualization
├── ui/
│   ├── InfoPanel.js           # Satellite detail sidebar on click
│   ├── SatelliteList.js       # Search and filter controls
│   └── PassPredictor.js       # Overhead pass time calculator
└── utils/
    ├── coordinates.js         # lat/lon/alt → Three.js Vector3
    ├── cache.js               # localStorage TLE caching
    └── astronomy.js           # Real-time Sun position calculations

api/
└── tle-proxy.js               # Vercel edge function — CORS proxy for CelesTrak
```

---

## Things worth knowing if you dig into the code

**Real-Time Day/Night Sync**
The Earth's lighting is calculated in World-Space, synchronized with the actual position of the Sun for the current UTC time. 

**Why InstancedMesh**
5,000 individual Three.js Mesh objects = ~2fps. InstancedMesh renders all satellites as one GPU draw call = 60fps. It's the only way to do this at this scale.

**Why CelesTrak**
No API key, no account, no rate limit for normal usage. Maintained by an aerospace engineer and sourced directly from NORAD. Every other free option either requires registration or has tight limits.

---

## License

MIT

---

*Orbital data from [CelesTrak](https://celestrak.org) · Textures from [NASA](https://visibleearth.nasa.gov) · SGP4 math by [satellite.js](https://github.com/shashwatak/satellite-js)*