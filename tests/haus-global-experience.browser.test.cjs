'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const BASE='http://127.0.0.1:8765/';
const LOCALES=['pt-BR','en','es','ja','de'];
const SIZES=[320,375,390,430,768,1024,1366,1920];

async function usePage(path='index.html',width=390){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.goto(BASE+path,{waitUntil:'domcontentloaded',timeout:25000});
 await page.locator('#haus-language').waitFor({state:'visible',timeout:16000});
 await page.waitForFunction(()=>!!window.hausExperience);
 return {browser,context,page};
}
async function finish(t){await t.context.close();await t.browser.close()}
async function noOverflow(page,label){
 const offset=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
 assert.ok(offset<=3,label+' horizontal overflow '+offset);
}
test('first visit, refusal, reload and reopening settings persist correctly',async()=>{
 const x=await usePage();try{
  const {page}=x;
  assert.equal(await page.locator('#haus-cookie-banner').isVisible(),true);
  assert.equal(await page.locator('#haus-external-map').getAttribute('src'),null);
  await page.locator('#haus-cookie-banner .haus-cookie-actions button').first().click();
  assert.equal(await page.locator('#haus-cookie-banner').isVisible(),false);
  const d=await page.evaluate(()=>JSON.parse(localStorage.getItem('vyzo:haus_barber:consent:v1')));
  assert.equal(d.external,false);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.hausExperience);
  assert.equal(await page.locator('#haus-cookie-banner').isVisible(),false);
  await page.locator('#haus-cookie-settings').click();
  assert.equal(await page.locator('#haus-cookie-overlay').isVisible(),true);
  assert.equal(await page.locator('#haus-pref-external').isChecked(),false);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#haus-cookie-overlay').isVisible(),false);
 }finally{await finish(x)}
});
test('map is not loaded before consent and is removed when permission is withdrawn',async()=>{
 const x=await usePage();try{
  const {page}=x;let mapRequests=0;
  await page.route(/maps\.google\.com\/maps/,async(route)=>{
   mapRequests++;await route.fulfill({status:200,contentType:'text/html',body:'<html><title>Mock Map</title></html>'});
  });
  await page.waitForTimeout(150);
  assert.equal(mapRequests,0);
  assert.equal(await page.locator('#haus-external-map').getAttribute('src'),null);
  await page.locator('#haus-cookie-banner .haus-cookie-actions .primary').click();
  assert.match(await page.locator('#haus-external-map').getAttribute('src'),/^https:\/\/maps\.google\.com\//);
  await page.locator('#haus-cookie-settings').click();
  await page.locator('#haus-pref-external').uncheck();
  await page.locator('#haus-cookie-overlay .haus-cookie-panel-actions .primary').click();
  assert.equal(await page.locator('#haus-external-map').getAttribute('src'),null);
  assert.equal(await page.locator('#haus-map-placeholder').isVisible(),true);
  assert.equal((await page.evaluate(()=>window.hausExperience.consent())).external,false);
 }finally{await finish(x)}
});
test('remembered contact data requires opt-in, persists and can be forgotten',async()=>{
 const x=await usePage();try{
  const {page}=x;
  await page.locator('#haus-cookie-banner .haus-cookie-actions button').first().click();
  assert.equal(await page.locator('#haus-remember').isChecked(),false);
  const notSaved=await page.evaluate(()=>window.hausExperience.rememberAfterBooking({name:'Teste Local',phone:'61999998888',checked:false}));
  assert.equal(notSaved,false);
  assert.equal(await page.evaluate(()=>localStorage.getItem('vyzo:haus_barber:remember:v1')),null);
  const saved=await page.evaluate(()=>window.hausExperience.rememberAfterBooking({name:'Teste Local',phone:'(61) 99999-8888',checked:true}));
  assert.equal(saved,true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.hausExperience);
  assert.equal(await page.locator('#nome').inputValue(),'Teste Local');
  assert.equal((await page.locator('#telefone').inputValue()).replace(/\D/g,''),'61999998888');
  assert.equal(await page.locator('#haus-remember').isChecked(),true);
  assert.equal(await page.locator('#haus-contact-options').getAttribute('open'),'');
  await page.locator('#haus-forget').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('vyzo:haus_barber:remember:v1')),null);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.hausExperience);
  assert.equal(await page.locator('#nome').inputValue(),'');
 }finally{await finish(x)}
});
test('booking is simpler, service-first, and optional contact stays accessible',async()=>{
 const x=await usePage();try{
  const {page}=x;
  await page.locator('#haus-cookie-banner .haus-cookie-actions button').first().click();
  const details=page.locator('#haus-contact-options');
  assert.equal(await details.evaluate(el=>el.open),false,'optional contact starts collapsed');
  assert.equal(await page.locator('#telefone').isVisible(),false);
  assert.equal(await page.locator('#haus-remember').isVisible(),false);
  const order=await page.evaluate(()=>{
   const form=document.querySelector('#booking-form');
   return [...form.querySelectorAll('#servico,#schedule-days,#schedule-times,#nome,#haus-contact-options,#booking-submit')].map(el=>el.id);
  });
  assert.deepEqual(order,['servico','schedule-days','schedule-times','nome','haus-contact-options','booking-submit']);
  await page.locator('#haus-contact-options summary').click();
  assert.equal(await page.locator('#telefone').isVisible(),true);
  assert.equal(await page.locator('#haus-remember').isVisible(),true);
  await page.locator('#haus-remember').check();
  assert.equal(await page.locator('#haus-remember').isChecked(),true);
  await page.locator('#haus-contact-options summary').click();
  assert.equal(await page.locator('#haus-remember').isVisible(),false);
  await page.locator('#haus-contact-options summary').click();
  assert.equal(await page.locator('#haus-remember').isChecked(),true);
 }finally{await finish(x)}
});
test('mobile remember-data card keeps checkbox small and copy within bounds in every locale',async()=>{
 const x=await usePage();try{
  const {page}=x;
  await page.locator('#haus-cookie-banner .haus-cookie-actions button').first().click();
  await page.locator('#haus-contact-options summary').click();
  for(const lang of LOCALES){
   await page.selectOption('#haus-language',lang);
   for(const width of [320,375,390,430,640]){
    await page.setViewportSize({width,height:900});
    const m=await page.evaluate(()=>{
     const field=document.querySelector('.haus-remember-field');
     const label=field.querySelector('.haus-remember-label');
     const checkbox=field.querySelector('input[type="checkbox"]');
     const copy=label.querySelector('span');
     const help=field.querySelector('#haus-remember-help');
     const rect=(el)=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,width:b.width}};
     return {field:rect(field),check:rect(checkbox),copy:rect(copy),help:rect(help),
      scrollWidth:field.scrollWidth,clientWidth:field.clientWidth};
    });
    const tag=lang+' '+width;
    assert.ok(m.check.width>=16&&m.check.width<=22,tag+' checkbox too large: '+m.check.width);
    assert.ok(m.check.right<m.copy.left,tag+' label must follow checkbox');
    assert.ok(m.copy.right<=m.field.right+1,tag+' label extends beyond card');
    assert.ok(m.help.right<=m.field.right+1,tag+' helper copy extends beyond card');
    assert.ok(m.scrollWidth<=m.clientWidth+2,tag+' card content overflows');
    await noOverflow(page,'remember card '+tag);
   }
  }
  await page.locator('#haus-remember').check();
  assert.equal(await page.locator('#haus-remember').isChecked(),true);
 }finally{await finish(x)}
});
test('five languages persist; privacy and terms fully re-render in selected language',async()=>{
 const x=await usePage();try{
  const {page}=x;
  await page.locator('#haus-cookie-banner .haus-cookie-actions button').first().click();
  await page.locator('#nome').fill('Nome do Cliente');
  await page.locator('#haus-contact-options summary').click();
  await page.locator('#telefone').fill('(61) 99999-0000');
  for(const lang of LOCALES){
   await page.selectOption('#haus-language',lang);
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('#nome').inputValue(),'Nome do Cliente');
   assert.equal(await page.locator('#telefone').inputValue(),'(61) 99999-0000');
  }
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.hausExperience);
  assert.equal(await page.locator('html').getAttribute('lang'),'de');
 }finally{await finish(x)}
 for(const path of ['privacidade.html','termos.html']){
  const t=await usePage(path);
  try{
   await t.page.locator('#haus-cookie-banner .haus-cookie-actions button').first().click();
   for(const lang of LOCALES){
    await t.page.selectOption('#haus-language',lang);
    assert.equal(await t.page.locator('html').getAttribute('lang'),lang);
    const heading=await t.page.evaluate(({path,lang})=>window.HAUS_LEGAL[path==='privacidade.html'?'privacy':'terms'][lang].title,{path,lang});
    assert.equal((await t.page.locator('#haus-legal-heading').textContent()).trim(),heading);
    assert.ok((await t.page.locator('.haus-legal-section').count())>=8);
   }
  }finally{await finish(t)}
 }
});
test('footer language selector stays compact and accessible without clipping links',async()=>{
 const x=await usePage();try{
  const {page}=x;
  await page.locator('#haus-cookie-banner .haus-cookie-actions button').first().click();
  for(const lang of LOCALES){
   await page.selectOption('#haus-language',lang);
   for(const width of [320,390,620,760,1024,1240,1366]){
    await page.setViewportSize({width,height:900});
    const data=await page.evaluate(()=>{
     const footer=document.querySelector('.site-footer .haus-global-footer');
     const field=footer.querySelector('.haus-language-field');
     const label=field.querySelector('.haus-privacy-sr-only');
     const select=field.querySelector('select');
     const links=[...footer.querySelectorAll('.haus-global-link')];
     const box=el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height}};
     return {label:box(label),select:box(select),links:links.map(box),
      selected:select.value,lang:document.documentElement.lang,
      footerOverflow:footer.scrollWidth-footer.clientWidth};
    });
    const tag=lang+' '+width;
    assert.ok(data.label.width<=2,tag+' screen reader label must be visually hidden');
    assert.ok(data.select.width<=158,tag+' selector too wide: '+data.select.width);
    assert.ok(data.select.width>=125,tag+' selector too narrow: '+data.select.width);
    assert.equal(data.selected,lang,tag+' language changed unexpectedly');
    assert.equal(data.lang,lang,tag+' document language mismatch');
    assert.ok(data.footerOverflow<=2,tag+' footer content overflows horizontally');
    for(const box of data.links){
     const overlapX=Math.min(box.right,data.select.right)-Math.max(box.left,data.select.left);
     const overlapY=Math.min(box.bottom,data.select.bottom)-Math.max(box.top,data.select.top);
     assert.ok(overlapX<=1||overlapY<=1,tag+' language dropdown overlaps footer text');
    }
    await noOverflow(page,'footer language selector '+tag);
   }
  }
 }finally{await finish(x)}
});
test('mobile-to-desktop layouts do not overflow across languages',async()=>{
 const x=await usePage();try{
  const {page}=x;
  await page.locator('#haus-cookie-banner .haus-cookie-actions button').first().click();
  for(const lang of LOCALES){
   await page.selectOption('#haus-language',lang);
   for(const width of SIZES){
    await page.setViewportSize({width,height:900});
    await page.waitForTimeout(30);
    await noOverflow(page,'index '+lang+' '+width);
   }
  }
 }finally{await finish(x)}
 for(const file of ['privacidade.html','termos.html']){
  const t=await usePage(file);
  try{
   await t.page.locator('#haus-cookie-banner .haus-cookie-actions button').first().click();
   for(const lang of LOCALES){
    await t.page.selectOption('#haus-language',lang);
    for(const width of [320,390,768,1366]){
     await t.page.setViewportSize({width,height:900});
     await noOverflow(t.page,file+' '+lang+' '+width);
    }
   }
  }finally{await finish(t)}
 }
});
test('mock successful booking stores opt-in contact only after RPC success and retains date on language switch',async()=>{
 const browser=await chromium.launch();
 const context=await browser.newContext({viewport:{width:1024,height:800}});
 const mock="window.supabase={createClient:()=>({rpc:async(name)=>({data:name==='create_booking_request'?'mocked-id':[],error:null}),from:(table)=>({select(){return this},eq(){return this},order:async()=>({data:table==='haus_services'?[{name:'Corte Social',category:'cortes',price_cents:2000,duration_minutes:30,sort_order:1}]:[],error:null})})})};";
 const page=await context.newPage();
 try{
  await page.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.118\.0/,route=>route.fulfill({status:200,contentType:'application/javascript',body:mock}));
  await page.addInitScript(()=>{window.open=()=>({closed:false,location:{href:''},close(){}})});
  await page.goto(BASE+'index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.hausExperience);
  await page.locator('#haus-cookie-banner .haus-cookie-actions button').first().click();
  await page.waitForFunction(()=>document.querySelector('#servico')?.options?.length>1);
  await page.locator('#servico').selectOption('Corte Social');
  await page.locator('#nome').fill('Cliente Teste');
  await page.locator('#haus-contact-options summary').click();
  await page.locator('#telefone').fill('(61) 99999-2222');
  await page.locator('#haus-remember').check();
  await page.waitForSelector('.schedule-day:not([disabled])',{timeout:10000});
  await page.locator('.schedule-day:not([disabled])').first().click();
  await page.locator('.schedule-time:not([disabled])').first().click();
  const day=await page.locator('#data').inputValue(),time=await page.locator('#horario').inputValue();
  await page.selectOption('#haus-language','ja');
  assert.equal(await page.locator('#data').inputValue(),day);
  assert.equal(await page.locator('#horario').inputValue(),time);
  assert.equal(await page.locator('#nome').inputValue(),'Cliente Teste');
  await page.locator('#booking-submit').click();
  await page.waitForFunction(()=>!!localStorage.getItem('vyzo:haus_barber:remember:v1'),{timeout:12000});
  const v=await page.evaluate(()=>JSON.parse(localStorage.getItem('vyzo:haus_barber:remember:v1')));
  assert.equal(v.name,'Cliente Teste');assert.equal(v.phone,'61999992222');
 }finally{await context.close();await browser.close()}
});
