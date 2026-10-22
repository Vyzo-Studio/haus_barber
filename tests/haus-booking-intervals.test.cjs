'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'script.js'),'utf8');
const schema=fs.readFileSync(path.join(root,'supabase/migrations/20261021_omega_booking_interval_schema.sql'),'utf8');
const functions=fs.readFileSync(path.join(root,'supabase/migrations/20261021_omega_booking_duration_rpcs.sql'),'utf8');
const pub=fs.readFileSync(path.join(root,'haus-public-dynamic.js'),'utf8');
const admin=fs.readFileSync(path.join(root,'haus-admin-extensions.js'),'utf8');
const html=fs.readFileSync(path.join(root,'admin.html'),'utf8');
const start=js.indexOf('function getSelectedServiceDuration()');
const end=js.indexOf('function showBookingStatus(',start);
assert.ok(start>=0&&end>start);
const source=js.slice(start,end);

function slotStatus(opts){
  const option={dataset:{duration:opts.duration==null?'':String(opts.duration),category:opts.category||'cortes'}};
  const slots=new Map(Object.entries(opts.slots||{}));
  const getSlot=new Function('document','scheduleAvailabilityReady','bookedSlots','getSlotKey',
    source+'return getSlotStatus;');
  return getSlot({querySelector:()=>({selectedOptions:[option]})},
    opts.ready!==false,slots,(date,time)=>date+'|'+time);
}
const check=(options,time,expected)=>assert.equal(slotStatus(options)('2026-10-22',time),expected);

test('two-hour service is blocked by existing thirty-minute appointment inside interval',()=>{
 check({duration:120,slots:{'2026-10-22|10:00':'occupied'}},'09:00','occupied');
 check({duration:30,slots:{'2026-10-22|10:00':'occupied'}},'09:00','available');
});
test('back-to-back appointments stay allowed',()=>{
 check({duration:60,slots:{'2026-10-22|11:00':'occupied'}},'10:00','available');
 check({duration:60,slots:{'2026-10-22|10:30':'occupied'}},'10:00','occupied');
});
test('temporary pending reservations block overlapping times',()=>{
 check({duration:90,slots:{'2026-10-22|11:00':'pending'}},'10:00','pending');
});
test('no service exceeds 20:00 and unknown chemical duration fails closed',()=>{
 check({duration:90},'19:00','unavailable');
 check({duration:30},'20:00','unavailable');
 check({duration:null,category:'estilo'},'09:00','unavailable');
 check({duration:null,category:'cortes'},'09:00','available');
});
test('availability errors remain fail-closed',()=>{
 check({duration:60,ready:false},'10:00','unavailable');
});
test('Postgres exclusion checks half-open ranges atomically',()=>{
 assert.match(schema,/exclude using gist/i);
 assert.match(schema,/tsrange\(/);
 assert.ok(schema.includes("'[)'") );
 assert.match(functions,/pg_advisory_xact_lock/);
 assert.match(functions,/&& tsrange\(v_start,v_finish/);
 assert.match(functions,/v_finish>p_booking_date\+time '20:00'/);
 assert.match(functions,/generate_series\(/);
 assert.match(functions,/v_duration\s*,\s*'pending'/);
});
test('catalog and admin editor honor real configured service durations',()=>{
 assert.match(pub,/duration_minutes/);
 assert.match(pub,/option\.dataset\.duration/);
 assert.match(html,/id="haus-service-duration"/);
 assert.match(admin,/duration_minutes:duration/);
});
