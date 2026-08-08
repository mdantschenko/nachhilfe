// Kopiert fonts.css + styles.css als Inline-<style> in index.html (zwischen die
// INLINE-CSS-Marker). Nach jeder Änderung an fonts.css oder styles.css ausführen:
//   node tools/sync-css.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = join(root, 'index.html');
const css = (f) => readFileSync(join(root, f), 'utf8').trim();

const START = '<!-- INLINE-CSS:START';
const END = '<!-- INLINE-CSS:END -->';

const src = readFileSync(htmlPath, 'utf8');
const startIdx = src.indexOf(START);
if (startIdx === -1) {
  console.error('INLINE-CSS-Marker in index.html nicht gefunden.');
  process.exit(1);
}
const closeIdx = src.indexOf('-->', startIdx);
const endIdx = src.indexOf(END, startIdx);
if (closeIdx === -1 || endIdx === -1 || closeIdx + '-->'.length > endIdx) {
  console.error('INLINE-CSS-Marker in index.html beschädigt — nichts geschrieben.');
  process.exit(1);
}
const afterStart = closeIdx + '-->'.length;

// Zeilenenden an die HTML-Datei angleichen (Windows-Checkouts sind CRLF).
const eol = src.includes('\r\n') ? '\r\n' : '\n';
const normalize = (s) => s.replace(/\r?\n/g, eol);

const block = normalize(
  '\n  <style>\n' + css('fonts.css') + '\n  </style>\n' +
  '  <style>\n' + css('styles.css') + '\n  </style>\n  ');

writeFileSync(htmlPath, src.slice(0, afterStart) + block + src.slice(endIdx), 'utf8');
console.log('Inline-CSS in index.html aktualisiert.');
