import sharp from 'sharp';
import { readdir } from 'fs/promises';

const dir = 'public/images/products/newchae-shot';
const files = await readdir(dir);
const jpgFiles = files.filter(f => f.endsWith('.jpg'));

for (const file of jpgFiles) {
  const input = `${dir}/${file}`;
  const output = input.replace('.jpg', '.webp');
  
  await sharp(input)
    .webp({ quality: 85, effort: 6 })
    .toFile(output);
  
  console.log(`✓ Converted: ${file} -> ${file.replace('.jpg', '.webp')}`);
}

console.log('Done!');
