import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const workshopUrl = 'https://nationalbankbelgium.github.io/ai-dev-workshop-2026-09/';
const assetsDirectory = fileURLToPath(new URL('../src/assets/', import.meta.url));
const qrOptions = {
  errorCorrectionLevel: 'H',
  margin: 4,
  width: 1024,
  color: {
    dark: '#002d5a',
    light: '#ffffff',
  },
};

await mkdir(assetsDirectory, { recursive: true });

await QRCode.toFile(join(assetsDirectory, 'workshop-url-qr.png'), workshopUrl, {
  ...qrOptions,
  type: 'png',
});

const svg = await QRCode.toString(workshopUrl, {
  ...qrOptions,
  type: 'svg',
});
await writeFile(join(assetsDirectory, 'workshop-url-qr.svg'), svg, 'utf8');

console.log(`Generated QR code assets for ${workshopUrl}`);
