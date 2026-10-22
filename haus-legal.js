/* Haus legal view: localized, safe DOM text rendering. */
(()=>{
 'use strict';
 const type=document.body.dataset.hausLegal;
 if(!['privacy','terms'].includes(type))return;
 const $=id=>document.getElementById(id);
 function render(){
  const locale=window.hausExperience?.getLocale?.()||'pt-BR';
  const page=window.HAUS_LEGAL?.[type]?.[locale]||window.HAUS_LEGAL?.[type]?.['pt-BR'];
  if(!page||!Array.isArray(page.sections))return;
  const labels={
   privacy:{'pt-BR':'Política de Privacidade',en:'Privacy Policy',es:'Política de Privacidad',ja:'プライバシーポリシー',de:'Datenschutzerklärung'},
   terms:{'pt-BR':'Termos de Serviço',en:'Terms of Service',es:'Términos del Servicio',ja:'利用規約',de:'Nutzungsbedingungen'}
  };
  $('haus-legal-eyebrow').textContent=page.eyebrow;
  $('haus-legal-heading').textContent=page.title;
  $('haus-legal-lead').textContent=page.lead;
  $('haus-legal-back').textContent=page.back;
  $('haus-legal-contact-title').textContent=page.contact;
  $('haus-legal-note').textContent=page.note;
  $('haus-legal-cta').textContent=page.cta;
  document.title=labels[type][locale]+' | Haus Barber';
  const sections=document.createDocumentFragment();
  page.sections.forEach(([title,body])=>{
   const section=document.createElement('section');section.className='haus-legal-section';
   const heading=document.createElement('h2');heading.textContent=title;
   const text=document.createElement('p');text.textContent=body;
   section.append(heading,text);sections.append(section);
  });
  $('haus-legal-sections').replaceChildren(sections);
 }
 render();
 window.addEventListener('haus-language-change',render);
})();