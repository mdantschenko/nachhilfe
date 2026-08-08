import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = join(root, 'index.html');
const sourceFile = (name) => readFileSync(join(root, name), 'utf8').trim();

let html = readFileSync(htmlPath, 'utf8');
const eol = html.includes('\r\n') ? '\r\n' : '\n';
const matchHtmlLineEndings = (text) => text.replace(/\r?\n/g, eol);

function replaceBetweenMarkers(src, marker, inner) {
  const startMarker = `<!-- ${marker}:START`;
  const endMarker = `<!-- ${marker}:END -->`;
  const startIdx = src.indexOf(startMarker);
  if (startIdx === -1) {
    console.error(`${marker}-Marker in index.html nicht gefunden.`);
    process.exit(1);
  }
  const startCloseIdx = src.indexOf('-->', startIdx);
  const endIdx = src.indexOf(endMarker, startIdx);
  if (startCloseIdx === -1 || endIdx === -1 || startCloseIdx + '-->'.length > endIdx) {
    console.error(`${marker}-Marker in index.html beschädigt — nichts geschrieben.`);
    process.exit(1);
  }
  const afterStart = startCloseIdx + '-->'.length;
  return src.slice(0, afterStart) + matchHtmlLineEndings(inner) + src.slice(endIdx);
}

html = replaceBetweenMarkers(html, 'INLINE-CSS',
  '\n  <style>\n' + sourceFile('fonts.css') + '\n  </style>\n' +
  '  <style>\n' + sourceFile('styles.css') + '\n  </style>\n  ');
html = replaceBetweenMarkers(html, 'INLINE-JS',
  '\n  <script>\n' + sourceFile('app.js') + '\n  </script>\n  ');

writeFileSync(htmlPath, html, 'utf8');
console.log('Inline-CSS und Inline-JS in index.html aktualisiert.');
