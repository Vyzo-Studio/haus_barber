const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

test('seções principais, formulário e pop-up mantêm seus pontos de integração', () => {
  const expected = ['inicio', 'conteudo', 'servicos', 'precos', 'agendar', 'trabalhos', 'combos', 'sobre', 'localizacao', 'booking-form', 'booking-submit', 'booking-status', 'schedule-days', 'schedule-times', 'schedule-summary', 'data', 'horario', 'lightbox', 'portfolio-more'];
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of expected) assert.ok(ids.includes(id), `Ausente: ${id}`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  for (const link of html.matchAll(/\bhref="#([^"]+)"/g)) assert.ok(ids.includes(link[1]), `Link quebrado: #${link[1]}`);
});

test('identidade Haus com paleta harmonizada ao painel administrativo', () => {
  for (const color of ['#080d1a', '#101936', '#b83a30', '#f1ede7']) assert.ok(css.includes(color), `Cor do painel ausente: ${color}`);
  assert.match(html, /name="theme-color" content="#080d1a"/);
  assert.doesNotMatch(css, /#223a76|#b33539|#f6f2ea/);
  assert.match(html, /family=Bebas\+Neue&family=Montserrat/);
  assert.ok(html.includes('logo-haus-barber.png'));
  assert.match(css, /@media\s*\(max-width:\s*640px\)/);
  assert.match(css, /safe-area-inset-bottom/);
});

test('portfólio preserva fotografias e possui expansão progressiva', () => {
  assert.equal((html.match(/class="gallery-item /g) || []).length, 35);
  assert.match(js, /PORTFOLIO_PREVIEW_LIMIT = 8/);
  assert.match(js, /portfolioMore\?\.addEventListener/);
  for (const item of html.matchAll(/\bsrc="(portfolio-[^" ]+\.webp)"/g)) {
    assert.ok(fs.existsSync(path.join(root, item[1])), `Imagem ausente: ${item[1]}`);
  }
});

test('integração de agenda, contatos, combos e mapa preservada', () => {
  for (const id of ['nome', 'servico', 'data', 'horario']) assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('create_booking_request') || js.includes('create_booking_request'));
  assert.ok(html.includes('https://www.instagram.com/hausbarber_/'));
  assert.ok(html.includes('https://wa.me/5561995705082'));
  assert.ok(html.includes('destination=-15.8246584%2C-48.1270409'));
  assert.ok(html.includes('45 DIAS'));
  assert.ok(html.includes('R$ 135'));
  assert.ok(html.includes('R$ 140'));
});
