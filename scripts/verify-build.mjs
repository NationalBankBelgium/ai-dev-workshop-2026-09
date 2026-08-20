import { readdirSync, readFileSync, statSync } from 'node:fs';
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
for (const marker of ['National Bank of Belgium', 'Team Retro Board', 'Barlow', 'Fraunces']) {
  if (!html.includes(marker)) {
    throw new Error(`Build artifact is missing expected marker: ${marker}`);
  }
}

console.log(`Verified self-contained dist/index.html (${html.length} bytes).`);
