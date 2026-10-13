# HAUS Barber — refinamento editorial v14

## Interface pública

- Seções renomeadas sem indexação decorativa: Serviços e preços, Agendamento online, Portfólio, Planos Haus, A Haus, Localização.
- Nome comercial "Combos" substituído por "Planos" na navegação, textos, CTAs, metadados e cartões. Valores e validade de 45 dias preservados.
- Removidos os números decorativos sobre as fotografias dos serviços. Passos reais de agendamento permanecem numerados por orientarem o processo.
- Portfólio editorial da versão v13 incorporado à base publicada: filtros com totais, mosaico balanceado em desktop e cartões regulares em mobile.
- Removida a coluna de estatísticas repetidas do portfólio e encurtados os textos comerciais e explicativos.
- Corrigidos fragmentos HTML malformados do pacote anterior entre o portfólio e Planos e em cinco imagens da galeria.
- CSS e JavaScript públicos cacheados com `?v=14.0`.

## Integridade

- As URLs e coordenadas do Google Maps estão preservadas.
- O formulário de agendamento, o Supabase, os nomes/preços dos serviços e os dados dos planos permanecem preservados.
- `admin.html`, `admin.css`, `admin.js`, `config.js` e banco de dados não foram modificados.
- Executado `node --check script.js` e `node --test tests/*.test.cjs` (11/11 aprovados).
- Validação adicional em Chromium com Supabase simulado: filtros, contagem, expansão, lightbox, Escape, erros do navegador e ausência de rolagem horizontal em 320, 390, 768 e 1440 px.

## Limitações

Os testes de navegador utilizaram Supabase simulado; não foi efetuada reserva real no banco. A regra atual de sobreposição de horários por duração continua fora do escopo desta atualização visual.
