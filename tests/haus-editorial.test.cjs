const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

test('seções têm títulos limpos e Planos é a nomenclatura pública', () => {
  for (const title of ['SERVIÇOS E PREÇOS', 'AGENDAMENTO ONLINE', 'PORTFÓLIO', 'PLANOS HAUS', 'A HAUS', 'LOCALIZAÇÃO']) {
    assert.ok(html.includes(`>${title}</span>`), `Cabeçalho ausente: ${title}`);
  }
  assert.doesNotMatch(html, /0[1-6]\s*\/\s*(SERVIÇOS|AGENDA|PORTFÓLIO|COMBOS|QUEM SOMOS|ONDE ESTAMOS)/i);
  assert.doesNotMatch(html, />\s*Combos\s*</i);
  assert.doesNotMatch(html, /\bCOMBOS HAUS\b|FALAR SOBRE OS COMBOS|\d\d\s*\/\s*COMBO/i);
  assert.match(html, /CONHECER OS PLANOS/);
  assert.equal((html.match(/>PLANO HAUS</g) || []).length, 3);
});

test('marca, catálogo, portfólio editorial e formulário mantidos', () => {
  assert.match(css, /#080d1a/);
  assert.match(css, /#101936/);
  assert.match(css, /#b83a30/);
  assert.match(html, /id="booking-form"/);
  assert.match(html, /id="combos"/);
  assert.match(html, /id="portfolio-current-title"/);
  assert.match(js, /applyPortfolioEditorialLayout/);
  assert.equal((html.match(/class="gallery-item /g) || []).length, 35);
  assert.equal((html.match(/class="plan-card"/g) || []).length, 3);
  for (const price of ['R$ 75', 'R$ 90', 'R$ 135', 'R$ 60', 'R$ 120']) {
    assert.ok(html.includes(price));
  }
  assert.ok(html.includes('45 DIAS'));
});

test('HTML estrutural e versionamento sem fragmentos inválidos', () => {
  assert.doesNotMatch(html, /<section[^>]*<section/);
  assert.doesNotMatch(html, /<\/img>/i);
  assert.match(html, /style\.css\?v=14\.0/);
  assert.match(html, /script\.js\?v=16\.0/);
  assert.ok(html.includes('destination=-15.8246584%2C-48.1270409'));
});
