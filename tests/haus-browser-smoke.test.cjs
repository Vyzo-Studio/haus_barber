'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require('playwright');
const BASE='http://127.0.0.1:8765/';
const outputs=path.resolve(__dirname,'../browser-artifacts');
fs.mkdirSync(outputs,{recursive:true});

async function inspectPage(file,width,height,expected){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  const res=await page.goto(BASE+file,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(res.status(),200,file+' HTTP status');
  const title=await page.title();
  assert.ok(title.toLowerCase().includes('haus'),file+' document title');
  await page.locator(expected).waitFor({state:'visible',timeout:12000});
  await page.waitForTimeout(700);
  const horizontalOverflow=await page.evaluate(()=>{
    return Math.max(0,document.documentElement.scrollWidth-window.innerWidth);
  });
  await page.screenshot({path:path.join(outputs,file.replaceAll(/[/.]/g,'-')+'-'+width+'.png'),fullPage:true});
  assert.ok(horizontalOverflow<=3,file+' horizontal overflow '+horizontalOverflow+'px at '+width);
  assert.deepEqual(errors,[],file+' JavaScript uncaught errors');
  return {file,width,height,horizontalOverflow};
 }finally{await context.close();await browser.close()}
}
for(const [file,selector] of [
 ['index.html','#hero-title'],
 ['admin.html','#admin-login-form'],
 ['admin-combos.html','#authGate #loginForm'],
 ['admin-reconciliation.html','#authGate #loginForm'],
 ['privacidade.html','main h1']
]){
 for(const width of [390,768,1440]){
  test(file+' viewport '+width+' no overflow and usable entrypoint',async()=>{
   await inspectPage(file,width,900,selector);
  });
 }
}
test('admin management pages never reveal private dashboard without signing in',async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  for(const [file,id] of [['admin.html','#admin-dashboard'],['admin-combos.html','#comboApp'],['admin-reconciliation.html','#reconciliationApp']]){
   await page.goto(BASE+file,{waitUntil:'domcontentloaded',timeout:30000});
   const hidden=await page.locator(id).evaluate(el=>el.hidden);
   assert.equal(hidden,true,file+' unauthenticated content should be hidden');
  }
 }finally{await browser.close()}
});
