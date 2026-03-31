export const config = { runtime: 'edge' }

export default async function handler(req) {
  // SatCat is a static CSV file on CelesTrak
  const upstream = `https://celestrak.org/pub/satcat.csv`
  
  try {
    const response = await fetch(upstream)
    if (!response.ok) throw new Error(`Upstream failed: ${response.status}`)
    
    const text = await response.text()

    return new Response(text, {
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 's-maxage=86400', //cache
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    return new Response(`Error fetching SATCAT: ${error.message}`, { status: 500 })
  }
}
