# Haus Barber — Redesign coerente com a marca (outubro/2026)

## Objetivo
Reestruturar inteiramente o site público usando a GNG somente como referência de navegação: preservar personalidade da Haus, paleta extraída da logo, fotografia e informações comerciais.

## Alterações
- Paleta de marca: azul #223a76, vermelho #b33539, marfim #eee7da, preto #151515; variações tonais das mesmas cores.
- Hero fotográfico, navegação simplificada e faixa de dados essenciais.
- Serviços e preços reunidos (12 serviços e mesmos valores existentes).
- Formulário de agendamento e todos os pontos de integração e RPCs preservados.
- Portfólio filtrável (35 fotos), lightbox e carregamento progressivo.
- Combos: Degradê R$ 75/90/135, Social R$ 60/75/120, Barba R$ 60; quatro atendimentos, validade de 45 dias após a assinatura; contato pela DM.
- Localização com ponto -15.8246584,-48.1270409 e o novo link Maps fornecido; removida a afirmação antiga de endereço textual para evitar divergência.
- Estrutura mobile para 320/390/768 px; sem largura excedente nas verificações.

## Validações
- node --test tests/haus-public.test.cjs tests/haus-layout.test.cjs — 8/8 OK.
- node --check script.js/admin.js/config.js — OK.
- Navegador Chromium com Supabase simulado: 320, 390, 768 e 1440 px, sem scroll horizontal; agenda, filtros, menu, lightbox e Escape OK.
- Sem alterações no banco de dados Supabase ou painel administrativo.

## Pendências
- Teste ponta a ponta com reserva real e WhatsApp na produção.
- Sobreposição de serviços de durações distintas precisa de revisão no banco, escopo separado.
- Conferir conclusão da publicação no GitHub Pages.
