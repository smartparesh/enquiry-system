const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('http://localhost:5000')) {
    // Add import statement if not exists
    if (!content.includes("import { API_URL } from")) {
      // Find the last import
      const lines = content.split('\n');
      let lastImportIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      // We need to figure out the relative path to config.js
      const depth = filePath.replace(srcDir, '').split(path.sep).length - 2;
      const relativePath = depth > 0 ? '../'.repeat(depth) + 'config' : './config';
      
      const importStatement = `import { API_URL } from '${relativePath}';`;
      if (lastImportIndex !== -1) {
        lines.splice(lastImportIndex + 1, 0, importStatement);
      } else {
        lines.unshift(importStatement);
      }
      content = lines.join('\n');
    }

    // Replace strings
    content = content.replace(/'http:\/\/localhost:5000(.*?)'/g, '`${API_URL}$1`');
    content = content.replace(/`http:\/\/localhost:5000(.*?)`/g, '`${API_URL}$1`');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      replaceInFile(fullPath);
    }
  }
}

traverseDir(srcDir);
console.log('Done replacing URLs');
