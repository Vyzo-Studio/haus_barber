'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const read=(name)=>fs.readFileSync(path.join(ROOT,name),'utf8');
const sql=read('supabase/migrations/20261021_haus_combos.sql');
const html=read('admin-combos.html');
const css=read('haus-combos.css');
const js=read('haus-combos.js');
test('new combo dashboard has all seven source-image subscription types',()=>{
 const items=[
  ['degrade_4',7500],['degrade_brows',9000],['degrade_beard',13500],
  ['social_4',6000],['social_brows',7500],['social_beard',12000],['beard_4',6000]
 ];
 for(const [id,price] of items) assert.match(sql,new RegExp("'"+id+"',[^\\n]*,"+price+","));
 assert.match(sql,/expires_on = start_date \+ 45/);
});
test('memberships capture immutable prices, service allowances and WhatsApp',()=>{
 for(const fragment of ['price_cents','cuts_total','beards_total','brows_total','whatsapp_digits','expires_on','request_id uuid not null unique'])assert.ok(sql.includes(fragment),fragment);
});
test('database denies unauthenticated clients and authorizes admin only',()=>{
 assert.match(sql,/revoke all on public\.haus_combo_plans,public\.haus_combo_customers,public\.haus_combo_memberships,public\.haus_combo_uses from PUBLIC,anon,authenticated/i);
 assert.match(sql,/public\.is_admin\(\)/g);
 assert.match(sql,/grant execute on function public\.haus_combo_redeem_visit/);
});
test('payment is entered once at subscription creation and not at redemption',()=>{
 const sales=sql.match(/insert into public\.cash_entries/g)||[];
 assert.equal(sales.length,1);
 assert.match(sql,/v_paid<>v_plan\.price_cents/);
 assert.match(sql,/haus_combo_membership_id/);
 assert.match(sql,/v_cash_received-v_cash/);
});
test('redemption is serialized, atomically records a visit and allows reasoned correction',()=>{
 assert.match(sql,/haus_combo_membership\|/g);
 assert.match(sql,/haus_combo_redeem_visit/);
 assert.match(sql,/foreach v_kind in array p_kinds loop/);
 assert.match(sql,/voided_by=auth\.uid\(\)/);
 assert.match(sql,/haus_combo_unique_daily_use/);
});
test('no admin theme picker or configurable color fields added',()=>{
 assert.doesNotMatch(html,/theme\-picker|change\-colors|seletor de cor/i);
 assert.doesNotMatch(js,/theme\-picker|change\-colors/i);
 assert.match(css, /--red:#c8483e/);
 assert.match(css, /--bg:#080d1b/);
});
test('subscriptions panel requires authenticated admin session',()=>{
 assert.match(js,/client\.auth\.getUser\(\)/);
 assert.match(js,/rpc\('is_admin'\)/);
 assert.match(html,/id="authGate"/);
});
test('ledger contains customer search, renew, correction, and visit form',()=>{
 for(const id of ['searchInput','newButton','createForm','planStart','customerPhone','visitForm','detailModal','renewButton','cashChange','payCash','payPix','payDebit','payCredit'])
  assert.ok(html.includes('id="'+id+'"'),id);
 for(const term of ['haus_combo_create','haus_combo_admin_catalog','haus_combo_admin_list','haus_combo_admin_history','haus_combo_redeem_visit','haus_combo_void_use'])assert.ok(js.includes(term),term);
 assert.match(js,/escapeHtml\(/);
 assert.match(js,/brasilToday\(/);
});
test('front end files parse',()=>{
 assert.doesNotThrow(()=>new Function(js));
 assert.match(html,/haus-combos\.css\?v=1\.2/);
 assert.match(html,/haus-combos\.js\?v=1\.3/);
});
test('entry point exists in existing admin panel',()=>{
 const admin=read('admin.html');
 assert.match(admin,/href="admin-combos\.html"/);
});
