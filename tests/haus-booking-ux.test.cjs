'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const style=read('haus-booking-ux.css');
const script=read('script.js');
const experience=read('haus-experience.js');
const locale=read('haus-i18n-data.js');
const form=html.slice(html.indexOf('<form class="booking-form"'),html.indexOf('</form>',html.indexOf('<form class="booking-form"'))+7);
const unique=id=>{const n=(form.match(new RegExp('id="'+id+'"','g'))||[]).length;assert.equal(n,1,id+' must exist exactly once')};

test('public form keeps the exact existing booking control IDs, once each',()=>{
 for(const id of ['booking-form','servico','schedule-days','schedule-times','schedule-summary','nome','telefone','haus-contact-options','haus-remember','haus-forget','haus-remember-status','booking-status','data','horario','booking-submit'])unique(id);
});

test('visual flow is service, date, time, name, optional contact, submit',()=>{
 const ids=['servico','schedule-days','schedule-times','nome','haus-contact-options','booking-submit'];
 const positions=ids.map(id=>form.indexOf('id="'+id+'"'));
 assert.ok(positions.every(n=>n>=0));
 assert.ok(positions.every((n,i)=>i===0||n>positions[i-1]),'mobile DOM follows customer decision order');
 assert.match(form,/<details class="field field-full booking-optional-details" id="haus-contact-options">/);
 assert.doesNotMatch(form,/<details[^>]*\sopen(?:\s|>|=)/,'optional contact starts collapsed');
 assert.ok(form.indexOf('haus-privacy-notice')>form.indexOf('</details>'),'legal notice remains immediately accessible');
 assert.match(form,/href="privacidade\.html"/);
 assert.match(form,/href="termos\.html"/);
});

test('opt-in safety, status feedback and service booking logic remain present',()=>{
 assert.match(form,/id="haus-remember" type="checkbox"/);
 assert.match(experience,/if\(contactOptions\)contactOptions\.open=true/);
 assert.match(experience,/rememberAfterBooking/);
 assert.match(script,/create_booking_request/);
 assert.match(script,/querySelector\('#haus-contact-options'\)\?\.setAttribute\('open',''\)/);
});

test('new responsive styles and browser regression suite are linked',()=>{
 assert.match(html,/href="haus-booking-ux\.css\?v=1\.0"/);
 assert.match(style,/@media\(max-width:640px\)/);
 assert.match(style,/\.schedule-days\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(style,/\.haus-remember-label input\[type="checkbox"\]/);
});

test('all four nondefault locale dictionaries include the new booking copy',()=>{
 const keys=[
  'Escolha seu serviço, o dia e o horário. Depois, confirme seu pedido com a Haus pelo WhatsApp.',
  'Adicionar telefone (opcional)',
  'Ao solicitar, o horário fica reservado por até 30 minutos. A confirmação é feita pela Haus Barber.',
  'Nome, serviço, dia e horário são usados no pedido e podem ser incluídos na mensagem do WhatsApp.'
 ];
 // Lightweight sandbox: only the existing static localization dictionaries execute.
 const globalStub={};
 new Function('window',locale+';return window.HAUS_I18N')(globalStub);
 for(const lang of ['en','es','ja','de'])for(const key of keys){
  assert.ok(globalStub.HAUS_I18N[lang]?.[key],lang+' missing '+key);
 }
});
