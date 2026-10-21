/* HAUS BARBER public catalog and portfolio — design/colors remain in the existing CSS. */
(() => {
 'use strict';
 const client=window.supabaseClient;
 if(!client)return;
 const currency=cents=>(Number(cents)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0,maximumFractionDigits:2});
 async function loadServices(){
  const {data,error}=await client.from('haus_services').select('name,category,price_cents,sort_order').eq('active',true).order('sort_order');
  if(error||!Array.isArray(data))throw error||Error('Catálogo inválido');
  const select=document.querySelector('#servico');
  if(select){
   const saved=select.value;
   select.replaceChildren(new Option('Escolha um serviço','',true,false));
   select.options[0].disabled=true;
   data.forEach(s=>{
    const option=new Option(`${s.name} — ${currency(s.price_cents)}`,s.name);
    option.dataset.price=s.price_cents;
    select.appendChild(option);
   });
   if(data.some(s=>s.name===saved))select.value=saved;
  }
  const groups=[['corte',0],['barba',1],['quimica',2]];
  const cards=[...document.querySelectorAll('#precos .menu-card')];
  groups.forEach(([category,index])=>{
   const list=cards[index]?.querySelector('.menu-prices');if(!list)return;
   list.replaceChildren();
   const rows=data.filter(s=>s.category===category);
   rows.forEach(s=>{
    const li=document.createElement('li');const name=document.createElement('span');const price=document.createElement('strong');
    name.textContent=s.name;price.textContent=currency(s.price_cents);li.append(name,price);list.append(li);
   });
   cards[index].hidden=!rows.length;
  });
  if(!data.length){const message=document.querySelector('#booking-status');if(message){message.hidden=false;message.className='booking-status is-error';message.textContent='Agendamentos online indisponíveis no momento. Consulte a Haus Barber.';}const submit=document.querySelector('#booking-submit');if(submit)submit.disabled=true;}
 }
 async function loadPortfolio(){
  const {data,error}=await client.from('haus_portfolio').select('image_path,storage_path,category,title,alt_text,sort_order').eq('active',true).order('sort_order');
  if(error||!Array.isArray(data))throw error||Error('Galeria inválida');
  const gallery=document.querySelector('.portfolio-gallery');if(!gallery)return;
  const fresh=[];
  data.forEach(p=>{
   const button=document.createElement('button');button.type='button';button.className='gallery-item';
   const src=p.storage_path?client.storage.from('haus-portfolio').getPublicUrl(p.storage_path).data.publicUrl:p.image_path;
   button.dataset.image=src;button.dataset.alt=p.alt_text;button.dataset.category=p.category;button.dataset.title=p.title;
   const img=document.createElement('img');img.src=src;img.alt=p.alt_text;img.loading='lazy';img.decoding='async';
   const label=document.createElement('span');const small=document.createElement('small');small.textContent=p.title.toLocaleUpperCase('pt-BR');label.append(small);button.append(img,label);fresh.push(button);
  });
  gallery.replaceChildren(...fresh);
  if(typeof window.hausRefreshGallery==='function')window.hausRefreshGallery();
 }
 // Fail gracefully, retain static page if database is temporarily unavailable.
 loadServices().catch(error=>console.warn('Serviços Haus:',error));
 loadPortfolio().catch(error=>console.warn('Portfólio Haus:',error));
})();