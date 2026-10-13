# Redesign Haus Barber — Outubro de 2026

## Escopo

Reconstrução do site público para apresentar a Haus como uma barbearia editorial e contemporânea, preservando a marca e as cores oficiais azul-marinho, azul, vermelho, creme e bege. Mantidas as fotos reais, serviços, preços, contatos, combos e coordenadas do Google Maps já utilizados.

## Estrutura

- Hero de duas colunas com fotografia real, títulos e ações claras
- Navegação fixa, menu mobile e atalhos de acesso rápido
- Serviços em três cards fotográficos; preços organizados por categoria
- Agendamento antecipado na página, preservando IDs, opções, mensagens e contrato da RPC
- Portfólio com filtros, 8 fotos inicialmente, opção de expansão e lightbox com controle de foco
- Combos Haus com as sete ofertas, validade de 45 dias e contato pela DM
- Apresentação da marca, mapa incorporado e rota direta para as coordenadas fornecidas
- SEO local estruturado com `BarberShop` e dados existentes

## Arquivos modificados

- `index.html` — novo layout público
- `style.css` — folha de estilos pública reescrita e responsiva
- `script.js` — portfólio compacto, filtro, foco do lightbox e rótulo do envio
- `tests/haus-public.test.cjs` — testes de conteúdo adaptados à nova estrutura
- `tests/haus-layout.test.cjs` — novos testes de invariantes

## Testes

- `node --check script.js`, `config.js`, `admin.js`
- `node --test tests/haus-public.test.cjs tests/haus-layout.test.cjs`
- Renderização responsiva isolada em Chromium: 1440, 768, 390, 320 px
- Simulações do navegador (sem gravar reservas): navegação mobile, filtros, expandir/recolher, lightbox, disponibilidade e estados básicos
- Garantias estáticas: IDs únicos, âncoras válidas, imagens existentes, ofertas/preços e links

## Pontos que exigem validação com usuários reais

- O backend Supabase permaneceu inalterado. Suas funções atuais impedem conflitos do mesmo horário de início, mas não validam sobreposições pela duração de serviços. Isso deve ser resolvido separadamente após definição formal das durações.
- Nenhuma reserva real foi criada em produção durante estes testes. Não foi realizado teste de pagamento ou reembolso. A integração real precisa ser testada e monitorada após a publicação.
- A visualização de fontes remotas e o mapa externo dependem de rede e permissões do navegador do visitante.
