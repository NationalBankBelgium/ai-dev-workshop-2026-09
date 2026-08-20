import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const distDirectory = join(process.cwd(), 'dist');
const files = readdirSync(distDirectory, { recursive: true }).filter((entry) => {
  const fullPath = join(distDirectory, entry);
  return statSync(fullPath).isFile();
});

if (files.length !== 1 || files[0] !== 'index.html') {
  throw new Error(`Expected one self-contained dist/index.html, found: ${files.join(', ')}`);
}

const html = readFileSync(join(distDirectory, 'index.html'), 'utf8');
for (const marker of [
  'National Bank of Belgium',
  'Team Retro Board',
  'Barlow',
  'Fraunces',
  'Scan to start',
  'Recommended approach',
  'https://nationalbankbelgium.github.io/ai-dev-workshop-2026-09/',
  '<svg',
]) {
  if (!html.includes(marker)) {
    throw new Error(`Build artifact is missing expected marker: ${marker}`);
  }
}

for (const asset of ['src/assets/workshop-url-qr.png', 'src/assets/workshop-url-qr.svg']) {
  const assetPath = join(process.cwd(), asset);
  if (!existsSync(assetPath) || statSync(assetPath).size === 0) {
    throw new Error(`Generated QR asset is missing or empty: ${asset}`);
  }
}

console.log(`Verified self-contained dist/index.html with QR display (${html.length} bytes).`);
