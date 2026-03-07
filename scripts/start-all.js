#!/usr/bin/env node
/**
 * Starts frontend (Next.js on 3000) then backend (Express on 8080).
 * Used for single-component deploy on DigitalOcean so the app serves both UI and API.
 */
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT, 'frontend');
const BACKEND_DIR = path.join(ROOT, 'backend');

function waitForPort(port, maxAttempts = 60) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (attempts >= maxAttempts) return reject(new Error(`Port ${port} not ready in time`));
        setTimeout(check, 1000);
      });
    };
    check();
  });
}

const frontend = spawn('npm', ['start'], {
  cwd: FRONTEND_DIR,
  stdio: 'inherit',
  detached: true,
  env: { ...process.env, PORT: '3000' },
});
frontend.unref();

console.log('Waiting for Next.js on port 3000...');
waitForPort(3000)
  .then(() => {
    console.log('Frontend ready. Starting backend...');
    const backend = spawn('npm', ['start'], {
      cwd: BACKEND_DIR,
      stdio: 'inherit',
      env: { ...process.env, ENABLE_FRONTEND_PROXY: '1' },
    });
    backend.on('exit', (code) => process.exit(code != null ? code : 0));
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
