'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),adm=read('admin.html'),combo=read('admin-combos.html'),privacy=read('privacidade.html');
const fin=read('supabase/migrations/20261021_omega_manual_payment_actual_date.sql');
const identity=read('supabase/migrations/20261021_omega_shared_whatsapp_identity.sql');
test('privacy notice is available before submission and in the footer',()=>{
 assert.match(html,/haus-privacy-notice/);
 assert.match(html,/privacidade\.html/);
 assert.ok(html.indexOf('haus-privacy-notice')<html.indexOf('</form>',html.indexOf('id="booking-form"')));
 assert.match(privacy,/WhatsApp/);
 assert.match(privacy,/Supabase/);
 assert.match(privacy,/45|financeiro|pagamento/);
});
test('sitemap paths match canonical GitHub Pages with underscore',()=>{
 for(const file of ['robots.txt','sitemap.xml']){
  const t=read(file);
  assert.match(t,/https:\/\/vyzo-studio\.github\.io\/haus_barber\//);
  assert.doesNotMatch(t,/https:\/\/vyzo-studio\.github\.io\/haus-barber\//);
 }
});
test('pin consistent Supabase SDK exact v2.118.0 including CDN fallback',()=>{
 for(const c of [html,adm,combo]){
  assert.match(c,/@supabase\/supabase-js@2\.118\.0/);
  assert.doesNotMatch(c,/@supabase\/supabase-js@2["']/);
 }
 assert.match(adm,/unpkg\.com\/@supabase\/supabase-js@2\.118\.0/);
});
test('manual receipts use the current cash date, not appointment date',()=>{
 assert.match(fin,/business_date=v_today and status='open'/);
 assert.doesNotMatch(fin,/business_date=p_booking_date/i);
 assert.match(fin,/v_cash_session,v_id,'sale'/);
 assert.doesNotMatch(fin,/delete from public\.cash_entries/i);
 assert.doesNotMatch(fin,/update public\.cash_entries/i);
 assert.doesNotMatch(fin,/insert into public\.cash_sessions/i);
});
test('split receipt is atomic and idempotent',()=>{
 assert.match(fin,/pg_advisory_xact_lock/);
 assert.match(fin,/manual_request_id=p_request_id/);
 assert.match(fin,/haus_payment_batches/);
 assert.match(fin,/v_total<>v_price/);
 assert.match(fin,/count\(distinct x->>'method'\)/);
 assert.match(fin,/case when v_part\.method='cash' then p_cash_received_cents-v_cash_part/);
 assert.match(fin,/public\.is_admin\(\)/);
});
test('customer identity is no longer equated with WhatsApp',()=>{
 assert.match(identity,/drop constraint if exists haus_combo_customers_whatsapp_digits_key/);
 assert.match(identity,/lower\(btrim\(c\.full_name\)\)=lower\(v_name\) and c\.whatsapp_digits=v_phone/);
 assert.doesNotMatch(identity,/on conflict\(whatsapp_digits\).*do update/is);
 assert.match(identity,/haus_combo_customers_phone_lookup/);
});
test('fix keeps project files and critical admin workflows intact',()=>{
 assert.match(adm,/haus-admin-extensions\.js/);
 assert.match(adm,/href="admin-combos\.html"/);
 assert.match(combo,/id="visitForm"/);
 assert.match(combo,/id="manageModal"/);
 assert.match(combo,/data-filter="canceled"/);
});
