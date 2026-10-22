'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const ix=read('index.html'),experience=read('haus-experience.js'),
  script=read('script.js'),legal=read('haus-legal-data.js'),
  terms=read('termos.html'),privacy=read('privacidade.html'),
  styles=read('haus-experience.css'),translations=read('haus-i18n-data.js');
const globals={};new Function('window',translations)(globals);
new Function('window',legal)(globals);
const supported=['pt-BR','en','es','ja','de'];

test('five languages have localized legal policies and independent customer-facing footer navigation',()=>{
 for(const lang of supported){
  assert.ok(Array.isArray(globals.HAUS_LEGAL.privacy[lang].sections));
  assert.ok(globals.HAUS_LEGAL.privacy[lang].sections.length>=8);
  assert.ok(Array.isArray(globals.HAUS_LEGAL.terms[lang].sections));
  assert.ok(globals.HAUS_LEGAL.terms[lang].sections.length>=9);
  assert.ok(globals.HAUS_LEGAL.privacy[lang].lead.length>40);
 }
 for(const html of [ix,privacy,terms]){
  assert.match(html,/href="privacidade\.html"/);
  assert.match(html,/href="termos\.html"/);
  assert.match(html,/id="haus-cookie-settings"/);
  for(const lang of supported)assert.match(html,new RegExp('value="'+lang+'"'));
 }
 assert.match(ix,/href="termos\.html" target="_blank"/);
});
test('full source static copy uses centrally maintained locale dictionaries',()=>{
 const documentText=ix.replace(/<script\b[\s\S]*?<\/script>/gi,'');
 const literals=[...documentText.matchAll(/>([^<>]+)</g)].map(x=>x[1].replace(/\s+/g,' ').trim());
 const known=globals.HAUS_I18N.en;
 for(const phrase of [
  'Pular para o conteúdo','Serviços & preços','SEU PRÓXIMO CORTE',
  'Solicitações pendentes reservam o horário por até 30 minutos.',
  'SEMPRE EM DIA.','LOCALIZAÇÃO','Configurações dos Cookies',
  'Termos de Serviço','Lembrar meus dados neste dispositivo',
  'Escolha o horário','ABRIR NO GOOGLE MAPS ↗'
 ])assert.ok(literals.includes(phrase)&&known[phrase],phrase);
 for(const lang of supported.slice(1)){
  assert.deepEqual(Object.keys(globals.HAUS_I18N[lang]).sort(),Object.keys(known).sort());
  assert.ok(Object.values(globals.HAUS_I18N[lang]).every(x=>typeof x==='string'&&x.trim()));
 }
});
test('Google map URL is held in inert dataset until the visitor opts in',()=>{
 assert.match(ix,/data-haus-src="https:\/\/maps\.google\.com\//);
 assert.doesNotMatch(ix,/<iframe[^>]+\ssrc="https:\/\/maps\.google\.com\//i);
 assert.match(experience,/decision\?\.external===true/);
 assert.match(experience,/iframe\.setAttribute\('src',url\)/);
 assert.match(experience,/iframe\.removeAttribute\('src'\)/);
});
test('banner offers equally direct accept/reject/customize and editable consent settings',()=>{
 for(const key of ['accept','reject','custom','save','external','essential'])assert.match(experience,new RegExp(key+":"));
 assert.match(experience,/getStorage\(KEYS\.consent\)/);
 assert.match(experience,/CONSENT_DAYS=180/);
 assert.match(experience,/decision=loadDecision\(\)/);
 assert.match(ix,/id="haus-cookie-settings"/);
});
test('booking stores only opt-in name and phone after RPC success, and forget deletes them',()=>{
 assert.match(ix,/id="telefone"/);
 assert.match(ix,/id="haus-remember" type="checkbox"/);
 assert.match(ix,/id="haus-forget"/);
 const rpcIdx=script.indexOf('await createBookingRequest(');
 const storeIdx=script.indexOf('rememberAfterBooking');
 assert.ok(rpcIdx>=0&&storeIdx>rpcIdx,'autofill must run only after booking RPC');
 assert.match(script,/p_customer_name:\s*nome/);
 assert.doesNotMatch(script,/p_customer_phone|p_phone|p_whatsapp/);
 assert.match(experience,/CUSTOMER_DAYS=90/);
 assert.match(experience,/removeStorage\(KEYS\.customer\)/);
 assert.match(experience,/!data\.checked/);
 assert.match(experience,/new CustomEvent\('haus-language-change'/);
});
test('user inputs and selected booking values stay untouched while language changes',()=>{
 assert.match(experience,/scan\(document\.body\)/);
 assert.match(experience,/window\.dispatchEvent\(new CustomEvent\('haus-language-change'/);
 assert.match(script,/window\.addEventListener\('haus-language-change'/);
 assert.match(script,/renderScheduleDays\(\)/);
 assert.doesNotMatch(experience,/bookingForm\.reset|form\.reset/);
});
test('sensitive details are not claimed encrypted or saved to a new customer DB',()=>{
 assert.doesNotMatch(experience,/encrypt|fingerprint|trackingId/i);
 assert.match(experience,/vyzo:haus_barber:remember:v1/);
 assert.match(experience,/window\.localStorage/);
 assert.doesNotMatch(experience,/\.from\(['"]customers/);
});
test('new JavaScript and supporting source parse cleanly',()=>{
 for(const src of ['haus-i18n-data.js','haus-experience.js','haus-legal-data.js','haus-legal.js'])assert.doesNotThrow(()=>new Function(read(src)),src);
 assert.match(styles,/--haus-exp-accent:#b83a30/);
 assert.match(ix,/haus-experience\.js\?v=1\.0/);
});
