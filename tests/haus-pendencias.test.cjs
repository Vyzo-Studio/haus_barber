'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=(n)=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');
const m=read('supabase/migrations/20261022_haus_rate_cleanup_readonly.sql');
const c=read('supabase/migrations/20261022_haus_cash_reconciliation_audit.sql');
const admin=read('admin.html');
const ui=read('admin-reconciliation.html');
const js=read('haus-reconciliation.js');
const workflow=read('.github/workflows/haus-qa.yml');
test('reservations check a limited private HMAC bucket before insertion',()=>{
 assert.match(m,/haus_security\.enforce_booking_rate/);
 assert.match(m,/extensions\.hmac/);
 assert.match(m,/revoke all on schema haus_security from PUBLIC,anon,authenticated/);
 assert.match(m,/15 minutes/);
 assert.match(m,/Muitas solicitações recentes/);
 assert.match(m,/haus_booking_date/);
});
test('public availability remains read-only, expired slots ignored and cleanup separately cron-managed',()=>{
 const section=m.slice(m.indexOf('CREATE OR REPLACE FUNCTION public.get_public_booked_slots'),m.indexOf('create or replace function public.haus_expire_pending_bookings'));
 assert.doesNotMatch(section,/update public\.bookings|delete from public\.bookings/i);
 assert.match(section,/expires_at>now\(\)/);
 assert.match(m,/cron\.schedule\('haus-barber-expire-reservations'/);
 assert.match(m,/revoke all on function public\.haus_expire_pending_bookings\(\) from PUBLIC,anon,authenticated/);
});
test('historical cash stays intact and finance review requires admin',()=>{
 assert.doesNotMatch(c,/update public\.cash_entries|delete from public\.cash_entries/i);
 assert.match(c,/public\.is_admin\(\)/g);
 assert.match(c,/haus_cash_reconciliation_events/);
 assert.match(c,/review_status in \('under_review','explained','requires_correction'\)/);
 assert.match(c,/revoke all on public\.haus_cash_reconciliation_events from PUBLIC,anon,authenticated/);
 assert.match(c,/grant execute on function public\.haus_admin_cash_reconciliation\(\) to authenticated/);
});
test('reconciliation interface is private, audit-only, no payment mutation controls',()=>{
 assert.match(admin,/href="admin-reconciliation\.html"/);
 assert.match(ui,/id="authGate"/);
 assert.match(ui,/id="reconciliationApp" hidden/);
 assert.match(js,/client\.auth\.getUser\(\)/);
 assert.match(js,/rpc\('is_admin'\)/);
 assert.match(js,/haus_admin_cash_reconciliation/);
 assert.match(js,/haus_admin_record_cash_review/);
 assert.doesNotMatch(js,/\.from\('cash_entries'\).*\.update\(/s);
 assert.doesNotThrow(()=>new Function(js));
});
test('duplicate phone index removed without touching customer records',()=>{
 assert.match(m,/drop index if exists public\.haus_combo_customers_phone_lookup/);
 assert.doesNotMatch(m,/delete from public\.haus_combo_customers/i);
});
test('real browser smoke tests run with isolated local server across 3 viewports',()=>{
 const f=read('tests/haus-browser-smoke.test.cjs');
 assert.match(f,/390,768,1440/);
 assert.match(f,/admin-reconciliation\.html/);
 assert.match(f,/horizontalOverflow<=3/);
 assert.match(workflow,/browser-smoke:/);
 assert.match(workflow,/playwright@1\.56\.1/);
 assert.match(workflow,/node --test tests\/haus-browser-smoke\.test\.cjs/);
 assert.doesNotThrow(()=>new Function('require','__dirname',f));
});
