// Vercel Serverless Function to dynamically provide BACKEND_URL from environment variables at runtime
module.exports = (req, res) => {
  const backendUrl = (
    process.env.BACKEND_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  ).trim().replace(/\/+$/, '');

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  res.status(200).json({
    apiUrl: backendUrl,
    configured: Boolean(backendUrl)
  });
};
