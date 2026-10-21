const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const admin = read('admin.html');
const adminExt = read('haus-admin-extensions.js');
const publicExt = read('haus-public-dynamic.js');
const css = read('haus-admin-extensions.css');
test('module syntax compiles with plain JS', () => {
  assert.doesNotThrow(() => new Function(adminExt));
  assert.doesNotThrow(() => new Function(publicExt));
});
test('service, professional and photo panels exist without themes/colour editing', () => {
  for (const id of ['haus-manager','haus-services-list','haus-barbers-list','haus-photos-list','haus-photo-file','haus-service-price','haus-manual-barber']) assert.match(admin, new RegExp(`id="${id}"`));
  assert.doesNotMatch(admin.slice(admin.indexOf('id="haus-manager"')), /id="(?:haus-.*(?:color|theme|palette))"/i);
  assert.match(css, /--admin-red/);
  assert.match(css, /--admin-surface/);
});
test('split amounts, cash tender and RPC names match existing bank', () => {
  assert.match(adminExt, /data-haus-part/);
  assert.match(adminExt, /data-haus-tender/);
  assert.match(adminExt, /'cash',\s*'Dinheiro'/);
  assert.match(adminExt, /sum!==total/);
  assert.match(adminExt, /Dinheiro entregue é menor/);
  assert.match(admin, /data-haus-finance|haus-booking-finance-host/);
});
test('active catalog and portfolio load from Haus source, not GNG', () => {
  assert.match(publicExt, /from\('haus_services'\)/);
  assert.match(publicExt, /from\('haus_gallery'\)/);
  assert.match(publicExt, /'haus-gallery'/);
  assert.match(publicExt, /if\(!client\)/);
  assert.match(publicExt, /precos/);
  assert.doesNotMatch(publicExt, /gng_barbearia|theme-selector|colorPicker/);
});
test('photo upload validates MIME and size, removes DB metadata without deleting backup asset', () => {
  assert.match(adminExt, /image\/png/);
  assert.match(adminExt, /5\*1024\*1024/);
  assert.match(adminExt, /\.upload\(storage_path/);
  assert.match(adminExt, /\.from\('haus_gallery'\)\.delete\(\)/);
  assert.match(adminExt, /arquivo original não será apagado/i);
});