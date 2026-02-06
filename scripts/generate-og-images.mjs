import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

async function generateImages() {
  console.log('Generating OG and touch icon images...');

  // Generate apple-touch-icon.png from SVG
  const appleTouchSvg = readFileSync(join(publicDir, 'apple-touch-icon.svg'));
  await sharp(appleTouchSvg)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png (180x180)');

  // Generate og-image.jpg from SVG
  const ogSvg = readFileSync(join(publicDir, 'images', 'og', 'og-default.svg'));
  await sharp(ogSvg)
    .resize(1200, 630)
    .jpeg({ quality: 90 })
    .toFile(join(publicDir, 'og-image.jpg'));
  console.log('✓ Created og-image.jpg (1200x630)');

  // Also create a PNG version for higher quality
  await sharp(ogSvg)
    .resize(1200, 630)
    .png()
    .toFile(join(publicDir, 'images', 'og', 'og-default.png'));
  console.log('✓ Created images/og/og-default.png (1200x630)');

  console.log('\nAll images generated successfully!');
}

generateImages().catch(console.error);
