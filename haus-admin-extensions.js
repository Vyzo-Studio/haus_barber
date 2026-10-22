/* HAUS BARBER | Independent management/finance UI (no global RPC interception). */
(() => {
  'use strict';
  const client = () => window.supabaseClient;
  const $ = (selector, root = document) => root.querySelector(selector);
  const money = cents => (Number(cents || 0)/100).toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
  const METHODS = [['cash','Dinheiro'], ['pix','Pix'], ['debit','Débito'], ['credit','Crédito']];
  const BUCKET = 'haus-gallery';
  const SITE_PATH = 'https://vyzo-studio.github.io/haus_barber/';
  let allowed = false;
  let currentTab = 'services';
  let services = [], barbers = [], portfolio = [];
  let editingService = null, editingBarber = null;

  function el(tag, attrs = {}, textValue) {
    const node = document.createElement(tag);
    for (const [key,value] of Object.entries(attrs)) {
      if (key === 'className') node.className = value;
      else if (key === 'type') node.type = value;
      else node.setAttribute(key, String(value));
    }
    if (textValue !== undefined) node.textContent = String(textValue);
    return node;
  }
  function setMessage(message, bad=false) {
    const box = $('#haus-manager-message');
    if (!box) return;
    box.textContent = message || '';
    box.hidden = !message;
    box.classList.toggle('haus-manager-error', bad);
  }
  function fail(err) { console.error('Haus gestão:', err); setMessage(err?.message || 'Não foi possível concluir a operação.', true); }
  async function run(query) { const {data,error} = await query; if (error) throw error; return data; }
  async function verify() {
    if (!client() || !$('#admin-dashboard') || $('#admin-dashboard').hidden) return false;
    const {data,error} = await client().rpc('is_admin');
    allowed = !error && data === true;
    if (!allowed) throw Error('Acesso de administrador necessário para gerenciar a Haus.');
    return true;
  }
  async function refreshCatalogs() {
    await verify();
    const [s,b,p] = await Promise.all([
      run(client().from('haus_services').select('*').order('sort_order')),
      run(client().from('haus_barbers').select('*').order('sort_order')),
      run(client().from('haus_gallery').select('*').order('sort_order'))
    ]);
    services = s || []; barbers = b || []; portfolio = p || [];
    renderServices(); renderBarbers(); renderPhotos(); updateManualDropdowns();
  }
  function setPanel(tab) {
    currentTab = tab;
    document.querySelectorAll('[data-haus-manager-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.hausManagerTab===tab)));
    document.querySelectorAll('[data-haus-module]').forEach(p=>p.hidden=p.dataset.hausModule!==tab);
  }
  function line(title,subtitle, inactive) {
    const row = el('div',{className:'haus-manager-row'});
    row.dataset.inactive=String(inactive);
    const info = el('div'); info.append(el('strong',{},title),el('small',{},subtitle));
    const actions = el('div',{className:'haus-row-actions'});
    row.append(info,actions);
    return [row,actions,info];
  }
  function renderServices() {
    const list = $('#haus-services-list'); if (!list) return;
    list.replaceChildren();
    services.forEach(s=>{
      const [row,actions]=line(s.name,`${money(s.price_cents)} • ${s.category} • ${s.duration_minutes ? s.duration_minutes+' min confirmados' : 'duração não cadastrada'} • ${s.active?'Disponível':'Oculto no site'}`,!s.active);
      const edit = el('button',{type:'button'},'EDITAR');
      edit.addEventListener('click',()=>{
        editingService=s.id;
        $('#haus-service-name').value=s.name;
        $('#haus-service-price').value=(Number(s.price_cents)/100).toFixed(2).replace('.',',');
        $('#haus-service-duration').value=s.duration_minutes||'';
        $('#haus-service-category').value=s.category;
        $('#haus-service-order').value=s.sort_order;
        $('#haus-service-submit').textContent='SALVAR ALTERAÇÕES';
        $('#haus-service-name').focus();
      });
      const toggle=el('button',{type:'button'},s.active?'OCULTAR':'ATIVAR');
      toggle.addEventListener('click',async()=>{try{await run(client().from('haus_services').update({active:!s.active}).eq('id',s.id));await refreshCatalogs();setMessage('Disponibilidade do serviço atualizada.');}catch(e){fail(e);}});
      actions.append(edit,toggle);list.append(row);
    });
  }
  function renderBarbers() {
    const list=$('#haus-barbers-list');if(!list)return;
    list.replaceChildren();
    barbers.forEach(b=>{
      const [row,actions]=line(b.name,b.active?'Profissional ativo':'Profissional inativo',!b.active);
      const edit=el('button',{type:'button'},'EDITAR');
      edit.addEventListener('click',()=>{editingBarber=b.id;$('#haus-barber-name').value=b.name;$('#haus-barber-order').value=b.sort_order;$('#haus-barber-submit').textContent='SALVAR ALTERAÇÕES';$('#haus-barber-name').focus();});
      const toggle=el('button',{type:'button'},b.active?'DESATIVAR':'ATIVAR');
      toggle.addEventListener('click',async()=>{try{await run(client().from('haus_barbers').update({active:!b.active}).eq('id',b.id));await refreshCatalogs();setMessage('Cadastro do profissional atualizado.');}catch(e){fail(e);}});
      actions.append(edit,toggle);list.append(row);
    });
  }
  function photoUrl(photo) {
    if (photo.storage_key) return client().storage.from(BUCKET).getPublicUrl(photo.storage_key).data.publicUrl;
    return SITE_PATH+encodeURIComponent(photo.local_filename);
  }
  function renderPhotos() {
    const list=$('#haus-photos-list');if(!list)return;
    list.replaceChildren();
    portfolio.forEach(p=>{
      const archived=Boolean(p.archived_at);
      const subtitle=archived?'Arquivada (fora do site)':
        (p.active?'Visível':'Oculta')+' • ordem '+p.sort_order;
      const [row,actions,info]=line(p.title,p.category.replace(/\s+/g,', ')+' • '+subtitle,archived||!p.active);
      const img=el('img',{src:photoUrl(p),alt:p.description||p.title,loading:'lazy'});
      info.prepend(img);
      const toggle=el('button',{type:'button'},p.active?'OCULTAR':'EXIBIR');
      toggle.disabled=archived;
      toggle.title=archived?'Restaure o registro antes de exibir':'Alterar visibilidade pública';
      toggle.addEventListener('click',async()=>{
        if(archived)return;
        try{
          await run(client().from('haus_gallery').update({active:!p.active}).eq('id',p.id).is('archived_at',null));
          await refreshCatalogs();
          setMessage('Visibilidade da foto atualizada. O arquivo foi preservado.');
        }catch(e){fail(e)}
      });
      const edit=el('button',{type:'button'},'EDITAR');
      edit.disabled=archived;
      edit.addEventListener('click',async()=>{
        if(archived)return;
        const title=prompt('Título da foto',p.title);if(title===null)return;
        const clean=title.trim();
        if(clean.length<2||clean.length>100){setMessage('Título deve ter de 2 a 100 caracteres.',true);return}
        try{
          await run(client().from('haus_gallery').update({title:clean,description:clean+' realizado na Haus Barber'}).eq('id',p.id).is('archived_at',null));
          await refreshCatalogs();
        }catch(e){fail(e)}
      });
      const archive=el('button',{type:'button'},archived?'RESTAURAR':'ARQUIVAR');
      archive.addEventListener('click',async()=>{
        const message=archived
          ?'Restaurar esta foto como oculta? Você poderá exibi-la depois.'
          :'Arquivar esta foto? Ela deixará de aparecer no site e poderá ser restaurada.';
        if(!confirm(message))return;
        try{
          if(archived){
            await run(client().from('haus_gallery').update({archived_at:null,active:false}).eq('id',p.id));
          }else{
            await run(client().from('haus_gallery').update({archived_at:new Date().toISOString(),active:false}).eq('id',p.id));
          }
          await refreshCatalogs();
          setMessage(archived?'Foto restaurada como oculta.':'Foto arquivada. O arquivo original foi preservado.');
        }catch(e){fail(e)}
      });
      actions.append(edit,toggle,archive);
      if(p.storage_key){
        const permanent=el('button',{type:'button'},'EXCLUIR DEFINITIVAMENTE');
        permanent.className='haus-delete-permanent';
        permanent.addEventListener('click',async()=>{
          if(!allowed)return;
          const first='Esta ação exclui o arquivo original do armazenamento e remove a foto do portfólio. Não há recuperação automática. Continuar?';
          if(!confirm(first))return;
          const proof=prompt('Para confirmar, digite EXCLUIR');
          if(proof!=='EXCLUIR'){setMessage('Exclusão permanente cancelada.');return}
          permanent.disabled=true;
          try{
            const {data:references,error:checkError}=await client().from('haus_gallery')
              .select('id').eq('storage_key',p.storage_key);
            if(checkError)throw checkError;
            if(!Array.isArray(references)||references.length!==1||references[0].id!==p.id){
              throw new Error('O arquivo tem referência compartilhada ou não pode ser verificado. Exclusão bloqueada.');
            }
            await run(client().from('haus_gallery').update({
              active:false,archived_at:p.archived_at||new Date().toISOString()
            }).eq('id',p.id));
            const {data:removed,error:removeError}=await client().storage.from(BUCKET).remove([p.storage_key]);
            if(removeError)throw new Error('A foto foi arquivada, mas o arquivo não foi excluído: '+removeError.message);
            if(!Array.isArray(removed)||!removed.length){
              throw new Error('Exclusão do arquivo não confirmada. O cadastro permanece arquivado para verificação.');
            }
            const {error:dbError}=await client().from('haus_gallery').delete().eq('id',p.id);
            if(dbError)throw new Error('Arquivo removido do armazenamento; cadastro preservado como arquivado. Consulte suporte: '+dbError.message);
            await refreshCatalogs();
            setMessage('Arquivo excluído permanentemente do armazenamento e cadastro removido.');
          }catch(e){fail(e);await refreshCatalogs().catch(()=>{})}
          finally{permanent.disabled=false}
        });
        actions.append(permanent);
      }else{
        const note=el('small',{},'Original no GitHub: use o repositório para excluir o arquivo definitivamente.');
        actions.append(note);
      }
      list.append(row);
    });
  }
  async function onServiceSave(event) {
    event.preventDefault();if(!allowed)return;
    const name=$('#haus-service-name').value.trim();
    const price=parseBRL($('#haus-service-price').value);
    const category=$('#haus-service-category').value;
    const durationRaw=$('#haus-service-duration').value.trim();
    const duration=durationRaw===''?null:Number(durationRaw);
    const sort_order=Number($('#haus-service-order').value || 0);
    if((duration!==null&&(!Number.isInteger(duration)||duration<30||duration>480||duration%30!==0))){setMessage('Duração precisa ser de 30 a 480 minutos, em intervalos de 30.',true);return;}
    if(name.length<2||name.length>80||price===null||price<=0||price>2000000||!['cortes','detalhes','estilo'].includes(category)){setMessage('Preencha nome, categoria e preço válido.',true);return;}
    const btn=$('#haus-service-submit');btn.disabled=true;
    try{
      if(editingService) await run(client().from('haus_services').update({name,price_cents:price,category,sort_order,duration_minutes:duration}).eq('id',editingService));
      else await run(client().from('haus_services').insert({id:crypto.randomUUID(),name,price_cents:price,category,sort_order,duration_minutes:duration,active:true}));
      editingService=null;event.target.reset();btn.textContent='ADICIONAR SERVIÇO';
      await refreshCatalogs();setMessage('Serviços atualizados. O site mostrará os preços novos sem alterar vendas anteriores.');
    }catch(e){fail(e);}finally{btn.disabled=false;}
  }
  async function onBarberSave(event) {
    event.preventDefault();if(!allowed)return;
    const name=$('#haus-barber-name').value.trim();
    const sort_order=Number($('#haus-barber-order').value||0);
    if(name.length<2||name.length>80){setMessage('Informe um nome de 2 a 80 caracteres.',true);return;}
    const btn=$('#haus-barber-submit');btn.disabled=true;
    try{
      if(editingBarber)await run(client().from('haus_barbers').update({name,sort_order}).eq('id',editingBarber));
      else await run(client().from('haus_barbers').insert({name,sort_order,active:true}));
      editingBarber=null;event.target.reset();btn.textContent='ADICIONAR BARBEIRO';
      await refreshCatalogs();setMessage('Equipe atualizada. Barbeiros ativos podem ser associados a lançamentos manuais.');
    }catch(e){fail(e);}finally{btn.disabled=false;}
  }
  async function onPhotoSave(event) {
    event.preventDefault();if(!allowed)return;
    const file=$('#haus-photo-file').files[0];
    const title=$('#haus-photo-title').value.trim();
    const category=$('#haus-photo-category').value;
    if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){setMessage('Selecione uma imagem PNG/JPG/WebP até 5 MB.',true);return;}
    if(title.length<2||title.length>100){setMessage('Informe o nome da foto.',true);return;}
    const extension=({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'})[file.type];
    const storage_path=`trabalhos/${crypto.randomUUID()}.${extension}`;
    const btn=$('#haus-photo-submit');btn.disabled=true;
    try{
      const {error}=await client().storage.from(BUCKET).upload(storage_path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
      if(error)throw error;
      try{
        await run(client().from('haus_gallery').insert({storage_key:storage_path,title,description:`${title} realizado na Haus Barber`,category,sort_order:portfolio.length+1,active:true}));
      }catch(err){await client().storage.from(BUCKET).remove([storage_path]);throw err;}
      event.target.reset();await refreshCatalogs();setMessage('Foto enviada. Ela aparecerá no portfólio da Haus.');
    }catch(e){fail(e);}finally{btn.disabled=false;}
  }
  function updateManualDropdowns() {
    const select=$('#manual-sale-service');
    if(select){
      const old=select.value;
      select.replaceChildren(el('option',{value:''},'Selecione o serviço'));
      services.filter(s=>s.active).forEach(s=>{
        const option=el('option',{value:s.name,'data-price':s.price_cents},`${s.name} — ${money(s.price_cents)}`);
        select.append(option);
      });
      if([...select.options].some(o=>o.value===old)) select.value=old;
      select.dispatchEvent(new Event('change'));
    }
    const barber=$('#haus-manual-barber');
    if(barber){const old=barber.value;barber.replaceChildren(el('option',{value:''},'Sem barbeiro especificado'));barbers.filter(b=>b.active).forEach(b=>barber.append(el('option',{value:b.id},b.name)));if([...barber.options].some(o=>o.value===old))barber.value=old;}
  }
  function parseBRL(value){
    const raw=String(value||'').trim().replace(/\s|R\$/gi,'');
    if(!raw)return null;
    const normalized=raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw;
    if(!/^\d+(?:\.\d{1,2})?$/.test(normalized))return null;
    const cents=Math.round(Number(normalized)*100);
    return Number.isSafeInteger(cents)&&cents<=100000000?cents:null;
  }
  function createFinanceWidget(root, context) {
    const wrap=el('div',{className:'haus-finance-widget','data-haus-finance':context});
    const switcher=el('div',{className:'haus-finance-switch'});
    const label=el('label');const checkbox=el('input',{type:'checkbox'});checkbox.className='haus-split-toggle';label.append(checkbox,document.createTextNode(' COMBINAR FORMAS DE PAGAMENTO'));
    switcher.append(label);
    const split=el('div',{className:'haus-finance-grid'});split.hidden=true;
    METHODS.forEach(([id,text])=>{
      const l=el('label',{},text);l.append(el('input',{type:'text',inputmode:'decimal',placeholder:'0,00','data-haus-part':id}));split.append(l);
    });
    const cash=el('label',{className:'haus-money-field'},'DINHEIRO ENTREGUE (PARA CALCULAR O TROCO)');
    cash.append(el('input',{type:'text',inputmode:'decimal',placeholder:'Ex.: 50,00','data-haus-tender':''}));
    const summary=el('div',{className:'haus-finance-summary'});
    const result=el('strong',{'data-haus-finance-result':''},'');
    summary.append(el('span',{},'O caixa contabiliza apenas o valor do serviço, não o dinheiro entregue.'),result);
    const error=el('p',{className:'haus-finance-error','aria-live':'polite'});
    wrap.append(switcher,split,cash,summary,error);
    root.append(wrap);
    checkbox.addEventListener('change',()=>{
      split.hidden=!checkbox.checked;
      if(context==='booking'){
        const ordinary=$('.payment-method-options');if(ordinary)ordinary.hidden=checkbox.checked;
      }
      if(context==='manual'){
        const pay=$('#manual-sale-payment'); if(pay)pay.value=checkbox.checked?'split':'';
      }
      updateFinance(context);
    });
    wrap.addEventListener('input',()=>updateFinance(context));
    return wrap;
  }
  function financeRoot(context){return $(`[data-haus-finance="${context}"]`);}
  function mode(context){return !!financeRoot(context)?.querySelector('.haus-split-toggle')?.checked;}
  function getParts(context,total,singleMethod) {
    const wrap=financeRoot(context);if(!wrap)throw Error('Painel de pagamento indisponível. Recarregue a página.');
    let parts=[];
    if(mode(context)){
      for(const inp of wrap.querySelectorAll('[data-haus-part]')){
        const amount=inp.value.trim()?parseBRL(inp.value):0;
        if(amount===null||amount<0)throw Error('Informe valores válidos com no máximo duas casas decimais.');
        if(amount>0)parts.push({method:inp.dataset.hausPart,amount_cents:amount});
      }
    }else{
      if(!METHODS.some(m=>m[0]===singleMethod))throw Error('Selecione a forma de pagamento.');
      parts=[{method:singleMethod,amount_cents:total}];
    }
    const sum=parts.reduce((s,p)=>s+p.amount_cents,0);
    if(!parts.length||sum!==total)throw Error(`Distribuído: ${money(sum)}. Faltam ${money(total-sum)} para completar ${money(total)}.`);
    const cash=parts.filter(p=>p.method==='cash').reduce((s,p)=>s+p.amount_cents,0);
    const tenderRaw=wrap.querySelector('[data-haus-tender]').value.trim();
    let tender=cash>0?cash:0;
    if(tenderRaw){tender=parseBRL(tenderRaw);if(tender===null)throw Error('Dinheiro recebido inválido.');}
    if(cash===0&&tender>0)throw Error('O troco só se aplica se houver pagamento em dinheiro.');
    if(cash>0&&tender<cash)throw Error('Dinheiro entregue é menor que a parcela em dinheiro.');
    return {parts:parts.map(p=>({method:p.method,cents:p.amount_cents})),tender};
  }
  function updateFinance(context){
    const wrap=financeRoot(context);if(!wrap)return;
    const total=context==='manual'?Number($('#manual-sale-service')?.selectedOptions[0]?.dataset.price||0):Number(wrap.dataset.total||0);
    const tender=wrap.querySelector('[data-haus-tender]');
    const cashUsed=mode(context)?parseBRL(wrap.querySelector('[data-haus-part="cash"]').value)||0:context==='manual'?$('#manual-sale-payment')?.value==='cash'?total:0:document.querySelector('[name="payment-method"]:checked')?.value==='cash'?total:0;
    tender.closest('label').hidden=!cashUsed;
    const amount=mode(context)?[...wrap.querySelectorAll('[data-haus-part]')].reduce((s,inp)=>s+(parseBRL(inp.value)||0),0):total;
    const change=tender.value.trim()?Math.max(0,(parseBRL(tender.value)||0)-cashUsed):0;
    const text=mode(context)?`Distribuído: ${money(amount)} de ${money(total)}.`:`Total: ${money(total)}.`;
    wrap.querySelector('[data-haus-finance-result]').textContent=text+(cashUsed?` Troco: ${money(change)}.`:'');
  }
  function resetFinance(context,total=0){
    const root=financeRoot(context);if(!root)return;
    root.dataset.total=total;
    root.dataset.requestId=crypto.randomUUID();
    root.querySelector('.haus-split-toggle').checked=false;
    root.querySelector('.haus-finance-grid').hidden=true;
    root.querySelectorAll('input[type=text]').forEach(i=>i.value='');
    if(context==='booking'){$('.payment-method-options').hidden=false;}
    updateFinance(context);
  }
  window.HausPayments={
    mode,
    reset:resetFinance,
    build:(context,total,singleMethod)=>getParts(context,total,singleMethod),
    getBarber:()=>$('#haus-manual-barber')?.value||null,
    getRequestId:(context)=>financeRoot(context)?.dataset.requestId||null,
    sync:()=>updateFinance('manual')
  };

  async function init(){
    createFinanceWidget($('#haus-booking-finance-host'),'booking');
    createFinanceWidget($('#haus-manual-finance-host'),'manual');
    document.querySelectorAll('[name="payment-method"]').forEach(i=>i.addEventListener('change',()=>updateFinance('booking')));
    $('#manual-sale-payment')?.addEventListener('change',()=>{const split=$('#manual-sale-payment').value==='split';const toggle=financeRoot('manual').querySelector('.haus-split-toggle');toggle.checked=split;financeRoot('manual').querySelector('.haus-finance-grid').hidden=!split;updateFinance('manual');});
    $('#manual-sale-service')?.addEventListener('change',()=>updateFinance('manual'));
    document.querySelectorAll('[data-haus-manager-tab]').forEach(button=>button.addEventListener('click',()=>setPanel(button.dataset.hausManagerTab)));
    $('#haus-service-form')?.addEventListener('submit',onServiceSave);
    $('#haus-barber-form')?.addEventListener('submit',onBarberSave);
    $('#haus-photo-form')?.addEventListener('submit',onPhotoSave);
    $('#haus-service-reset')?.addEventListener('click',()=>{editingService=null;$('#haus-service-form').reset();$('#haus-service-submit').textContent='ADICIONAR SERVIÇO';});
    $('#haus-barber-reset')?.addEventListener('click',()=>{editingBarber=null;$('#haus-barber-form').reset();$('#haus-barber-submit').textContent='ADICIONAR BARBEIRO';});
    setPanel('services');
    const button=$('#haus-manager-load');
    button?.addEventListener('click',async()=>{button.disabled=true;setMessage('Consultando os cadastros...');try{await refreshCatalogs();setMessage('Dados da Haus atualizados.');}catch(err){fail(err);}finally{button.disabled=false;}});
    // Auth is managed by admin.js; load only after successful admin login/dashboard display.
    const dashboard=$('#admin-dashboard');
    if(dashboard){new MutationObserver(()=>{if(!dashboard.hidden&&!allowed)refreshCatalogs().catch(fail);}).observe(dashboard,{attributes:true,attributeFilter:['hidden']});if(!dashboard.hidden)refreshCatalogs().catch(fail);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();