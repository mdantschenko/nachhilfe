import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(join(root, '.env.local'), 'utf8');
const tokenMatch = env.match(/^\s*CLOUDFLARE_API\s*=\s*["']?([^"'\r\n]+)/m);
if (!tokenMatch) {
  console.error('CLOUDFLARE_API nicht in .env.local gefunden.');
  process.exit(1);
}
const TOKEN = tokenMatch[1].trim();
const ZONE = '60fa35d16670df35675dd97e51423e3e';

async function api(path, method = 'GET', body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) {
    console.error(`${method} ${path} fehlgeschlagen:`, JSON.stringify(json.errors));
    process.exit(1);
  }
  return json.result;
}

const ssl = await api(`/zones/${ZONE}/settings/ssl`, 'PATCH', { value: 'strict' });
console.log('SSL-Modus:', ssl.value);

const https = await api(`/zones/${ZONE}/settings/always_use_https`, 'PATCH', { value: 'on' });
console.log('Always Use HTTPS:', https.value);

const ruleset = await api(`/zones/${ZONE}/rulesets/phases/http_request_cache_settings/entrypoint`, 'PUT', {
  rules: [{
    expression: 'starts_with(http.request.uri.path, "/fonts/") or starts_with(http.request.uri.path, "/assets/")',
    description: 'Fonts und Assets 1 Monat cachen',
    action: 'set_cache_settings',
    action_parameters: {
      cache: true,
      edge_ttl: { mode: 'override_origin', default: 2592000 },
      browser_ttl: { mode: 'override_origin', default: 2592000 },
    },
  }],
});
console.log('Cache-Regeln aktiv:', ruleset.rules.length);
console.log('Fertig — Konfiguration abgeschlossen.');
