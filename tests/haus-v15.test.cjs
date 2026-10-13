const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

test('lookbook priorizado, com fotos e filtros preservados', () => {
  assert.ok(html.indexOf('id="trabalhos"') < html.indexOf('id="servicos"'));
  assert.equal((html.match(/class="gallery-item /g) || []).length, 35);
  assert.equal((html.match(/class="portfolio-filter/g) || []).length, 6);
  assert.match(html, /LOOKBOOK HAUS/);
  assert.match(html, /portfolio-150\.webp/);
  assert.match(js, /applyPortfolioEditorialLayout/);
});

test('campanha e experiência direcionam ao agendamento funcional', () => {
  for (const id of ['experiencia', 'booking-form', 'schedule-days', 'schedule-times', 'booking-submit']) {
    assert.ok(html.includes('id="' + id + '"'));
  }
  assert.match(js, /create_booking_request/);
  assert.match(html, /href="#agendar"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});

test('planos, preços, localização e contatos permanecem', () => {
  assert.match(html, /PLANOS HAUS/);
  assert.equal((html.match(/class="plan-card"/g) || []).length, 3);
  assert.match(html, /45 DIAS/);
  assert.match(html, /destination=-15\.8246584%2C-48\.1270409/);
  assert.match(html, /https:\/\/www\.instagram\.com\/hausbarber_\//);
  assert.match(html, /https:\/\/wa\.me\/5561995705082/);
  for (const price of ['R$ 75', 'R$ 90', 'R$ 135', 'R$ 60', 'R$ 120', 'R$ 140']) {
    assert.ok(html.includes(price));
  }
});

test('cores da Haus, navegação acessível e responsividade', () => {
  for (const c of ['#080d1a', '#101936', '#b83a30', '#f1ede7']) assert.ok(css.includes(c));
  for (const w of ['1150px', '900px', '640px', '370px']) assert.ok(css.includes('max-width:' + w));
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(html, /style\.css\?v=15\.0/);
  assert.match(html, /script\.js\?v=15\.0/);
  assert.doesNotMatch(html, /<\/img>/i);
});
