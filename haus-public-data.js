/* HAUS public catalog: the DB is the price source of truth. */
(() => {
 'use strict';
 const client=window.supabaseClient;
 const select=document.querySelector('#servico');
 const gallery=document.querySelector('.portfolio-gallery');
 if(!client||!select)return;
 const booking=document.querySelector('#booking-submit');
 const label=select.closest('.field');
 const note=document.createElement('p');
 note.className='haus-catalog-status';note.setAttribute('role','status');note.setAttribute('aria-live','polite');
 label?.append(note);
 select.disabled=true;if(booking)booking.disabled=true;
 const format=c=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(c||0)/100);
 function updateServices(items){
   const prev=select.value;
   select.replaceChildren(new Option('Escolha um serviço',''));
   for(const s of items)select.add(new Option(s.name+' — '+format(s.price_cents),s.name));
   if(items.some(s=>s.name===prev))select.value=prev;
   const cards=Array.from(document.querySelectorAll('.menu-grid .menu-card'));
   const categories=['cortes','detalhes','estilo'];
   cards.forEach((card,i)=>{
     const ul=card.querySelector('.menu-prices');if(!ul)return;
     const subset=items.filter(s=>s.category===categories[i]);
     card.hidden=!subset.length;
     ul.replaceChildren();
     for(const s of subset){
       const li=document.createElement('li');
       const name=document.createElement('span');name.textContent=s.name;
       const val=document.createElement('strong');val.textContent=format(s.price_cents);
       li.append(name,val);ul.append(li);
     }
   });
 }
 async function loadPrices(){
   try {
     const {data,error}=await client.from('haus_services').select('name,price_cents,category,sort_order').eq('active',true).order('sort_order');
     if(error)throw error;
     if(!data?.length)throw Error('Nenhum serviço ativo encontrado.');
     updateServices(data);
     select.disabled=false;if(booking)booking.disabled=false;note.textContent='';
   }catch(e){
     note.textContent='Não foi possível carregar preços atualizados. Para agendar, fale com a Haus pelo WhatsApp.';
     console.error('Erro ao carregar serviços:',e);
   }
 }
 function photoUrl(s){
   if(s.storage_key)return client.storage.from('haus-gallery').getPublicUrl(s.storage_key).data?.publicUrl||'';
   return s.local_filename||'';
 }
 async function loadGallery(){
   if(!gallery)return;
   try{
     const {data,error}=await client.from('haus_gallery').select('title,description,category,local_filename,storage_key,sort_order').eq('active',true).order('sort_order');
     if(error)throw error;
     if(!Array.isArray(data))throw Error('Resposta inválida do portfólio');
     const fragment=document.createDocumentFragment();
     for(const s of data){
       const src=photoUrl(s);if(!src)continue;
       const button=document.createElement('button');
       button.type='button';button.className='gallery-item reveal';
       button.dataset.category=s.category;button.dataset.title=s.title;button.dataset.image=src;
       button.dataset.alt=s.description||s.title;
       const img=document.createElement('img');img.alt=s.description||s.title;img.src=src;img.loading='lazy';
       img.width=1200;img.height=1600;
       const span=document.createElement('span'),small=document.createElement('small');
       small.textContent=s.category.toUpperCase().replaceAll(' ',' • ');span.append(small);
       button.append(img,span);fragment.append(button);
     }
     gallery.replaceChildren(fragment);
     window.hausSyncPortfolio?.();
   }catch(e){
     console.warn('Portfólio do servidor indisponível; fotos locais permanecem visíveis.',e);
   }
 }
 loadPrices();
 loadGallery();
})();
