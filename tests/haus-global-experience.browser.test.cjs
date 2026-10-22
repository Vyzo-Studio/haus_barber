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
  await page.locator('#haus-forget').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('vyzo:haus_barber:remember:v1')),null);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.hausExperience);
  assert.equal(await page.locator('#nome').inputValue(),'');
 }finally{await finish(x)}
});
test('five languages persist; privacy and terms fully re-render in selected language',async()=>{
 const x=await usePage();try{
  const {page}=x;
  await page.locator('#haus-cookie-banner .haus-cookie-actions button').first().click();
  await page.locator('#nome').fill('Nome do Cliente');await page.locator('#telefone').fill('(61) 99999-0000');
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
