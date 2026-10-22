'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const js=read('haus-combos.js');
const html=read('admin-combos.html');
const css=read('haus-combos.css');
const sql=read('supabase/migrations/20261021_haus_combo_corrections_and_cancellation.sql');

function section(from,to){
 const start=js.indexOf(from),end=js.indexOf(to,start+from.length);
 assert.ok(start>=0&&end>start,'Missing JS section '+from);
 return js.slice(start,end);
}
test('new JavaScript is valid and HTML loads versioned assets',()=>{
 assert.doesNotThrow(()=>new Function(js));
 assert.match(html,/haus-combos\.js\?v=1\.2/);
 assert.match(html,/haus-combos\.css\?v=1\.1/);
});
test('all view excludes canceled memberships, while archive view includes them',()=>{
 const source=section('function filtered(){','function render(){');
 const state={
   filter:'all',
   memberships:[
     {id:'active',status:'active',full_name:'Ana',plan_name:'Cortes',whatsapp_digits:'5511999999999'},
     {id:'canceled',status:'canceled',full_name:'Carlos',plan_name:'Barbas',whatsapp_digits:'5511988888888'}
   ]
 };
 const search={value:''};
 const compiled=new Function('state','$','computedStatus','displayPhone',
    source+'return filtered;');
 const filtered=compiled(state,()=>search,m=>m.status,m=>m.whatsapp_digits);
 assert.deepEqual(filtered().map(m=>m.id),['active']);
 state.filter='canceled';
 assert.deepEqual(filtered().map(m=>m.id),['canceled']);
 search.value='Carlos';
 assert.deepEqual(filtered().map(m=>m.id),['canceled']);
 search.value='Ana';
 assert.deepEqual(filtered(),[]);
});
test('quota controls allow plus and minus but respect limits and status',()=>{
 const source=section('function quotaAdjustments(m){','function memberCard(m){');
 const kinds=[
  {id:'cut',label:'Corte',total:'cuts_total',used:'cuts_used'},
  {id:'beard',label:'Barba',total:'beards_total',used:'beards_used'}
 ];
 const compiled=new Function('brasilToday','KINDS','remaining','escapeHtml',
   source+'return quotaAdjustments;');
 const now=()=> '2026-10-21';
 const quota=compiled(now,kinds,(m,k)=>Math.max(0,m[k.total]-m[k.used]),v=>String(v));
 const active={id:'id',full_name:'Cliente',status:'active',start_date:'2026-10-05',
   expires_on:'2026-11-19',cuts_total:4,cuts_used:1,beards_total:4,beards_used:0};
 const on=quota(active);
 assert.match(on,/data-action="consume" data-id="id" data-kind="cut"/);
 assert.match(on,/data-action="return" data-id="id" data-kind="cut"/);
 assert.match(on,/− USAR 1/);
 assert.match(on,/\+ DEVOLVER 1/);
 assert.match(on,/disabled title="Nenhuma utilização registrada para devolver"/);
 const canceled=quota({...active,status:'canceled'});
 assert.match(canceled,/disabled title="Sem saldo disponível, fora da validade ou cancelado"/);
 const expired=quota({...active,expires_on:'2026-10-20'});
 assert.match(expired,/disabled title="Sem saldo disponível, fora da validade ou cancelado"/);
});
test('UI uses an audited confirmation for returning credits',()=>{
 assert.match(html,/id="manageModal"/);
 assert.match(html,/id="manageReason"[^>]*minlength="5"[^>]*required/);
 assert.match(js,/haus_combo_void_use/);
 assert.match(js,/p_use_id:action.useId,p_reason:reason/);
 assert.match(js,/Não há utilização para devolver/);
 assert.doesNotMatch(js,/window\.prompt\(/);
});
test('cancel is soft archive and remains accessible through a canceled filter',()=>{
 assert.match(html,/data-filter="canceled"/);
 assert.match(html,/id="membershipStatusButton"/);
 assert.match(js,/state\.filter!=='canceled'&&status==='canceled'/);
 assert.match(js,/state\.filter==='canceled'&&status!=='canceled'/);
 assert.match(js,/haus_combo_cancel/);
 assert.match(js,/haus_combo_restore/);
 assert.match(sql,/status='canceled'/);
 assert.match(sql,/status='active'/);
 assert.doesNotMatch(sql,/\bdelete\s+from\s+public\.haus_combo/i);
});
test('no cash activity or expiration is modified when canceling',()=>{
 const cancelFn=sql.slice(sql.indexOf('create or replace function public.haus_combo_cancel'),
    sql.indexOf('create or replace function public.haus_combo_restore'));
 assert.match(cancelFn,/insert into public\.haus_combo_status_events/);
 assert.doesNotMatch(cancelFn,/cash_entries|cash_sessions|expires_on|price_cents/);
 assert.match(js,/cancelar e arquivar não gera estorno financeiro/i);
});
test('only an admin can cancel, restore or return credit',()=>{
 for(const name of ['haus_combo_cancel','haus_combo_restore','haus_combo_admin_status_history','haus_combo_void_use']){
  assert.match(sql,new RegExp('revoke all on function public\\.'+name));
  assert.match(sql,new RegExp('grant execute on function public\\.'+name));
 }
 assert.ok((sql.match(/public\.is_admin\(\)/g)||[]).length>=4);
 assert.match(sql,/revoke all on public\.haus_combo_status_events from public,anon,authenticated/i);
 assert.match(sql,/haus_combo_status_events enable row level security/i);
});
test('usage return voids one actual event, serializes balance and preserves audit trail',()=>{
 const fn=sql.slice(sql.indexOf('create or replace function public.haus_combo_void_use'));
 assert.match(fn,/pg_advisory_xact_lock/);
 assert.match(fn,/voided_at=now\(\),voided_by=auth\.uid\(\),void_reason=v_reason/);
 assert.match(fn,/where id=p_use_id and voided_at is null/);
 assert.doesNotMatch(fn,/cuts_total\s*=|beards_total\s*=|brows_total\s*=/);
});
test('management actions remain in Haus palette and work responsively',()=>{
 assert.match(css,/--red:#c8483e/);
 assert.match(css,/\.quota-adjustment/);
 assert.match(css,/\.btn\.danger/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.doesNotMatch(html,/type="color"|theme-picker/i);
});
