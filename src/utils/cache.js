const CACHE_KEY = 'satellite_tle_cache'
const CACHE_DURATION_MS = 2 * 60 * 60 * 1000  // 2 hours

export function getCachedTLEs(group) {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${group}`)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_DURATION_MS) return null
    return data
  } catch {
    return null
  }
}

export function setCachedTLEs(group, data) {
  try {
    localStorage.setItem(`${CACHE_KEY}_${group}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (e) {
    // localStorage might be full (5MB limit with 5000 TLEs)
    // If so, clear old entries and try again
    localStorage.clear()
    localStorage.setItem(`${CACHE_KEY}_${group}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  }
}
