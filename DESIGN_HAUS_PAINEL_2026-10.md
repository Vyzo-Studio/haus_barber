# Haus Barber — identidade visual integrada ao painel (outubro de 2026)

## Direção visual
O site público agora utiliza as mesmas cores-base do painel administrativo: fundo `#080d1a`, painéis `#101936`, cartões secundários `#131e3d`, texto `#f1ede7` e vermelho de ação `#b83a30`. Tipografias Bebas Neue e Montserrat também acompanham o painel. A logo e as fotografias originais foram preservadas.

## Melhorias de experiência
- Cabeçalho escuro fixo, navegação simplificada e CTA destacado.
- Hero editorial com foco na fotografia real e mensagem da marca.
- Serviços/preços organizados em cartões de leitura rápida e espaçamento proporcional.
- Formulário integrado visualmente ao painel: campos, calendários, estados selecionados e alertas legíveis.
- Portfólio com filtros, expansão gradual e lightbox preservados.
- Combos informativos organizados, com os sete valores e validade de 45 dias.
- Seção de localização com prévia e link de rota ao ponto `-15.8246584,-48.1270409`.
- Rodapé e navegação móvel com as mesmas superfícies, tipografia e cores.
- Layout responsivo com respeito a áreas seguras e movimento reduzido.

## Garantias e escopo
Alterados apenas `index.html`, `style.css` e o teste `tests/haus-layout.test.cjs`. O JavaScript do agendamento, dados dos serviços, painel administrativo, autenticação e Supabase não foram modificados.

## Validação efetuada
- `node --check script.js` aprovado.
- `node --test tests/*.test.cjs`: 8/8 testes aprovados.
- Chromium em 320, 390, 768, 1024 e 1440 px: sem rolagem horizontal ou erros de JavaScript no cenário simulado.
- Menu responsivo, filtros da galeria, expansão 8→35→8, lightbox e escolha de data/horário aprovados com API simulada.
- Paleta conferida em valores RGB calculados pelo navegador.

## Pendências
- Não houve criação de reserva real nem operações no banco, no WhatsApp ou em pagamentos.
- O backend ainda não valida sobreposição por duração de serviço; isso exige uma alteração SQL específica após confirmação das durações.
- As fontes Google e o mapa externo dependem de conectividade do visitante.
