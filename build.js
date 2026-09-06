const fs = require('fs');
const path = require('path');

// Extract backend URL from Vercel environment variables
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

const targets = [
  path.join(__dirname, 'config.js'),
  path.join(__dirname, 'frontend', 'config.js')
];

targets.forEach((targetPath) => {
  try {
    const parentDir = path.dirname(targetPath);
    if (fs.existsSync(parentDir)) {
      fs.writeFileSync(targetPath, content, 'utf-8');
      console.log(`[build.js] Generated ${targetPath} (BACKEND_URL: ${backendUrl ? 'configured' : 'empty'})`);
    }
  } catch (err) {
    console.warn(`[build.js] Could not write to ${targetPath}:`, err.message);
  }
});
