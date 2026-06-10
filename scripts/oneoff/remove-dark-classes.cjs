const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/contact.astro',
  'src/pages/faq.astro',
  'src/pages/resources.astro'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove dark: classes but preserve the rest of the class string
  content = content.replace(/\s+dark:[^\s"']+/g, '');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`✓ Processed: ${file}`);
});

console.log('Done!');
