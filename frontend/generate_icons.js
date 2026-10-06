import fs from 'fs';
import path from 'path';

const dir = './public/icons';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Minimal valid 1x1 PNG base64 that can be decoded by any browser
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const buffer = Buffer.from(base64Png, 'base64');

fs.writeFileSync(path.join(dir, 'icon-192x192.png'), buffer);
fs.writeFileSync(path.join(dir, 'icon-512x512.png'), buffer);
console.log('Iconos placeholder creados.');
