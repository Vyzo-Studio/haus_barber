/* HAUS | Assinaturas de 45 dias. Dados e autorizações exclusivamente via Supabase. */
'use strict';
const $ = (id) => document.getElementById(id);
const client = window.supabaseClient;
const state = {plans:[],barbers:[],memberships:[],filter:'all',detailId:null,visitId:null,history:[],statusEvents:[],manage:null,loading:false,saving:false,createRequestId:null,visitRequestId:null};
const KINDS = [{id:'cut',label:'Corte',total:'cuts_total',used:'cuts_used'},{id:'beard',label:'Barba',total:'beards_total',used:'beards_used'},{id:'brows',label:'Sobrancelha',total:'brows_total',used:'brows_used'}];
const PAY_FIELDS = {cash:$('payCash'),pix:$('payPix'),debit:$('payDebit'),credit:$('payCredit')};
const money = (cents) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((Number(cents)||0)/100);
const escapeHtml = (value) => String(value??'').replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fullDate = (value) => {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return '—';
  const [y,m,d]=value.split('-');return d+'/'+m+'/'+y;
};
function brasilToday(){
  const p = new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part=(n)=>p.find(x=>x.type===n)?.value||'';
  return part('year')+'-'+part('month')+'-'+part('day');
}
function shiftDay(date,days){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date)))return '';
  const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);
}
const digits=(phone)=>String(phone||'').replace(/\D/g,'');
function displayPhone(v){
  const p=digits(v).replace(/^55/,'');
  return p.length===11?'+55 ('+p.slice(0,2)+') '+p.slice(2,7)+'-'+p.slice(7):
    p.length===10?'+55 ('+p.slice(0,2)+') '+p.slice(2,6)+'-'+p.slice(6):String(v||'');
}
function rpc(name,args={}){
  if(!client) return Promise.reject(new Error('A conexão com a Haus não está disponível.'));
  return client.rpc(name,args).then(({data,error})=>{if(error)throw error;return data;});
}
function toast(text,bad=false){
  const el=$('toast');el.textContent=String(text);el.classList.toggle('error',bad);el.hidden=false;
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>{el.hidden=true},5500);
}
function friendly(error){
  const m=String(error?.message||'Erro não identificado.');
  if(/permission denied|acesso administrativo|not authenticated|jwt/i.test(m))return 'Acesso administrativo necessário. Entre novamente no painel.';
  if(/caixa.*hoje/i.test(m))return 'Abra o caixa de hoje no painel principal antes de cadastrar a assinatura.';
  if(/unique|duplicate key/i.test(m))return 'Já existe um registro com esses dados. Atualize a página e confira antes de repetir.';
  return m.length>230?m.slice(0,230)+'…':m;
}
function setSaving(busy){
  state.saving=busy;
  ['createSubmit','visitSubmit'].forEach(id=>{const el=$(id);if(el)el.disabled=busy});
}
const modalOrigin=new WeakMap();
const modalFocusable='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function topModal(){
  return [...document.querySelectorAll('.modal-backdrop:not([hidden])')].pop()||null;
}
function focusInside(modal,preferLast=false){
  const controls=[...modal.querySelectorAll(modalFocusable)].filter(el=>!el.hidden&&!el.closest('[hidden]'));
  const target=preferLast?controls.at(-1):controls[0];
  (target||modal.querySelector('[role="dialog"]'))?.focus();
}
function syncModalInert(){
  const open=!!topModal();
  const app=$('comboApp');
  if(app)app.inert=open;
  const gate=$('authGate');
  if(gate)gate.inert=open;
}
function openModal(id){
  const modal=$(id);if(!modal)return;
  modalOrigin.set(modal,document.activeElement);
  modal.hidden=false;document.body.classList.add('locked');
  syncModalInert();
  focusInside(modal);
}
function closeModal(id){
  if(state.saving)return;
  const modal=$(id);if(!modal)return;
  modal.hidden=true;
  syncModalInert();
  const current=topModal();
  document.body.classList.toggle('locked',!!current);
  const origin=modalOrigin.get(modal);
  if(origin?.isConnected&&!origin.closest('[hidden]')&&!origin.closest('[inert]')){
    origin.focus();
  }else if(current)focusInside(current);
  else $('newButton')?.focus();
  modalOrigin.delete(modal);
}
document.addEventListener('click',(event)=>{
  const close=event.target.closest('[data-close]');if(close)closeModal(close.dataset.close);
  if(event.target.classList?.contains('modal-backdrop'))closeModal(event.target.id);
});
document.addEventListener('keydown',(event)=>{
  const modal=topModal();if(!modal)return;
  if(event.key==='Escape'&&!state.saving){event.preventDefault();closeModal(modal.id);return}
  if(event.key!=='Tab')return;
  const controls=[...modal.querySelectorAll(modalFocusable)].filter(el=>!el.hidden&&!el.closest('[hidden]'));
  if(!controls.length){event.preventDefault();focusInside(modal);return}
  const first=controls[0],last=controls[controls.length-1];
  if(event.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){
    event.preventDefault();last.focus();
  }else if(!event.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){
    event.preventDefault();first.focus();
  }
});
document.addEventListener('focusin',(event)=>{
  const modal=topModal();
  if(modal&&!modal.contains(event.target))focusInside(modal);
});
async function verify(){
  if(!client){$('authMessage').textContent='Falha ao carregar a conexão segura. Recarregue a página.';return}
  try {
    const {data:{user},error}=await client.auth.getUser();
    if(error||!user){$('authGate').hidden=false;$('comboApp').hidden=true;return}
    if(await rpc('is_admin')!==true)throw new Error('Usuário não autorizado ao painel.');
    $('authGate').hidden=true;$('comboApp').hidden=false;
    await refresh();
  }catch(error){
    $('authGate').hidden=false;$('comboApp').hidden=true;
    $('authMessage').textContent=friendly(error);
  }
}
$('loginForm').addEventListener('submit',async(event)=>{
  event.preventDefault();const button=$('loginButton');button.disabled=true;
  $('authMessage').textContent='Verificando acesso…';
  try{
    if(!client)throw new Error('Conexão com o banco indisponível.');
    const {error}=await client.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});
    if(error)throw error;
    $('loginPassword').value='';
    await verify();
  }catch(error){$('authMessage').textContent=friendly(error)}
  finally{button.disabled=false}
});
$('logoutButton').addEventListener('click',async()=>{
  await client?.auth.signOut();$('comboApp').hidden=true;$('authGate').hidden=false;
  $('authMessage').textContent='Entre com sua conta administrativa.';
});
function remaining(m,k){return Math.max(0,Number(m[k.total])-Number(m[k.used]||0))}
function computedStatus(m){
  const today=brasilToday();
  if(m.status==='canceled')return 'canceled';
  if(m.start_date>today)return 'upcoming';
  if(today>=m.expires_on)return 'expired';
  if(KINDS.every(k=>remaining(m,k)===0))return 'complete';
  if(Number(m.days_left)<=7)return 'expiring';
  return 'active';
}
const STATE_LABELS={active:'ATIVO',expiring:'A VENCER',expired:'VENCIDO',complete:'CONCLUÍDO',upcoming:'AGENDADO',canceled:'CANCELADO'};
function planLine(m){
  return KINDS.filter(k=>Number(m[k.total])>0).map(k=>m[k.total]+' '+k.label.toLowerCase()+(Number(m[k.total])>1?'s':'')).join(' + ');
}
function quotaMarkup(m){
  return KINDS.filter(k=>Number(m[k.total])>0).map(k=>{
    const total=Number(m[k.total]);const left=remaining(m,k);const done=total-left;
    return '<div class="quota-item"><div class="quota-text"><span>'+k.label.toUpperCase()+'</span><b>'+left+' RESTANTE'+(left!==1?'S':'')+' DE '+total+'</b></div>'+
    '<div class="quota-progress" aria-label="'+done+' de '+total+' utilizados"><span style="width:'+(done/total*100)+'%"></span></div></div>';
  }).join('');
}
function quotaAdjustments(m){
  const today=brasilToday();
  const canUse=m.status==='active'&&m.start_date<=today&&today<m.expires_on;
  const items=KINDS.filter(k=>Number(m[k.total])>0);
  if(!items.length)return '';
  return '<div class="quota-adjustment"><div class="quota-adjustment-head">'+
    '<strong>AJUSTAR UTILIZAÇÕES</strong><small>− dar baixa · + desfazer baixa</small></div>'+
    '<div class="quota-adjustment-list">'+items.map(k=>{
      const left=remaining(m,k);
      const used=Number(m[k.used]||0);
      return '<div class="quota-adjust-row"><span>'+escapeHtml(k.label.toUpperCase())+'</span>'+
        '<div class="quota-adjust-buttons">'+
          '<button type="button" data-action="consume" data-id="'+m.id+'" data-kind="'+k.id+'" '+
          'aria-label="Dar baixa em um serviço de '+escapeHtml(k.label)+' de '+escapeHtml(m.full_name)+'" '+
          (!canUse||!left?'disabled title="Sem saldo disponível, fora da validade ou cancelado"':'')+'>− USAR 1</button>'+
          '<button type="button" data-action="return" data-id="'+m.id+'" data-kind="'+k.id+'" '+
          'aria-label="Devolver um serviço de '+escapeHtml(k.label)+' ao saldo de '+escapeHtml(m.full_name)+'" '+
          (!used?'disabled title="Nenhuma utilização registrada para devolver"':'')+'>+ DEVOLVER 1</button>'+
        '</div></div>';
    }).join('')+'</div></div>';
}
function memberCard(m){
  const status=computedStatus(m);const totalLeft=KINDS.reduce((n,k)=>n+remaining(m,k),0);
  const canUse=m.status==='active'&&m.start_date<=brasilToday()&&brasilToday()<m.expires_on&&totalLeft>0;
  const label=(status==='expired'?'VENCIDO':status==='upcoming'?'INICIA EM': 'DIAS RESTANTES');
  const daysLabel=status==='expired'?'0':status==='upcoming'?fullDate(m.start_date):String(m.days_left);
  return '<article class="membership-card"><div class="card-head"><div><h3>'+escapeHtml(m.full_name)+'</h3><p>'+escapeHtml(displayPhone(m.whatsapp_digits))+'</p></div>'+
    '<span class="status '+status+'">'+STATE_LABELS[status]+'</span></div>'+
    '<div class="card-plan"><strong>'+escapeHtml(m.plan_name)+'</strong><small>'+money(m.price_cents)+'</small></div>'+
    '<div class="quota-list">'+quotaMarkup(m)+'</div>'+quotaAdjustments(m)+
    '<div class="card-bottom"><div><span>'+label+'</span><strong>'+daysLabel+'</strong></div>'+
    '<div class="card-buttons"><button type="button" data-action="detail" data-id="'+m.id+'">DETALHES</button>'+
    '<button type="button" data-action="visit" data-id="'+m.id+'" class="primary" '+(!canUse?'disabled title="Sem saldo ou contrato ainda não iniciado"':'')+'>＋ BAIXAR</button></div></div></article>';
}
function filtered(){
  const term=$('searchInput').value.trim().toLocaleLowerCase('pt-BR').replace(/\s/g,'');
  return state.memberships.filter(m=>{
    const status=computedStatus(m);
    if(state.filter!=='canceled'&&status==='canceled')return false;
    if(state.filter==='canceled'&&status!=='canceled')return false;
    if(state.filter==='active'&&!['active','expiring','upcoming'].includes(status))return false;
    if(state.filter==='expiring'&&status!=='expiring')return false;
    if(state.filter==='expired'&&status!=='expired')return false;
    if(state.filter==='complete'&&status!=='complete')return false;
    if(!term)return true;
    return [m.full_name,m.plan_name,m.whatsapp_digits,displayPhone(m.whatsapp_digits)].some(v=>String(v||'').toLocaleLowerCase('pt-BR').replace(/\s/g,'').includes(term));
  });
}
function render(){
  const counts={active:0,expiring:0,complete:0,expired:0};
  state.memberships.forEach(m=>{
    const s=computedStatus(m);if(['active','expiring','upcoming'].includes(s))counts.active++;
    if(s==='expiring')counts.expiring++;
    if(s==='complete')counts.complete++;
    if(s==='expired')counts.expired++;
  });
  $('kpiActive').textContent=counts.active;$('kpiExpiring').textContent=counts.expiring;
  $('kpiComplete').textContent=counts.complete;$('kpiExpired').textContent=counts.expired;
  if($('canceledCount'))$('canceledCount').textContent=String(state.memberships.filter(m=>m.status==='canceled').length);
  const items=filtered();$('memberships').innerHTML=items.map(memberCard).join('');
  $('empty').hidden=items.length!==0;$('loading').hidden=true;
}
async function refresh(){
  if(state.loading)return;
  state.loading=true;
  $('loading').hidden=false;$('loading').textContent='Atualizando assinaturas…';
  try{
    const snapshot=await rpc('haus_combo_admin_summary');
    if(!snapshot||!Array.isArray(snapshot.memberships)||!Array.isArray(snapshot.plans))throw new Error('Resposta do sistema de combos inválida.');
    state.plans=snapshot.plans;state.memberships=snapshot.memberships;state.barbers=snapshot.barbers||[];
    render();
  }catch(error){$('loading').textContent=friendly(error);toast(friendly(error),true)}
  finally{state.loading=false}
}
$('refreshButton').addEventListener('click',refresh);
$('searchInput').addEventListener('input',render);
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
  state.filter=b.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(el=>{const on=el===b;el.classList.toggle('is-active',on);el.setAttribute('aria-pressed',String(on))});
  render();
}));
$('memberships').addEventListener('click',(event)=>{
  const target=event.target.closest('button[data-action]');if(!target)return;
  const m=state.memberships.find(x=>x.id===target.dataset.id);if(!m)return;
  if(target.dataset.action==='detail')openDetail(m.id);
  if(target.dataset.action==='visit')openVisit(m.id);
  if(target.dataset.action==='consume')openVisit(m.id,target.dataset.kind);
  if(target.dataset.action==='return')beginReturn(m.id,target.dataset.kind);
});
function selectedPlan(){return state.plans.find(p=>p.id===$('planSelect').value)}
function planPrice(){return Number(selectedPlan()?.price_cents||0)}
function toCents(v){
  const n=Number(v);
  if(!Number.isFinite(n)||n<0||n>999999.99)return NaN;
  return Math.round(n*100);
}
function payments(){
  return Object.entries(PAY_FIELDS).map(([method,field])=>({method,cents:toCents(field.value||0)})).filter(x=>x.cents>0);
}
function resetRequest(){state.createRequestId=null}
function updatePayment(){
  const price=planPrice();const parts=payments();
  const entered=parts.reduce((n,p)=>n+p.cents,0);
  const invalid=Object.values(PAY_FIELDS).some(x=>!Number.isFinite(toCents(x.value||0)));
  const cash=parts.find(p=>p.method==='cash')?.cents||0;
  const received=$('cashReceived').value.trim()===''?cash:toCents($('cashReceived').value);
  $('cashRow').hidden=cash===0;
  $('distributed').textContent=money(entered);
  $('difference').textContent=money(price-entered);
  $('difference').classList.toggle('error',invalid||price!==entered);
  $('cashChange').textContent=money(Math.max(0,received-cash));
  $('cashChange').classList.toggle('error',received<cash);
  $('createSubmit').disabled=state.saving||!price||invalid||price!==entered||received<cash;
}
function updatePlan(){
  const p=selectedPlan(),start=$('planStart').value;
  $('planPrice').textContent=money(p?.price_cents);
  $('planAllowances').textContent=p?
    [p.cuts_total&&p.cuts_total+' cortes',p.beards_total&&p.beards_total+' barbas',p.brows_total&&p.brows_total+' sobrancelhas'].filter(Boolean).join(' + ')+' · 45 dias':
    'Selecione um plano para conhecer as quantidades.';
  $('expiresPreview').textContent=start?'Último uso: '+fullDate(shiftDay(start,44)):'—';
  Object.values(PAY_FIELDS).forEach(f=>{f.value=''});
  $('cashReceived').value='';
  updatePayment();
}
function openCreate(member=null){
  $('createForm').reset();state.createRequestId=null;
  $('planSelect').innerHTML='<option value="">Escolha o plano</option>'+
    state.plans.map(p=>'<option value="'+escapeHtml(p.id)+'">'+escapeHtml(p.name)+' — '+money(p.price_cents)+'</option>').join('');
  $('customerName').value=member?.full_name||'';
  $('customerPhone').value=member?displayPhone(member.whatsapp_digits):'';
  $('planSelect').value=member?.plan_id||'';
  $('planStart').value=brasilToday();
  $('planStart').min='2020-01-01';$('planStart').max=shiftDay(brasilToday(),365);
  updatePlan();
  openModal('createModal');
}
$('newButton').addEventListener('click',()=>openCreate());
$('planSelect').addEventListener('change',()=>{resetRequest();updatePlan()});
$('planStart').addEventListener('change',()=>{resetRequest();updatePlan()});
['customerName','customerPhone','contractNotes','cashReceived'].forEach(id=>$(id).addEventListener('input',()=>{resetRequest();updatePayment()}));
Object.values(PAY_FIELDS).forEach(f=>f.addEventListener('input',()=>{resetRequest();updatePayment()}));
document.querySelectorAll('[data-quick]').forEach(button=>button.addEventListener('click',()=>{
  const price=planPrice();Object.entries(PAY_FIELDS).forEach(([key,f])=>{f.value=key===button.dataset.quick?(price/100).toFixed(2):''});
  $('cashReceived').value='';resetRequest();updatePayment();
}));
$('createForm').addEventListener('submit',async(event)=>{
  event.preventDefault();if(state.saving||!$('createForm').reportValidity())return;
  const plan=selectedPlan(),parts=payments(),total=parts.reduce((n,p)=>n+p.cents,0);
  const cash=parts.find(p=>p.method==='cash')?.cents||0;
  const received=$('cashReceived').value.trim()===''?cash:toCents($('cashReceived').value);
  if(!plan||!parts.length||total!==plan.price_cents||parts.some(x=>!Number.isFinite(x.cents))||received<cash){
    toast('Confira os valores do pagamento. O total precisa corresponder ao plano.',true);return;
  }
  if(!state.createRequestId)state.createRequestId=crypto.randomUUID();
  setSaving(true);$('createSubmit').textContent='REGISTRANDO…';
  try{
    const id=await rpc('haus_combo_create',{
      p_request_id:state.createRequestId,p_customer_name:$('customerName').value.trim(),
      p_whatsapp:$('customerPhone').value,p_plan_id:plan.id,p_start_date:$('planStart').value,
      p_payments:parts,p_cash_received_cents:cash>0?received:null,
      p_notes:$('contractNotes').value.trim()||null
    });
    state.createRequestId=null;
    setSaving(false);closeModal('createModal');
    toast('Plano cadastrado e pagamento registrado no caixa de hoje.');
    await refresh();if(id)await openDetail(id);
  }catch(error){toast(friendly(error),true)}
  finally{setSaving(false);$('createSubmit').textContent='CADASTRAR E RECEBER';updatePayment()}
});
function memberById(id){return state.memberships.find(x=>x.id===id)}
async function openDetail(id){
  const m=memberById(id);if(!m)return;
  state.detailId=id;
  $('detailTitle').textContent='FICHA DO CLIENTE';
  $('detailBody').innerHTML='<p class="detail-empty">Carregando histórico…</p>';
  openModal('detailModal');
  try{
    const [uses,events]=await Promise.all([
      rpc('haus_combo_admin_history',{p_membership_id:id}),
      rpc('haus_combo_admin_status_history',{p_membership_id:id})
    ]);
    if(state.detailId!==id)return;
    state.history=Array.isArray(uses)?uses:[];
    state.statusEvents=Array.isArray(events)?events:[];
    renderDetail();
  }catch(error){$('detailBody').textContent=friendly(error)}
}
function renderDetail(){
  const m=memberById(state.detailId);if(!m)return;
  const status=computedStatus(m);
  const validTo=fullDate(shiftDay(m.expires_on,-1));
  let out='<div class="detail-profile"><div><h3>'+escapeHtml(m.full_name)+'</h3><small>'+escapeHtml(m.plan_name)+' · '+money(m.price_cents)+'</small><br>'+
    '<a target="_blank" rel="noopener noreferrer" href="https://wa.me/'+escapeHtml(m.whatsapp_digits)+'">↗ '+escapeHtml(displayPhone(m.whatsapp_digits))+'</a></div>'+
    '<span class="status '+status+'">'+STATE_LABELS[status]+'</span></div>'+
    '<div class="detail-grid"><div class="detail-stat"><span>CONTRATAÇÃO</span><strong>'+fullDate(m.start_date)+'</strong></div>'+
    '<div class="detail-stat"><span>ÚLTIMO DIA DE USO</span><strong>'+validTo+'</strong></div>'+
    '<div class="detail-stat"><span>DIAS RESTANTES</span><strong>'+m.days_left+'</strong></div></div>'+
    '<div class="quota-list">'+quotaMarkup(m)+'</div>';
  out+=quotaAdjustments(m);
  if(m.notes)out+='<p class="helper" style="margin-top:17px">OBSERVAÇÃO: '+escapeHtml(m.notes)+'</p>';
  out+='<div class="history-head"><h3>HISTÓRICO DE UTILIZAÇÃO</h3></div>';
  out+='<div class="history-list">'+(state.history.length?state.history.map(h=>{
    const type=KINDS.find(k=>k.id===h.kind)?.label||h.kind;
    const isVoid=!!h.voided_at;
    return '<div class="history-row '+(isVoid?'is-void':'')+'"><div><strong>'+escapeHtml(type.toUpperCase())+(isVoid?' · CORRIGIDO':'')+'</strong>'+
      '<small>'+fullDate(h.used_on)+(h.used_time?' · '+escapeHtml(String(h.used_time).slice(0,5)):'')+
      (h.barber_name?' · '+escapeHtml(h.barber_name):'')+'</small>'+
      (h.note?'<small>'+escapeHtml(h.note)+'</small>':'')+
      (isVoid?'<small>Motivo: '+escapeHtml(h.void_reason||'Não informado')+'</small>':'')+'</div>'+
      (!isVoid?'<button type="button" data-void="'+escapeHtml(h.id)+'">+ DEVOLVER 1</button>':'')+'</div>';
  }).join(''):'<div class="detail-empty">Nenhum atendimento utilizado ainda.</div>')+'</div>';

  if(state.statusEvents.length){
    out+='<div class="history-head"><h3>ALTERAÇÕES DA ASSINATURA</h3></div>'+
      '<div class="history-list">'+state.statusEvents.map(e=>
        '<div class="history-row"><div><strong>'+
        (e.event_type==='canceled'?'COMBO CANCELADO':'COMBO RESTAURADO')+
        '</strong><small>'+escapeHtml(new Date(e.created_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}))+
        '</small><small>Motivo: '+escapeHtml(e.reason)+'</small></div></div>'
      ).join('')+'</div>';
  }
  $('detailBody').innerHTML=out;
  const statusButton=$('membershipStatusButton');
  if(statusButton){
    const canceled=m.status==='canceled';
    statusButton.textContent=canceled?'↶ RESTAURAR COMBO':'CANCELAR E ARQUIVAR COMBO';
    statusButton.classList.toggle('danger',!canceled);
    statusButton.classList.toggle('outline',canceled);
  }
  $('detailBody').querySelectorAll('[data-void]').forEach(button=>
    button.addEventListener('click',()=>beginReturn(m.id,null,button.dataset.void))
  );
  $('renewButton').disabled=false;
}
function openManagement(action,member,use=null){
  if(!member)return;
  state.manage={action,memberId:member.id,useId:use?.id||null};
  const labels=KINDS.find(k=>k.id===use?.kind)?.label||'serviço';
  const cancel=action==='cancel',restore=action==='restore',reversal=action==='return';
  $('manageEyebrow').textContent=reversal?'CORREÇÃO DE UTILIZAÇÃO':'GESTÃO DE ASSINATURA';
  $('manageTitle').textContent=reversal?'DEVOLVER 1 CRÉDITO':cancel?'CANCELAR COMBO':'RESTAURAR COMBO';
  $('manageReason').value='';
  $('manageReason').placeholder=reversal?'Ex.: uso lançado por engano':
    cancel?'Ex.: cliente solicitou cancelamento':'Ex.: cancelamento feito por engano';
  $('manageDescription').textContent=reversal
    ?'Será desfeito um lançamento de '+labels+' realizado em '+fullDate(use.used_on)+
     ' no combo de '+member.full_name+'. Um crédito retornará ao saldo. O lançamento original permanecerá no histórico.'
    :cancel
    ?'O combo '+member.plan_name+' de '+member.full_name+' será cancelado e retirado da lista principal. Você ainda poderá consultá-lo na aba Cancelados.'
    :'O combo de '+member.full_name+' voltará à lista de assinaturas. Sua validade original ('+
     fullDate(member.start_date)+' a '+fullDate(shiftDay(member.expires_on,-1))+') não será reiniciada.';
  $('manageWarning').hidden=reversal;
  $('manageWarning').textContent=cancel
    ?'ATENÇÃO: cancelar e arquivar não gera estorno financeiro nem devolve dinheiro ao cliente. O pagamento permanece no caixa e no histórico.'
    :restore
    ?'A restauração não altera o valor já recebido nem prorroga o prazo de 45 dias.'
    :'';
  $('manageConfirm').textContent=reversal?'+ DEVOLVER CRÉDITO':cancel?'CANCELAR E ARQUIVAR':'RESTAURAR ASSINATURA';
  $('manageConfirm').classList.toggle('danger',cancel);
  $('manageConfirm').classList.toggle('primary',!cancel);
  $('manageConfirm').disabled=false;
  openModal('manageModal');
  $('manageReason').focus();
}
async function beginReturn(memberId,kind=null,useId=null){
  if(state.saving)return;
  const member=memberById(memberId);if(!member)return;
  try{
    const useList=state.detailId===memberId&&!$('detailModal').hidden
      ?state.history
      :await rpc('haus_combo_admin_history',{p_membership_id:memberId});
    const found=[...(Array.isArray(useList)?useList:[])].filter(u=>
      !u.voided_at&&(!kind||u.kind===kind)&&(!useId||u.id===useId)
    ).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')))[0];
    if(!found){toast('Não há utilização para devolver. Atualize os saldos e confira o histórico.',true);await refresh();return}
    openManagement('return',member,found);
  }catch(error){toast(friendly(error),true)}
}
function beginStatusAction(){
  if(state.saving)return;
  const m=memberById(state.detailId);
  if(m)openManagement(m.status==='canceled'?'restore':'cancel',m);
}
$('membershipStatusButton').addEventListener('click',beginStatusAction);
$('detailBody').addEventListener('click',(event)=>{
  const target=event.target.closest('button[data-action]');
  if(!target)return;
  if(target.dataset.action==='consume')openVisit(target.dataset.id,target.dataset.kind);
  if(target.dataset.action==='return')beginReturn(target.dataset.id,target.dataset.kind);
});
$('manageForm').addEventListener('submit',async(event)=>{
  event.preventDefault();
  if(state.saving||!state.manage||!$('manageForm').reportValidity())return;
  const reason=$('manageReason').value.trim();
  if(reason.length<5||reason.length>250){toast('Informe um motivo de 5 a 250 caracteres.',true);return}
  const action={...state.manage};
  const detailVisible=!$('detailModal').hidden&&state.detailId===action.memberId;
  setSaving(true);$('manageConfirm').disabled=true;$('manageConfirm').textContent='PROCESSANDO…';
  try{
    if(action.action==='return')await rpc('haus_combo_void_use',{p_use_id:action.useId,p_reason:reason});
    else if(action.action==='cancel')await rpc('haus_combo_cancel',{p_membership_id:action.memberId,p_reason:reason});
    else if(action.action==='restore')await rpc('haus_combo_restore',{p_membership_id:action.memberId,p_reason:reason});
    else throw new Error('Ação administrativa inválida.');
    state.manage=null;
    setSaving(false);
    closeModal('manageModal');
    if(action.action!=='return')closeModal('detailModal');
    const message=action.action==='return'
      ?'Utilização desfeita. Um crédito foi devolvido ao saldo, com registro no histórico.'
      :action.action==='cancel'
      ?'Combo cancelado e arquivado. Ele está na aba Cancelados; o caixa não foi alterado.'
      :'Combo restaurado sem alterar o prazo nem os pagamentos anteriores.';
    await refresh();
    if(action.action==='return'&&detailVisible)await openDetail(action.memberId);
    toast(message);
  }catch(error){toast(friendly(error),true)}
  finally{setSaving(false);$('manageConfirm').disabled=false}
});
$('renewButton').addEventListener('click',()=>{
  const m=memberById(state.detailId);closeModal('detailModal');if(m)openCreate(m);
});
function openVisit(id,preselectKind=''){
  const m=memberById(id);if(!m)return;
  if(m.status!=='active'||m.start_date>brasilToday()||brasilToday()>=m.expires_on){
    toast('O combo não está dentro do período de utilização.',true);return;
  }
  state.visitId=id;state.visitRequestId=null;
  $('visitForm').reset();$('visitCustomer').textContent=m.full_name+' · '+m.plan_name;
  $('visitBarber').innerHTML='<option value="">Não informado</option>'+state.barbers.map(b=>'<option value="'+escapeHtml(b.id)+'">'+escapeHtml(b.name)+'</option>').join('');
  KINDS.forEach(k=>{
    const left=remaining(m,k),row=$(k.id+'Option');
    row.hidden=left===0;
    const check=row.querySelector('input');check.disabled=left===0;check.checked=!!left&&k.id===preselectKind;
    $(k.id+'Left').textContent=left+' de '+m[k.total]+' disponíveis';
  });
  const last=shiftDay(m.expires_on,-1),today=brasilToday();
  $('visitDate').min=m.start_date;$('visitDate').max=last<today?last:today;
  $('visitDate').value=today<last?today:last;
  openModal('visitModal');
}
$('visitForm').addEventListener('input',()=>{state.visitRequestId=null});
$('visitForm').addEventListener('submit',async(event)=>{
  event.preventDefault();if(state.saving||!$('visitForm').reportValidity())return;
  const m=memberById(state.visitId);if(!m)return;
  const kinds=[...document.querySelectorAll('[name="useKind"]:checked')].map(x=>x.value);
  if(!kinds.length){toast('Selecione ao menos um serviço realizado.',true);return}
  if(!state.visitRequestId)state.visitRequestId=crypto.randomUUID();
  setSaving(true);$('visitSubmit').textContent='SALVANDO…';
  try{
    await rpc('haus_combo_redeem_visit',{
      p_request_id:state.visitRequestId,p_membership_id:m.id,p_kinds:kinds,
      p_used_on:$('visitDate').value,
      p_used_time:$('visitTime').value||null,
      p_barber_id:$('visitBarber').value||null,
      p_note:$('visitNote').value.trim()||null
    });
    state.visitRequestId=null;setSaving(false);closeModal('visitModal');
    toast('Visita registrada e '+kinds.length+' serviço'+(kinds.length>1?'s':'')+' contabilizado'+(kinds.length>1?'s':'')+'.');
    await refresh();await openDetail(m.id);
  }catch(error){toast(friendly(error),true)}
  finally{setSaving(false);$('visitSubmit').textContent='CONFIRMAR UTILIZAÇÃO'}
});
verify();