import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const output = join(process.cwd(), 'dist');
const base = process.argv[2] ?? '/';
assert.ok(base.startsWith('/') && base.endsWith('/'), 'Build base must begin and end with /');
const manifestPath = join(output, 'manifest.webmanifest');
const workerPath = join(output, 'sw.js');
assert.ok(existsSync(manifestPath), 'PWA manifest is missing');
assert.ok(existsSync(workerPath), 'Service worker is missing');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
assert.equal(manifest.name, 'Помощник проверки ЕГЭ по китайскому языку');
assert.equal(manifest.start_url, '.');
assert.equal(manifest.display, 'standalone');

const html = readFileSync(join(output, 'index.html'), 'utf8');
assert.ok(html.includes(`href="${base}manifest.webmanifest"`), 'Manifest URL does not match the deployment base');
const registration = readFileSync(join(output, 'registerSW.js'), 'utf8');
assert.ok(registration.includes(`${base}sw.js`), 'Service worker URL does not match the deployment base');

for (const size of [192, 512]) {
  const icon = manifest.icons.find((item) => item.sizes === `${size}x${size}` && item.type === 'image/png');
  assert.ok(icon, `Missing ${size}px PNG icon in manifest`);
  const iconPath = join(output, icon.src.startsWith(base) ? icon.src.slice(base.length) : icon.src.replace(/^\//, ''));
  assert.ok(existsSync(iconPath), `Missing icon file: ${icon.src}`);
  assert.deepEqual([...readFileSync(iconPath).subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
}

const worker = readFileSync(workerPath, 'utf8');
const assets = readdirSync(join(output, 'assets'));
assert.match(worker, /index\.html/, 'Offline navigation fallback is missing');
for (const extension of ['.js', '.css']) {
  const asset = assets.find((item) => item.endsWith(extension));
  assert.ok(asset, `Missing built ${extension} asset`);
  assert.ok(worker.includes(asset), `${asset} is not precached`);
}
for (const forbidden of ['doc.fipi.ru', 'ege-assessments-v1', 'ege-working-draft-v1']) {
  assert.ok(!worker.includes(forbidden), `${forbidden} must not be in the worker cache list`);
}

process.stdout.write('PWA build artifacts and precache verified.\n');
