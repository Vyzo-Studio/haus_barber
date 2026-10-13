const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function sourceBetween(start, end) {
  const a = code.indexOf(start);
  const b = code.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `Trecho ${start} indisponível`);
  return code.slice(a, b);
}

test('combos são informativos e não substituem serviços avulsos', () => {
  const offers = [
    ['4 Cortes Degradê', '75'],
    ['4 Cortes Degradê + Sobrancelha', '90'],
    ['4 Cortes Degradê + Barba', '135'],
    ['4 Cortes Social', '60'],
    ['4 Cortes Social + Sobrancelha', '75'],
    ['4 Cortes Social + Barba', '120'],
    ['4 Barbas', '60']
  ];
  const section = html.slice(html.indexOf('<section\n      aria-labelledby="combos-title"'), html.indexOf('<section\n      aria-labelledby="about-title"'));
  assert.match(section, /45 dias após a assinatura/);
  assert.doesNotMatch(section, /<img\b/);
  for (const [name, price] of offers) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(section, new RegExp(escaped + '[\\s\\S]{0,100}<strong>R\\$ ' + price + '<\\/strong>'));
  }
});

test('mapa e rota usam o ponto fornecido', () => {
  assert.match(html, /maps\.google\.com\/maps\?q=-15\.8246584%2C-48\.1270409/);
  assert.match(html, /google\.com\/maps\/dir\/\?api=1&amp;destination=-15\.8246584%2C-48\.1270409/);
});

test('sábado mostra a semana atual; domingo avança para segunda', () => {
  const src = sourceBetween('function getMondayForDisplayedWeek()', 'function getDisplayedWeekDates()');
  function resolve(date) {
    const scope = {
      Date: class extends Date { constructor(...args) { super(...(args.length ? args : [date])); } },
      startOfDay(x) { const d = new Date(x); d.setHours(0, 0, 0, 0); return d; },
      addDays(d, n) { const result = new Date(d); result.setDate(result.getDate() + n); return result; }
    };
    vm.createContext(scope);
    return vm.runInContext(src + '\ngetMondayForDisplayedWeek()', scope).toISOString().slice(0, 10);
  }
  assert.equal(resolve('2026-10-17T11:00:00'), '2026-10-12');
  assert.equal(resolve('2026-10-18T11:00:00'), '2026-10-19');
});

test('falhas, respostas inválidas e recuperação são tratadas em modo seguro', async () => {
  const src = sourceBetween('async function loadBookedSlots(', 'function getFriendlyBookingError(');
  async function simulate(reply) {
    const scope = {
      window: { supabaseClient: { rpc: async () => reply } },
      displayWeekDates: [new Date(2026, 9, 12), new Date(2026, 9, 17)],
      scheduleRequestRunning: false,
      scheduleAvailabilityReady: false,
      bookedSlots: new Map(),
      bookingSubmit: { disabled: true },
      bookingRequestInProgress: false,
      bookingStatus: { classList: { contains: () => false } },
      messages: [],
      rendered: 0,
      formatDateValue: d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
      formatTimeValue: s => String(s).slice(0, 5),
      getSlotKey: (d, t) => `${d}|${t}`,
      setScheduleLoading: () => {},
      renderScheduleDays: () => { scope.rendered++; },
      showBookingStatus: message => { scope.messages.push(message); },
      console: { error: () => {} }
    };
    vm.createContext(scope);
    const ok = await vm.runInContext(src + '\nloadBookedSlots()', scope);
    return { ok, scope };
  }
  for (const reply of [{ data: null, error: null }, { data: [], error: { message: 'rede indisponível' } }, {data: [{booking_date:'2026-10-12',booking_time:'09:00',slot_status:'UNKNOWN'}],error:null}]) {
    const { ok, scope } = await simulate(reply);
    assert.equal(ok, false);
    assert.equal(scope.scheduleAvailabilityReady, false);
    assert.equal(scope.bookingSubmit.disabled, true);
    assert.ok(scope.messages.some(x => x.includes('Não foi possível consultar')));
  }
  const { ok, scope } = await simulate({data: [{booking_date:'2026-10-12',booking_time:'09:00:00',slot_status:'pending'}],error:null});
  assert.equal(ok, true);
  assert.equal(scope.scheduleAvailabilityReady, true);
  assert.equal(scope.bookingSubmit.disabled, false);
  assert.equal(scope.bookedSlots.get('2026-10-12|09:00'), 'pending');
});
