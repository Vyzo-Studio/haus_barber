/* HAUS finances: totals in integer cents; the server performs all writes atomically. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s);
 const client=window.supabaseClient;
 const modal=$('#admin-confirm-modal'), section=$('#payment-method-section'), submit=$('#admin-confirm-submit');
 const manual=$('#manual-sale-form'),manualPayment=$('#manual-sale-payment');
 if(!client||!modal||!section||!submit||!manual)return;
 const format=c=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(c||0)/100);
 const methods={cash:'Dinheiro',pix:'Pix',debit:'Débito',credit:'Crédito'};
 const parse=v=>{
  let s=String(v??'').trim().replace(/\s/g,'').replace(/R\$/gi,'');
  if(!s)return 0;
  if(/^\d{1,7}(,\d{1,2})?$/.test(s))s=s.replace(',','.');
  if(!/^\d{1,7}(\.\d{1,2})?$/.test(s))return NaN;
  return Math.round(Number(s)*100);
 };
 const options=()=>Object.entries(methods).map(([k,name])=>`<label class="haus-pay-line"><span>${name}</span><div>R$ <input data-haus-money="${k}" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00"></div></label>`).join('');
 const payExtra=document.createElement('section');
 payExtra.id='haus-pay-extra';payExtra.className='haus-pay-extra';
 payExtra.innerHTML=`
 <div class="haus-pay-switch"><button type="button" data-haus-pay-mode="single" aria-pressed="true">UM MÉTODO</button><button type="button" data-haus-pay-mode="split" aria-pressed="false">COMBINAR PAGAMENTOS</button></div>
 <div data-haus-pay-split hidden><p>Informe quanto o cliente pagou em cada método.</p><div class="haus-pay-lines">${options()}</div><p class="haus-pay-validation" data-haus-pay-summary></p></div>
 <div class="haus-pay-tender" data-haus-pay-tender hidden><label>DINHEIRO ENTREGUE (R$)<input type="text" inputmode="decimal" data-haus-tender placeholder="0,00"></label>
 <p data-haus-change aria-live="polite">Informe o dinheiro recebido para calcular o troco.</p></div>
 <p class="haus-pay-error" data-haus-error role="alert" hidden></p>`;
 section.append(payExtra);
 const singleOptions=section.querySelector('.payment-method-options'), splitZone=payExtra.querySelector('[data-haus-pay-split]');
 let mode='single',paySaving=false,payRequestId=null;
 const partInputs=Array.from(payExtra.querySelectorAll('[data-haus-money]'));
 const tender=payExtra.querySelector('[data-haus-tender]');
 const payError=payExtra.querySelector('[data-haus-error]');
 const payMsg=(msg='')=>{payError.textContent=msg;payError.hidden=!msg;};
 const radio=()=>section.querySelector('input[name="payment-method"]:checked')?.value||'';
 function amountFromParts(total){
  if(mode==='split'){
    const parts=[];let sum=0;
    for(const input of partInputs){
      const cents=parse(input.value);
      if(!Number.isInteger(cents)||cents<0)throw Error('Confira os valores informados.');
      if(cents>0){parts.push({method:input.dataset.hausMoney,cents});sum+=cents;}
    }
    if(parts.length<2)throw Error('Para combinar, utilize pelo menos duas formas de pagamento.');
    if(sum!==total)throw Error(`Distribua exatamente ${format(total)}. Diferença: ${format(total-sum)}.`);
    return parts;
  }
  const method=radio();
  if(!method)throw Error('Selecione uma forma de pagamento.');
  return [{method,cents:total}];
 }
 function updatePay(){
   if(modal.hidden||!currentAction||currentAction.action!=='paid')return;
   const total=Number(currentAction.booking?.service_amount_cents)||0;
   const cash=mode==='single'?(radio()==='cash'?total:0):(parse(partInputs.find(i=>i.dataset.hausMoney==='cash')?.value)||0);
   const hasCash=cash>0;
   payExtra.querySelector('[data-haus-pay-tender]').hidden=!hasCash;
   const got=parse(tender.value),change=payExtra.querySelector('[data-haus-change]');
   change.textContent=hasCash?(Number.isFinite(got)&&got>=cash?`TROCO: ${format(got-cash)}`:`Valor devido em dinheiro: ${format(cash)}`):'';
   if(mode==='split'){
     const sum=partInputs.reduce((s,x)=>s+(parse(x.value)||0),0);
     payExtra.querySelector('[data-haus-pay-summary]').textContent=`Distribuído ${format(sum)} de ${format(total)} — ${sum===total?'Valor exato':`Restam ${format(total-sum)}`}`;
   }
 }
 payExtra.querySelectorAll('[data-haus-pay-mode]').forEach(b=>b.addEventListener('click',()=>{
  mode=b.dataset.hausPayMode;payRequestId=null;payMsg();
  payExtra.querySelectorAll('[data-haus-pay-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  singleOptions.hidden=mode==='split';splitZone.hidden=mode!=='split';updatePay();
 }));
 payExtra.addEventListener('input',()=>{payRequestId=null;payMsg();updatePay();});
 section.querySelectorAll('input[name="payment-method"]').forEach(x=>x.addEventListener('change',()=>{payRequestId=null;updatePay();}));
 const observer=new MutationObserver(()=>{
   if(!modal.hidden){
     mode='single';payRequestId=null;payMsg();
     payExtra.querySelector('[data-haus-pay-mode="single"]').click();
     partInputs.forEach(x=>x.value='');tender.value='';updatePay();
   }
 });
 observer.observe(modal,{attributes:true,attributeFilter:['hidden']});
 submit.addEventListener('click',async event=>{
  if(!currentAction||currentAction.action!=='paid'||modal.hidden)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(paySaving)return;
  const total=Number(currentAction.booking?.service_amount_cents)||0;
  try{
   if(total<=0)throw Error('Serviço sem valor válido.');
   const parts=amountFromParts(total),cash=parts.find(p=>p.method==='cash')?.cents||0;
   const received=cash?parse(tender.value):0;
   if(cash && (!Number.isInteger(received)||received<cash))throw Error(`Informe o valor recebido em dinheiro (mínimo ${format(cash)}).`);
   if(!payRequestId)payRequestId=crypto.randomUUID();
   paySaving=true;submit.disabled=true;submit.textContent='REGISTRANDO...';payMsg();
   const response=await client.rpc('haus_register_payment_parts',{
    p_booking_id:currentAction.booking.id,p_parts:parts,p_cash_received_cents:received,p_request_id:payRequestId
   });
   if(response.error)throw response.error;
   const change=received-cash;
   closeActionModal();
   showCashMessage(`Pagamento de ${format(total)} registrado. ${cash?`Troco: ${format(change)}.`:''}`,'success');
   payRequestId=null;await refreshAllData({silent:true});
  }catch(e){payMsg(e?.message||'Falha ao registrar pagamento; tente novamente sem alterar os campos.');}
  finally{paySaving=false;submit.disabled=false;if(!modal.hidden)submit.textContent='REGISTRAR PAGAMENTO';}
 },true);

 /* Manual sale: same split/amount rules. Captures the submit before legacy listeners. */
 const mFields=document.createElement('div');mFields.className='haus-manual-pay';
 mFields.innerHTML=`
  <div class="haus-manual-toggle"><label><input type="checkbox" data-haus-manual-split> COMBINAR FORMAS DE PAGAMENTO</label></div>
  <div data-haus-manual-parts hidden><div class="haus-pay-lines">${options()}</div><p data-haus-manual-sum></p></div>
  <div data-haus-manual-tender hidden class="haus-pay-tender"><label>DINHEIRO ENTREGUE (R$)<input type="text" inputmode="decimal" data-haus-manual-cash placeholder="0,00"></label><p data-haus-manual-change></p></div>
  <label class="haus-manual-barber">BARBEIRO (OPCIONAL)<select data-haus-manual-barber><option value="">Não informado</option></select></label>
  <p class="haus-pay-error" data-haus-manual-error role="alert" hidden></p>`;
 const paymentField=manualPayment.closest('.manual-sale-field');
 paymentField.insertAdjacentElement('afterend',mFields);
 const manualToggle=mFields.querySelector('[data-haus-manual-split]'),
 manualParts=mFields.querySelector('[data-haus-manual-parts]'),
 manualInputs=Array.from(mFields.querySelectorAll('[data-haus-money]')),
 manualTender=mFields.querySelector('[data-haus-manual-tender]'),
 manualCash=mFields.querySelector('[data-haus-manual-cash]'),
 manualError=mFields.querySelector('[data-haus-manual-error]');
 let manualSaving=false,manualRequestId=null;
 const mError=text=>{manualError.textContent=text||'';manualError.hidden=!text;};
 const manualPrice=()=>Number($('#manual-sale-service')?.selectedOptions[0]?.dataset.price)||0;
 function manualAmounts(){
  const total=manualPrice();
  if(!total)throw Error('Selecione um serviço válido.');
  const split=manualToggle.checked,parts=[];
  if(split){
   for(const input of manualInputs){
    const cents=parse(input.value);
    if(!Number.isInteger(cents)||cents<0)throw Error('Confira os valores do pagamento combinado.');
    if(cents)parts.push({method:input.dataset.hausMoney,cents});
   }
   if(parts.length<2)throw Error('Escolha pelo menos duas formas para combinar.');
  }else{
   if(!methods[manualPayment.value])throw Error('Escolha a forma de pagamento.');
   parts.push({method:manualPayment.value,cents:total});
  }
  const sum=parts.reduce((a,p)=>a+p.cents,0);
  if(sum!==total)throw Error(`Pagamentos devem totalizar ${format(total)}. Falta: ${format(total-sum)}.`);
  const cash=parts.find(p=>p.method==='cash')?.cents||0;
  const received=cash?parse(manualCash.value):0;
  if(cash&&(!Number.isInteger(received)||received<cash))throw Error(`Informe dinheiro recebido igual ou maior que ${format(cash)}.`);
  return {parts,received,cash,total};
 }
 function manualRefresh(){
  const split=manualToggle.checked;
  manualParts.hidden=!split;
  manualPayment.disabled=split;
  manualPayment.required=!split;
  const cash=split?(parse(manualInputs.find(i=>i.dataset.hausMoney==='cash')?.value)||0):(manualPayment.value==='cash'?manualPrice():0);
  manualTender.hidden=!cash;
  const received=parse(manualCash.value);
  mFields.querySelector('[data-haus-manual-change]').textContent=cash?
   (Number.isInteger(received)&&received>=cash?`Troco: ${format(received-cash)}`:`Valor devido em dinheiro: ${format(cash)}`):'';
  if(split){
   const total=manualInputs.reduce((n,i)=>n+(parse(i.value)||0),0);
   mFields.querySelector('[data-haus-manual-sum]').textContent=`Distribuído: ${format(total)} / ${format(manualPrice())}`;
  }
 }
 async function loadManualBarbers(){
  const select=mFields.querySelector('[data-haus-manual-barber]');
  const resp=await client.from('haus_barbers').select('id,name').eq('active',true).order('sort_order');
  if(resp.error)throw resp.error;
  select.replaceChildren(new Option('Não informado',''));
  (resp.data||[]).forEach(x=>select.add(new Option(x.name,x.id)));
 }
 manualToggle.addEventListener('change',()=>{
  manualRequestId=null;mError();
  if(manualToggle.checked)manualPayment.value='cash';else manualPayment.value='';
  manualRefresh();
 });
 mFields.addEventListener('input',()=>{manualRequestId=null;mError();manualRefresh();});
 manualPayment.addEventListener('change',()=>{manualRequestId=null;manualRefresh();});
 $('#manual-sale-service').addEventListener('change',manualRefresh);
 document.querySelector('#manual-sale-open')?.addEventListener('click',async()=>{
   manualToggle.checked=false;manualPayment.disabled=false;manualPayment.required=true;
   manualInputs.forEach(x=>x.value='');manualCash.value='';manualRequestId=null;mError();manualRefresh();
   try{await loadManualBarbers();}catch(e){mError('Não foi possível carregar barbeiros: '+e.message);}
 });
 manual.addEventListener('submit',async event=>{
   event.preventDefault();event.stopImmediatePropagation();
   if(manualSaving)return;
   if(!manual.reportValidity()){mError('Preencha os campos obrigatórios.');return;}
   try{
    const date=$('#manual-sale-date')?.value||'',time=$('#manual-sale-time')?.value||'';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:(00|30)$/.test(time))throw Error('Escolha uma data e horário válidos.');
    const name=$('#manual-sale-name')?.value.trim()||'';
    if(name.length===1||name.length>80)throw Error('Nome opcional: informe de 2 a 80 caracteres ou deixe vazio.');
    const {parts,received,total}=manualAmounts();
    if(!manualRequestId)manualRequestId=crypto.randomUUID();
    manualSaving=true;
    const button=$('#manual-sale-submit');button.disabled=true;button.textContent='REGISTRANDO...';mError();
    const resp=await client.rpc('haus_register_manual_parts',{
      p_request_id:manualRequestId,p_service:$('#manual-sale-service').value,
      p_booking_date:date,p_booking_time:time+':00',
      p_customer_name:name||null,p_parts:parts,p_cash_received_cents:received,
      p_barber_id:mFields.querySelector('[data-haus-manual-barber]').value||null
    });
    if(resp.error)throw resp.error;
    manualRequestId=null;
    closeManualSaleModal();
    if($('#admin-search'))$('#admin-search').value='';
    selectAdminCalendarDate(date);setBookingView('finalized');
    showGlobalMessage(`Atendimento de ${format(total)} registrado no caixa.`,'success');
    await refreshAllData({silent:true});
   } catch(e){mError(e?.message||'Não foi possível concluir. Tente novamente sem alterar os campos.');}
   finally{manualSaving=false;const button=$('#manual-sale-submit');button.disabled=false;button.textContent='REGISTRAR RECEBIMENTO';}
 },true);
 manual.addEventListener('change',()=>{manualRequestId=null;},true);
})();
