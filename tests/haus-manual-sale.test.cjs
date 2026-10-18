const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');
const sql = fs.readFileSync(path.join(root, 'MANUAL_SALES_2026-10.sql'), 'utf8');

function buildHarness(rpc) {
  const messages = [];
  const rpcCalls = [];
  const listener = {};
  const button = () => ({ disabled:false, textContent:'', focus() {}, addEventListener(name, cb){listener[name] = cb;} });
  const field = (value='') => ({value, addEventListener() {}, selectedOptions:[{dataset:{price:2500}}], focus(){}});
  const ctx = {
    manualSaleOpen: button(), manualSaleClose: button(), manualSaleCancel: button(), manualSaleSubmit: button(),
    manualSaleBackdrop:button(), manualSaleService:field('Corte Degradê - R$ 25'),manualSaleDate:field('2026-10-17'),
    manualSaleTime:field('10:30'),manualSalePayment:field('pix'),manualSaleName:field(''), manualSalePrice:field(),
    manualSaleMessage:{hidden:true,textContent:'',className:''},
    manualSaleModal:{hidden:true},manualSaleDialog:{querySelectorAll(){return []}},
    manualSaleForm:{reset(){},reportValidity(){return true},querySelectorAll(){return []},addEventListener(){}},
    adminDateFilter:{value:'2026-10-17'}, adminSearch:{value:'something'},
    manualSaleSaving:false, manualSaleRequestId:null,manualSalePreviousFocus:null,
    currentUser:{id:'admin'},
    window:{crypto:{randomUUID(){return 'e5077777-1111-4111-8111-111111111111'}},supabaseClient:{async rpc(n,a){rpcCalls.push({n,a});return rpc(n,a);}}},
    document:{body:{classList:{add(){},remove(){}}},activeElement:{focus(){}},addEventListener(){}},
    getTodayValue(){return '2026-10-17'},formatCurrency(n){return `R$ ${(n/100).toFixed(2)}`;},
    parseBookingDate(v){return new Date(`${v}T12:00:00`);},selectAdminCalendarDate(){},setBookingView(){},
    showGlobalMessage(...args){messages.push(args)},async refreshAllData(){},console:{error(){}}
  };
  vm.createContext(ctx);
  const start = js.indexOf('function showManualSaleMessage(');
  const end = js.indexOf("adminLoginForm?.addEventListener(\n  'submit',", start);
  assert.ok(start>0 && end>start);
  vm.runInContext(js.slice(start,end),ctx);
  return {ctx,calls:rpcCalls,messages,submit:()=>ctx.submitManualSale({preventDefault(){}})};
}

test('campos de lançamento e nome opcional, sem IDs repetidos', () => {
  for (const id of ['manual-sale-form','manual-sale-service','manual-sale-date','manual-sale-time','manual-sale-payment','manual-sale-name','manual-sale-submit']) {
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html, /id="manual-sale-name"[^>]+maxlength="80"/);
  assert.doesNotMatch(html, /id="manual-sale-name"[^>]*\brequired\b/);
  assert.match(html, /LANÇAR ATENDIMENTO/);
  assert.match(html, /admin\.css\?v=7\.0/);
  assert.match(html, /admin\.js\?v=7\.0/);
  assert.match(css, /\.manual-sale-grid/);
  assert.match(css, /max-width:480px/);
  assert.equal([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]).length,new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1])).size);
});

test('preços do formulário são compatíveis com catálogo público e SQL',()=>{
  const options=[...html.matchAll(/<option value="([^"]+)" data-price="(\d+)">/g)];
  assert.equal(options.length,12);
  for(const [,label,price] of options){
    assert.ok(Number(price)>0);
    assert.ok(sql.includes(`'${label}'`));
  }
});

test('nome vazio é enviado como null e a data/pagamento/valor são preservados',async()=>{
  const h=buildHarness(async()=>({data:'id',error:null}));
  await h.submit();
  assert.equal(h.calls.length,1);
  const call=h.calls[0];
  assert.equal(call.n,'admin_register_manual_service');
  assert.equal(call.a.p_customer_name,null);
  assert.equal(call.a.p_booking_date,'2026-10-17');
  assert.equal(call.a.p_booking_time,'10:30:00');
  assert.equal(call.a.p_payment_method,'pix');
  assert.equal(call.a.p_service,'Corte Degradê - R$ 25');
  assert.equal(h.ctx.manualSaleModal.hidden,true);
  assert.match(h.messages[0][0],/lançado e recebido/);
});

test('botão bloqueia envio paralelo e mesma chave é reutilizada depois de erro de rede',async()=>{
  let resolve;
  const h=buildHarness(()=>new Promise(r=>{resolve=r}));
  const a=h.submit();
  await h.submit();
  assert.equal(h.calls.length,1);
  assert.equal(h.ctx.manualSaleSubmit.disabled,true);
  const key=h.calls[0].a.p_request_id;
  resolve({error:{message:'fetch failed'}});
  await a;
  assert.equal(h.ctx.manualSaleSubmit.disabled,false);
  const b=h.submit();
  assert.equal(h.calls.length,2);
  assert.equal(h.calls[1].a.p_request_id,key);
  resolve({error:null});
  await b;
});

test('cliente informado é preservado e data futura é rejeitada',async()=>{
  const h=buildHarness(async()=>({error:null}));
  h.ctx.manualSaleDate.value='2026-10-18';
  await h.submit();
  assert.equal(h.calls.length,0);
  assert.match(h.ctx.manualSaleMessage.textContent,/hoje ou anterior/);
  h.ctx.manualSaleDate.value='2026-10-17';
  h.ctx.manualSaleName.value='Maria';
  await h.submit();
  assert.equal(h.calls[0].a.p_customer_name,'Maria');
});

test('RPC segura: acesso admin, chave idempotente, valida preço, venda atômica e GRANT restrito',()=>{
  assert.match(sql,/security definer/i);
  assert.match(sql,/set search_path = ''/i);
  assert.match(sql,/if not public\.is_admin\(\)/);
  assert.match(sql,/hashtextextended\('haus_manual\|'/);
  assert.match(sql,/manual_request_id = p_request_id/);
  assert.match(sql,/create unique index if not exists bookings_manual_request_id_unique/i);
  assert.match(sql,/public\.service_price_cents\(v_service\)/);
  assert.match(sql,/status = 'open'/);
  assert.match(sql,/insert into public\.bookings/);
  assert.match(sql,/insert into public\.cash_entries/);
  assert.match(sql,/revoke all on function public\.admin_register_manual_service/);
  assert.match(sql,/grant execute on function public\.admin_register_manual_service[\s\S]*to authenticated/);
});
