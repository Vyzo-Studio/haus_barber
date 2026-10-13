# Haus Barber V15 — Premium Editorial Experience

## Conceito
Design editorial autoral que transmite identidade de marca com o azul-marinho profundo do painel administrativo (`#080d1a`, `#101936`), branco quente (`#f1ede7`) e vermelho Haus (`#b83a30`). A referência visual é a própria barbearia, com fotografias reais já existentes no projeto.

## Site público
- Hero de campanha com tipografia de alto contraste, destaque para corte real, dois caminhos (agendamento ou lookbook), moldura e grafismos próprios da Haus.
- Lookbook promovido para a primeira seção de conteúdo; capa fotográfica exclusiva, mosaico editorial, filtros por estilo, ampliação, expansão progressiva e 35 trabalhos preservados.
- Catálogo com apresentação mais fotográfica para as três categorias de serviço e os 12 preços existentes.
- Seção "A experiência Haus" com posicionamento e etapas de escolha do visual, sem alegações não verificadas.
- Agendamento integrado ao novo design, mantendo todos os IDs, campos, mensagens, WhatsApp e RPC existentes.
- Planos Haus em aparência de assinatura, com os sete valores originais e validade de 45 dias.
- História da marca, localização exata por coordenadas e CTA final editorial.
- Mobile específico com ajustes para 320, 390 e 768 px; imagens reais sem introduzir dependências adicionais.

## Segurança e dados
Não altera `admin.html`, `admin.css`, `admin.js`, `config.js`, tabelas, RPCs, políticas RLS ou reservas no Supabase. Planos continuam informativos.

## Validação
- `node --check script.js`
- `node --test tests/*.test.cjs`
- Navegador Chromium com Supabase simulado em 320, 390, 768 e 1440 px: menu, filtros, expansão, lightbox, Escape, ausência de erros JS, ausência de rolagem horizontal.

## Limitações
Não é uma validação de reserva real em produção; a regra do banco para sobreposição de serviços com durações diferentes continua pendente de implementação própria.
