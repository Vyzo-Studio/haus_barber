'use strict';
const $=(id)=>document.getElementById(id);
const client=window.supabaseClient;
const money=(n)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((Number(n)||0)/100);
const dateOnly=(n)=>n?String(n).slice(0,10).split('-').reverse().join('/'):'—';
const isoDate=(x)=>{try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(x))}catch{return '—'}};
let pending=false;
function status(message,error=false){$('reviewStatus').textContent=message;$('reviewStatus').dataset.error=String(error)}
async function rpc(name,params={}){
 if(!client)throw new Error('Conexão com o painel indisponível.');
 const {data,error}=await client.rpc(name,params);
 if(error)throw error;
 return data;
}
function clear(el){while(el.firstChild)el.removeChild(el.firstChild)}
function element(tag,cls,txt){
 const n=document.createElement(tag);if(cls)n.className=cls;
 if(txt!==undefined)n.textContent=String(txt);return n;
}
function valueBox(label,value){
 const e=element('div');e.append(element('span','',label),element('strong','',value));return e;
}
const options=[['under_review','Em análise'],['explained','Explicado por comprovante'],['requires_correction','Correção necessária']];
function render(rows){
 const root=$('entries');clear(root);
 if(!rows.length){root.append(element('p','reconcile-note','Nenhuma divergência identificada para o conjunto consultado.'));return}
 for(const x of rows){
  const card=element('article','reconcile-row');card.dataset.entryId=x.id;
  const head=element('div','reconcile-meta');
  const heading=element('div');heading.append(element('strong','',money(x.amount_cents)+' · '+String(x.payment_method||'').toUpperCase()),element('div','reconcile-id','Lançamento: '+x.id));
  head.append(heading,element('small','',x.review_status==='not_reviewed'?'PENDENTE DE ANÁLISE':x.review_status==='explained'?'JUSTIFICADO':'REVISÃO: '+x.review_status));
  const dates=element('div','reconcile-dates');
  dates.append(valueBox('DATA DE CAIXA',dateOnly(x.cash_business_date)),
    valueBox('DATA LOCAL DO LANÇAMENTO',isoDate(x.recorded_at)),
    valueBox('DIA DO ATENDIMENTO',dateOnly(x.service_date)));
  card.append(head,dates);
  if(x.justification)card.append(element('p','reconcile-note','Última justificativa: '+x.justification));
  if(x.reviewed_at)card.append(element('p','reconcile-id','Última análise: '+isoDate(x.reviewed_at)+' · '+x.review_count+' histórico(s)'));
  const form=element('form');const sl=element('label','','SITUAÇÃO');
  const select=element('select');select.name='review';select.required=true;select.setAttribute('aria-label','Situação do lançamento '+x.id);
  const initial=x.review_status==='not_reviewed'?'under_review':x.review_status;
  for(const [v,title]of options){const option=document.createElement('option');option.value=v;option.textContent=title;option.selected=v===initial;select.append(option)}
  sl.append(select);
  const nl=element('label','','JUSTIFICATIVA OU REFERÊNCIA DO COMPROVANTE (15 A 1000 CARACTERES)');
  const note=element('textarea');note.required=true;note.minLength=15;note.maxLength=1000;note.rows=3;note.placeholder='Ex.: comprovante conferido com registro do dia; descrever o resultado da análise.';
  nl.append(note);
  const button=element('button','btn primary','REGISTRAR ANÁLISE');button.type='submit';
  form.append(sl,nl,button);
  form.addEventListener('submit',async(e)=>{
    e.preventDefault();if(pending||!form.reportValidity())return;
    pending=true;button.disabled=true;
    try{
      await rpc('haus_admin_record_cash_review',{p_entry_id:x.id,p_review_status:select.value,p_justification:note.value.trim()});
      status('Análise registrada sem alterar lançamentos financeiros.');
      await reload();
    }catch(error){status('Falha ao registrar análise: '+String(error.message||error),true)}
    finally{pending=false;button.disabled=false}
  });
  card.append(form);root.append(card);
 }
}
async function reload(){
 status('Consultando lançamentos de caixa...');
 try{
  const rows=await rpc('haus_admin_cash_reconciliation');
  if(!Array.isArray(rows))throw new Error('Resposta inválida do banco.');
  render(rows);
  status(rows.length+' registro(s) requerem conferência de datas. Histórico financeiro preservado.');
 }catch(error){status('Não foi possível carregar: '+String(error.message||error),true)}
}
async function verify(){
 if(!client){$('authMessage').textContent='Conexão indisponível.';return}
 try{
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user){$('authGate').hidden=false;$('reconciliationApp').hidden=true;return}
  if(await rpc('is_admin')!==true)throw new Error('Conta não autorizada.');
  $('authGate').hidden=true;$('reconciliationApp').hidden=false;
  await reload();
 }catch(error){$('reconciliationApp').hidden=true;$('authGate').hidden=false;$('authMessage').textContent=String(error.message||error)}
}
$('loginForm').addEventListener('submit',async(e)=>{
 e.preventDefault();const b=$('loginButton');b.disabled=true;
 try{
  if(!client)throw new Error('Conexão indisponível.');
  const {error}=await client.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});
  if(error)throw error;$('loginPassword').value='';await verify();
 }catch(error){$('authMessage').textContent=String(error.message||error)}
 finally{b.disabled=false}
});
$('reloadButton').addEventListener('click',reload);
$('logoutButton').addEventListener('click',async()=>{await client?.auth.signOut();await verify()});
verify();