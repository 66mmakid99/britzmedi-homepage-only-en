import sharp from 'sharp';

const files = [
  'public/images/products/torr-rf/torrrf.png',
  'public/images/products/torr-rf/torrrf-handpiece-set.png'
];

for (const file of files) {
  const output = file.replace('.png', '.webp');
  await sharp(file)
    .webp({ quality: 85, effort: 6 })
    .toFile(output);
  console.log(`✓ Converted: ${file} -> ${output}`);
}

console.log('Done!');
