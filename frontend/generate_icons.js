import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const dir = './public/icons';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const logoPath = './public/logo.png';

async function generate() {
  if (!fs.existsSync(logoPath)) {
    console.error('No se encontró public/logo.png');
    return;
  }

  // 192x192
  await sharp(logoPath)
    .resize(192, 192)
    .toFile(path.join(dir, 'icon-192x192.png'));

  // 512x512
  await sharp(logoPath)
    .resize(512, 512)
    .toFile(path.join(dir, 'icon-512x512.png'));

  // Apple touch icon 180x180
  await sharp(logoPath)
    .resize(180, 180)
    .toFile('./public/apple-touch-icon.png');

  console.log('✅ Íconos PWA reales generados con éxito.');
}

generate().catch(console.error);
