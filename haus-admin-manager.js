/* HAUS Studio: administrative services, professionals and photo curation.
   No theme/color editing is exposed. The server enforces is_admin() and RLS. */
(() => {
 'use strict';
 const client = window.supabaseClient;
 const $ = s => document.querySelector(s);
 const price = c => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(c||0)/100);
 const safe = value => String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const labels = {cortes:'Cortes',detalhes:'Barba e detalhes',estilo:'Química e estilo'};
 const state = {tab:'services',services:[],barbers:[],photos:[],saving:false};
 const dashboard = $('#admin-dashboard');
 const btnRow = document.querySelector('.admin-welcome-actions');
 if (!client || !dashboard || !btnRow) return;
 const openBtn=document.createElement('button');
 openBtn.type='button';openBtn.id='haus-management-open';openBtn.className='admin-primary-button';
 openBtn.textContent='⚙ GERENCIAR HAUS';btnRow.prepend(openBtn);
 const modal=document.createElement('div'); modal.id='haus-management-modal';modal.className='haus-tools-modal';modal.hidden=true;
 modal.innerHTML=`
  <div class="haus-tools-backdrop" data-haus-dismiss></div>
  <section class="haus-tools-dialog" role="dialog" aria-modal="true" aria-labelledby="haus-tools-title" tabindex="-1">
    <div class="haus-tools-head"><div><small>CONTROLE ADMINISTRATIVO</small><h2 id="haus-tools-title">GERENCIAR HAUS</h2><p>Serviços, profissionais e portfólio. A identidade visual é fixa.</p></div>
      <button class="haus-tools-close" type="button" aria-label="Fechar" data-haus-dismiss>×</button></div>
    <div class="haus-tools-tabs" role="tablist" aria-label="Área de gestão">
      <button type="button" role="tab" data-haus-tab="services" aria-selected="true">SERVIÇOS E PREÇOS</button>
      <button type="button" role="tab" data-haus-tab="barbers" aria-selected="false">BARBEIROS</button>
      <button type="button" role="tab" data-haus-tab="photos" aria-selected="false">FOTOS</button>
    </div>
    <p id="haus-tools-message" class="haus-tools-message" role="status" aria-live="polite"></p>
    <div id="haus-tools-body"></div>
  </section>`;
 document.body.append(modal);
 const msg=$('#haus-tools-message'),body=$('#haus-tools-body');
 let lastFocus=null;
 function message(value='',err=false){msg.textContent=value;msg.classList.toggle('is-error',err);}
 function errorText(e){return e?.message||'Não foi possível salvar. Tente novamente.';}
 async function guard(){
   const u=await client.auth.getUser();if(u.error||!u.data?.user)throw Error('Faça login novamente no painel.');
   const access=await client.rpc('is_admin');if(access.error||access.data!==true)throw Error('Conta sem acesso administrativo.');
 }
 async function open(){
   lastFocus=document.activeElement;modal.hidden=false;document.body.classList.add('modal-open');
   modal.querySelector('.haus-tools-dialog').focus();message();
   try { await guard();await load(); } catch(e){body.replaceChildren();message(errorText(e),true);}
 }
 function close(){if(state.saving)return;modal.hidden=true;document.body.classList.remove('modal-open');message();lastFocus?.focus();}
 openBtn.addEventListener('click',open);
 modal.addEventListener('click',e=>{if(e.target.closest('[data-haus-dismiss]'))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden){e.preventDefault();close();}});
 async function load(){
   const table={services:'haus_services',barbers:'haus_barbers',photos:'haus_gallery'}[state.tab];
   const {data,error}=await client.from(table).select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:true});
   if(error)throw error;
   state[state.tab]=data||[];
   render();
 }
 function render(){
   modal.querySelectorAll('[data-haus-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.hausTab===state.tab)));
   if(state.tab==='services')renderServices();
   if(state.tab==='barbers')renderBarbers();
   if(state.tab==='photos')renderPhotos();
 }
 modal.querySelectorAll('[data-haus-tab]').forEach(b=>b.addEventListener('click',async()=>{
   if(state.saving)return;state.tab=b.dataset.hausTab;message();body.innerHTML='<p>Carregando...</p>';
   try{await guard();await load();}catch(e){message(errorText(e),true);}
 }));
 async function submitRow(table,payload,id){
   state.saving=true;message('Salvando...');
   try{
     await guard();
     const query=id?client.from(table).update(payload).eq('id',id):client.from(table).insert(payload);
     const {error}=await query;
     if(error)throw error;
     message('Alteração salva. Atualize o site público para visualizar.');
     await load();
   } catch(e){message(errorText(e),true);} finally{state.saving=false;}
 }
 function renderServices(){
   body.innerHTML=`
    <form id="haus-service-form" class="haus-tools-form">
     <input type="hidden" name="id">
     <label>Nome do serviço<input name="name" maxlength="100" required placeholder="Ex.: Corte Degradê"></label>
     <label>Preço (R$)<input name="price" type="number" min="0.01" max="20000" step="0.01" required></label>
     <label>Categoria<select name="category"><option value="cortes">Cortes</option><option value="detalhes">Barba e detalhes</option><option value="estilo">Química e estilo</option></select></label>
     <label>Posição<input name="sort_order" type="number" min="0" max="999" value="99"></label>
     <div class="haus-tools-actions"><button type="submit" class="admin-primary-button">SALVAR SERVIÇO</button><button type="reset" class="admin-secondary-button">NOVO</button></div>
    </form><div class="haus-tools-list" id="haus-service-list"></div>`;
   const form=$('#haus-service-form'),list=$('#haus-service-list');
   state.services.forEach(s=>{
     const row=document.createElement('article');row.className='haus-tools-item';
     row.innerHTML=`<div><strong>${safe(s.name)}</strong><small>${safe(labels[s.category]||s.category)} • ${price(s.price_cents)} • ${s.active?'Ativo':'Oculto'}</small></div>
       <div><button type="button" data-edit>EDITAR</button><button type="button" data-toggle>${s.active?'OCULTAR':'ATIVAR'}</button></div>`;
     row.querySelector('[data-edit]').addEventListener('click',()=>{
       for(const k of ['id','name','category','sort_order'])form.elements[k].value=s[k];
       form.elements.price.value=(s.price_cents/100).toFixed(2);form.scrollIntoView({behavior:'smooth',block:'center'});form.elements.name.focus();
     });
     row.querySelector('[data-toggle]').addEventListener('click',()=>submitRow('haus_services',{active:!s.active},s.id));
     list.append(row);
   });
   form.addEventListener('submit',async e=>{
     e.preventDefault();if(state.saving)return;
     const name=form.elements.name.value.trim();
     const val=Math.round(Number(form.elements.price.value)*100);
     if(name.length<2||!Number.isInteger(val)||val<=0){message('Nome e preço válidos são obrigatórios.',true);return;}
     await submitRow('haus_services',{name,price_cents:val,category:form.elements.category.value,sort_order:Number(form.elements.sort_order.value)||0},form.elements.id.value||null);
   });
 }
 function renderBarbers(){
   body.innerHTML=`<p class="haus-tools-hint">Cadastre e organize a equipe. É possível desativar um barbeiro sem apagar o histórico.</p>
     <form id="haus-barber-form" class="haus-tools-form">
       <input type="hidden" name="id"><label>Nome do barbeiro<input name="name" maxlength="80" minlength="2" required placeholder="Nome do profissional"></label>
       <label>Posição<input type="number" min="0" max="999" name="sort_order" value="99"></label>
       <div class="haus-tools-actions"><button type="submit" class="admin-primary-button">SALVAR BARBEIRO</button><button type="reset" class="admin-secondary-button">NOVO</button></div>
     </form><div class="haus-tools-list" id="haus-barbers-list"></div>`;
   const form=$('#haus-barber-form'),list=$('#haus-barbers-list');
   state.barbers.forEach(s=>{
     const row=document.createElement('article');row.className='haus-tools-item';
     row.innerHTML=`<div><strong>${safe(s.name)}</strong><small>${s.active?'Ativo':'Desativado'}</small></div>
      <div><button type="button" data-edit>EDITAR</button><button type="button" data-toggle>${s.active?'DESATIVAR':'ATIVAR'}</button></div>`;
     row.querySelector('[data-edit]').addEventListener('click',()=>{
       form.elements.id.value=s.id;form.elements.name.value=s.name;form.elements.sort_order.value=s.sort_order;form.elements.name.focus();
     });
     row.querySelector('[data-toggle]').addEventListener('click',()=>submitRow('haus_barbers',{active:!s.active},s.id));
     list.append(row);
   });
   form.addEventListener('submit',async e=>{
     e.preventDefault();if(state.saving)return;
     const name=form.elements.name.value.trim();
     if(name.length<2){message('Informe o nome do profissional.',true);return;}
     await submitRow('haus_barbers',{name,sort_order:Number(form.elements.sort_order.value)||0},form.elements.id.value||null);
   });
 }
 function getPhotoUrl(photo){
   if(photo.storage_key){
     const res=client.storage.from('haus-gallery').getPublicUrl(photo.storage_key);
     return res.data?.publicUrl||'';
   }
   return photo.local_filename||'';
 }
 function renderPhotos(){
   body.innerHTML=`
    <form id="haus-photo-form" class="haus-tools-form" enctype="multipart/form-data">
      <label>Título<input name="title" maxlength="100" required placeholder="Ex.: Degradê navalhado"></label>
      <label>Categoria<select name="category"><option value="degrade">Degradê</option><option value="freestyle">Freestyle</option><option value="barba">Barba</option><option value="luzes">Luzes</option><option value="navalhado">Navalhado</option></select></label>
      <label>Foto (JPG, PNG ou WEBP, até 5 MB)<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required></label>
      <label>Posição<input type="number" name="sort_order" min="0" max="999" value="99"></label>
      <div class="haus-tools-actions"><button type="submit" class="admin-primary-button">ADICIONAR FOTO</button></div>
    </form><p class="haus-tools-hint">Ocultar retira a foto do portfólio público sem destruir o arquivo original.</p><div class="haus-photo-grid" id="haus-photo-grid"></div>`;
   const form=$('#haus-photo-form'),list=$('#haus-photo-grid');
   state.photos.forEach(photo=>{
     const row=document.createElement('article');row.className='haus-photo-item';
     const pic=document.createElement('img');pic.src=getPhotoUrl(photo);pic.loading='lazy';pic.alt=photo.description||photo.title;row.append(pic);
     const caption=document.createElement('div');caption.innerHTML=`<strong>${safe(photo.title)}</strong><small>${photo.active?'Visível':'Oculta'} • ${safe(photo.category)}</small>`;
     const toggle=document.createElement('button');toggle.type='button';toggle.textContent=photo.active?'REMOVER DO SITE':'RESTAURAR';toggle.addEventListener('click',()=>submitRow('haus_gallery',{active:!photo.active},photo.id));
     const title=document.createElement('button');title.type='button';title.textContent='RENOMEAR';title.addEventListener('click',async()=>{
       const n=window.prompt('Novo título da foto:',photo.title);
       if(n===null)return;if(n.trim().length<2){message('Título precisa ter pelo menos 2 caracteres.',true);return;}
       await submitRow('haus_gallery',{title:n.trim(),description:n.trim()},photo.id);
     });
     caption.append(toggle,title);row.append(caption);list.append(row);
   });
   form.addEventListener('submit',async e=>{
     e.preventDefault();if(state.saving)return;
     const file=form.elements.photo.files?.[0];
     if(!file || file.size>5242880 || !['image/jpeg','image/png','image/webp'].includes(file.type)){
       message('Escolha JPG, PNG ou WEBP com até 5 MB.',true);return;
     }
     const title=form.elements.title.value.trim();
     if(title.length<2){message('Informe o título.',true);return;}
     const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
     const key=`uploads/${crypto.randomUUID()}.${ext}`;
     state.saving=true;message('Enviando foto...');
     try{
       await guard();
       const upload=await client.storage.from('haus-gallery').upload(key,file,{contentType:file.type,cacheControl:'3600',upsert:false});
       if(upload.error)throw upload.error;
       const save=await client.from('haus_gallery').insert({title,description:title,category:form.elements.category.value,storage_key:key,sort_order:Number(form.elements.sort_order.value)||99});
       if(save.error){await client.storage.from('haus-gallery').remove([key]);throw save.error;}
       message('Foto adicionada ao portfólio.');await load();
     }catch(e){message(errorText(e),true);}finally{state.saving=false;}
   });
 }
 // Safe refresh for manual service selection, without introducing theme customization.
 window.hausRefreshAdminServices=async()=>{
   const {data,error}=await client.from('haus_services').select('name,price_cents').eq('active',true).order('sort_order');
   if(error)throw error;
   const select=$('#manual-sale-service');if(!select)return;
   const old=select.value;
   select.replaceChildren(new Option('Selecione o serviço',''));
   for(const svc of data||[]){
     const opt=new Option(`${svc.name} - ${price(svc.price_cents)}`,svc.name);
     opt.dataset.price=String(svc.price_cents);select.add(opt);
   }
   if([...select.options].some(o=>o.value===old))select.value=old;
 };
 document.addEventListener('click',async e=>{
   if(e.target.closest('#manual-sale-open')){
     try{await window.hausRefreshAdminServices();}catch(err){console.error('Erro nos serviços ativos',err);$('#manual-sale-service').disabled=true;message(errorText(err),true);}
   }
 });
})();
