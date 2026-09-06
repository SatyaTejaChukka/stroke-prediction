const fs = require('fs');
const path = require('path');

const backendUrl = (
  process.env.BACKEND_URL ||
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ''
).trim().replace(/\/+$/, '');

const content = `// Injected at build time by Vercel environment variables
window.__ENV__ = {
  BACKEND_URL: ${JSON.stringify(backendUrl)}
};
`;

fs.writeFileSync(path.join(__dirname, 'config.js'), content, 'utf-8');
console.log(`[frontend/build.js] Generated config.js (BACKEND_URL: ${backendUrl ? 'configured' : 'empty'})`);
