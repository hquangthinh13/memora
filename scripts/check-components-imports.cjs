const fs = require('fs');
const path = require('path');

const roots = [path.join(process.cwd(), 'app'), path.join(process.cwd(), 'src')];
const exts = new Set(['.ts', '.tsx']);
const forbidden = /from\s+["']@\/components\//g;

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (exts.has(path.extname(entry.name))) out.push(full);
  }
}

const files = [];
for (const root of roots) walk(root, files);

const violations = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (forbidden.test(text)) {
    violations.push(path.relative(process.cwd(), file));
  }
}

if (violations.length) {
  console.error('Found forbidden direct component file imports (use barrels/index.ts):');
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}

console.log('Component import check passed.');
