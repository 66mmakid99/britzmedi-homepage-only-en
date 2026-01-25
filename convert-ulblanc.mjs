import sharp from 'sharp';

const files = [
  'public/images/products/ulblanc/ulblanc-01.jpg',
  'public/images/products/ulblanc/ulblanc-02.jpg'
];

for (const file of files) {
  const output = file.replace('.jpg', '.webp');
  await sharp(file)
    .webp({ quality: 85, effort: 6 })
    .toFile(output);
  console.log(`✓ Converted: ${file} -> ${output}`);
}

console.log('Done!');
