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

// 1. Write config.js in root and frontend
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

// 2. Also populate public/ directory as a robust fail-safe for Vercel
try {
  const publicDir = path.join(__dirname, 'public');
  const frontendDir = path.join(__dirname, 'frontend');

  if (fs.existsSync(frontendDir)) {
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const filesToCopy = ['index.html', 'styles.css', 'script.js', 'config.js'];
    filesToCopy.forEach((file) => {
      const src = path.join(frontendDir, file);
      const dest = path.join(publicDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    });
    console.log(`[build.js] Synced frontend files to public/ directory`);
  }
} catch (e) {
  console.warn(`[build.js] Could not sync public directory:`, e.message);
}
