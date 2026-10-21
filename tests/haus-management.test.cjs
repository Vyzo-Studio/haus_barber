const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=f=>fs.readFileSync(new URL('../'+f,'file://'+__filename),'utf8');
test('Haus keeps fixed brand styles and adds management without color editing',()=>{
 const html=read('admin.html'),css=read('haus-admin-tools.css'),manager=read('haus-admin-manager.js');
 assert.match(html,/haus-admin-manager.js/);
 assert.match(html,/haus-payments-ui.js/);
 assert.match(css,/--admin-surface/);
 assert.match(manager,/haus_services/);assert.match(manager,/haus_barbers/);assert.match(manager,/haus_gallery/);
 assert.doesNotMatch(manager,/data-theme|alterar cores|color picker|<input[^>]+type=["']color/);
});
test('Public menu, gallery and booking select use DB active records',()=>{
 const html=read('index.html'),data=read('haus-public-data.js'),script=read('script.js');
 assert.match(html,/haus-public-data.js/);
 assert.match(data,/\.eq\('active',true\)/);
 assert.match(data,/select.disabled=true/);
 assert.match(script,/hausSyncPortfolio/);
});
test('Payments and manual sales use atomic RPCs and explicit cash tender',()=>{
 const ui=read('haus-payments-ui.js'),migration=read('sql/haus_payments_extended.sql');
 assert.match(ui,/haus_register_payment_parts/);assert.match(ui,/haus_register_manual_parts/);
 assert.match(ui,/data-haus-tender/);assert.match(ui,/haus_refund_payment|haus_register_payment_parts/);
 assert.match(migration,/pg_advisory_xact_lock/);assert.match(migration,/v_total<>v_booking.service_amount_cents/);
 assert.match(migration,/cash_received_cents/);assert.match(migration,/change_given_cents/);
});
test('Security: RLS restricted modifications to is_admin',()=>{
 const s=read('sql/haus_management_modules.sql');
 assert.match(s,/enable row level security/);
 assert.match(s,/storage.objects/);
 assert.match(s,/public\.is_admin\(\)/);
 assert.match(s,/haus_gallery_objects_insert/);
});
