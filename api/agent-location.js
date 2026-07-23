// GET /api/agent-location
// Response: { location: "City, Country" } or { location: "Unknown" }
//
// Vercel automatically attaches IP-based geolocation headers to every
// request at the edge — no third-party API, no API key, no cost. Locally
// via `vercel dev` these headers usually aren't populated, so you'll see
// "Unknown" until it's actually deployed.

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const city = req.headers['x-vercel-ip-city'];
  const region = req.headers['x-vercel-ip-country-region'];
  const country = req.headers['x-vercel-ip-country'];

  const cityDecoded = city ? decodeURIComponent(city) : '';

  let location = 'Unknown';
  if (cityDecoded && country) {
    location = `${cityDecoded}, ${country}`;
  } else if (region && country) {
    location = `${region}, ${country}`;
  } else if (country) {
    location = country;
  }

  return res.status(200).json({ location });
}
