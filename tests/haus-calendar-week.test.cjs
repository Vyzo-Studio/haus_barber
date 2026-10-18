const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');
const sql = fs.readFileSync(path.join(root, 'migrations/haus_admin_manual_calendar_v8.sql'), 'utf8');

test('lançamento manual contém semana de segunda a domingo e retorno ao dia atual', () => {
  for (const id of ['manual-week-prev','manual-week-next','manual-week-label','manual-week-days','manual-week-today','manual-sale-date']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(js, /function renderManualWeekCalendar\(\)/);
  assert.match(js, /for \(let offset = 0; offset < 7; offset \+= 1\)/);
  assert.match(js, /function resetManualWeekToToday\(\)/);
  assert.match(js, /resetManualWeekToToday\(\);/);
  assert.match(css, /\.manual-week-days\s*\{[^}]*repeat\(7,/s);
});

test('agenda administrativa inclui domingos e permite voltar semanas', () => {
  assert.match(js, /endDate\.getDate\(\) \+ 6/);
  assert.match(js, /offset < 7;/);
  assert.match(css, /\.admin-date-days\s*\{[^}]*repeat\(7,/s);
  assert.match(js, /moveAdminCalendarWeek\(/);
});

test('período anterior e futuro não são rejeitados pelo formulário ou SQL', () => {
  assert.doesNotMatch(js, /Escolha uma data de hoje ou anterior/);
  assert.doesNotMatch(sql, /Não é permitido lançar atendimentos aos domingos/);
  assert.match(sql, /p_booking_date > v_now_local::date \+ 365/);
  assert.match(sql, /on conflict \(business_date\) do nothing/i);
  assert.match(sql, /ajuste após fechamento/);
});

test('RPC continua restrita a administradores e resistente a envios repetidos', () => {
  assert.match(sql, /public\.is_admin\(\)/);
  assert.match(sql, /manual_request_id = p_request_id/);
  assert.match(sql, /hashtextextended\('haus_manual\|'/);
  assert.match(sql, /revoke all on function public\.admin_register_manual_service/i);
  assert.match(sql, /to authenticated/i);
});
