import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';

const MAX_SIZE_MB = 20; // Target max 20MB to be safe
const QUALITY = 85;

async function compressImage(filePath) {
  const stats = await sharp(filePath).metadata();
  const image = sharp(filePath);
  
  // Convert to WebP with quality setting
  const outputPath = filePath.replace('.png', '.webp');
  
  await image
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(outputPath);
  
  console.log(`✓ Compressed: ${filePath} -> ${outputPath}`);
}

async function compressLargeImages() {
  const dirs = [
    'public/images/products/torr-rf',
    'public/images/products/newchae-shot',
    'public/images/hero'
  ];
  
  for (const dir of dirs) {
    try {
      const files = await readdir(dir);
      const pngFiles = files.filter(f => f.endsWith('.png'));
      
      for (const file of pngFiles) {
        const filePath = join(dir, file);
        await compressImage(filePath);
      }
    } catch (err) {
      console.log(`Skipping ${dir}: ${err.message}`);
    }
  }
  
  console.log('\n✨ All images compressed to WebP!');
}

compressLargeImages().catch(console.error);
