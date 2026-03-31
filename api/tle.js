export const config = { runtime: 'edge' }

const ALLOWED_GROUPS = [
  'active', 'stations', 'starlink', 'weather',
  'gps-ops', 'iridium', 'orbcomm', 'globalstar'
]

export default async function handler(req) {
  const { searchParams } = new URL(req.url)

  const group = searchParams.get('group') || searchParams.get('GROUP')

  const upstream = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`
  const response = await fetch(upstream)
  const text = await response.text()

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 's-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    }
  })
}
