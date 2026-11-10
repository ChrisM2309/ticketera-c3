// Convierte las ilustraciones propias (design/illustrations/*.svg) a WebP de 1600x900
// en public/images/tipos/. Uso: node scripts/build-illustrations.mjs
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(root, 'design', 'illustrations');
const targetDir = join(root, 'public', 'images', 'tipos');

const WIDTH = 1600;
const HEIGHT = 900;

await mkdir(targetDir, { recursive: true });

const files = (await readdir(sourceDir)).filter((name) => name.endsWith('.svg')).sort();

if (files.length === 0) {
  console.error(`No hay SVG en ${sourceDir}`);
  process.exit(1);
}

for (const file of files) {
  const svg = await readFile(join(sourceDir, file));
  const webp = await sharp(svg, { density: 96 })
    .resize(WIDTH, HEIGHT, { fit: 'cover' })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();

  await writeFile(join(targetDir, file.replace(/\.svg$/, '.webp')), webp);
  console.log(`${file} -> ${(webp.length / 1024).toFixed(1)} KiB`);
}

console.log(`${files.length} ilustraciones generadas en ${targetDir}`);
