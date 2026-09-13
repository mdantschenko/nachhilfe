import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceFile = (name) => readFileSync(join(root, name), 'utf8').trim();

const fontsCss = sourceFile('fonts.css');
const stylesCss = sourceFile('styles.css');
const appJs = sourceFile('app.js');
const fontsCssAbsolute = fontsCss.replace(/url\('fonts\//g, "url('/fonts/");

const targets = [
  { file: 'index.html', css: fontsCss + '\n  </style>\n  <style>\n' + stylesCss, js: appJs },
  { file: '404.html', css: fontsCssAbsolute + '\n  </style>\n  <style>\n' + stylesCss },
];

function replaceBetweenMarkers(src, file, marker, inner) {
  const startMarker = `<!-- ${marker}:START`;
  const endMarker = `<!-- ${marker}:END -->`;
  const startIdx = src.indexOf(startMarker);
  if (startIdx === -1) {
    console.error(`${marker}-Marker in ${file} nicht gefunden.`);
    process.exit(1);
  }
  const startCloseIdx = src.indexOf('-->', startIdx);
  const endIdx = src.indexOf(endMarker, startIdx);
  if (startCloseIdx === -1 || endIdx === -1 || startCloseIdx + '-->'.length > endIdx) {
    console.error(`${marker}-Marker in ${file} beschädigt — nichts geschrieben.`);
    process.exit(1);
  }
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const afterStart = startCloseIdx + '-->'.length;
  return src.slice(0, afterStart) + inner.replace(/\r?\n/g, eol) + src.slice(endIdx);
}

for (const target of targets) {
  const htmlPath = join(root, target.file);
  let html = readFileSync(htmlPath, 'utf8');
  html = replaceBetweenMarkers(html, target.file, 'INLINE-CSS', '\n  <style>\n' + target.css + '\n  </style>\n  ');
  if (target.js) {
    html = replaceBetweenMarkers(html, target.file, 'INLINE-JS', '\n  <script>\n' + target.js + '\n  </script>\n  ');
  }
  writeFileSync(htmlPath, html, 'utf8');
  console.log(`Inline-Code in ${target.file} aktualisiert.`);
}
