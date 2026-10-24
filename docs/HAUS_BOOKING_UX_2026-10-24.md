# HAUS BARBER — Reformulação de agendamento e ponto de restauração
**Data:** 24/10/2026  
**Projeto:** Vyzo-Studio/haus_barber  
**Escopo:** site público; interface de agendamento. Sem migrações SQL nem alterações no painel administrativo.

## Ponto de restauração (antes das alterações)

- Branch preservada: `backup/haus-2026-10-24-before-booking-ux`
- Commit exato: `2aa2b92cb061f48a21d5b1178166060ecec9152c`
- Link: https://github.com/Vyzo-Studio/haus_barber/tree/backup/haus-2026-10-24-before-booking-ux

Essa referência registra todo o conteúdo versionado do projeto naquele momento, incluindo site e painéis. Ela **não é backup do banco Supabase**, de arquivos externos ou da configuração da hospedagem fora do Git.

Para desfazer esta reformulação sem perder mudanças posteriores, compare o histórico a partir do commit de restauração e faça *reverts seletivos* ou aplique os arquivos anteriores por uma alteração revisada. Não force-reset a branch principal sem inspecionar modificações novas.

## Objetivo

Reduzir excesso de informações e duplicidade de orientações no agendamento, principalmente no celular, sem simplificar regras financeiras, comprometer a privacidade ou modificar as operações com Supabase.

## Estrutura de agendamento reformulada

1. **Serviço** aparece primeiro.
2. **Dia** e **horário** vêm em seguida, com os mesmos identificadores e comportamento de agendamento.
3. **Nome** aparece após a seleção de horário, antes da solicitação.
4. **Telefone e opção de lembrar dados** são opcionais e ficam dentro de `<details>` acessível, inicialmente recolhido.
5. Para usuários com informações lembradas previamente, o painel opcional abre ao carregar, permitindo inspecionar e editar os dados já preenchidos.
6. Quando existe telefone inválido escondido, o painel é expandido antes de focar o campo e exibir a mensagem de erro.
7. As regras de reserva provisória por até 30 minutos e confirmação pela HAUS continuam visíveis no formulário.
8. A política de privacidade e os termos continuam acessíveis por links visíveis, com informação resumida de utilização de dados.

## Ajustes de interface

- Criado `haus-booking-ux.css`, isolado e carregado após os estilos existentes.
- No celular: redução de textos redundantes, remoção da duplicação visual de cabeçalhos, painéis compactos, calendário em três colunas com botões maiores, campos confortáveis e melhores espaçamentos.
- A área opcional tem alvo de toque amplo, foco visível e funciona com teclado.
- O checkbox mantém seu tamanho natural, sem herdar a regra de 100% da largura dos campos de texto.
- Os textos novos estão disponíveis nos cinco idiomas já existentes.

## Preservação obrigatória

Os identificadores públicos de formulários, validações, funções RPC, estado de reserva, cadastro de serviços, preços, mapa, portfólio e links de confirmação WhatsApp foram preservados.

Nenhuma alteração no painel `admin.html`, `admin-combos.html`, autenticação ou Supabase foi feita especificamente por esta reformulação.

## Verificação

- Revisar sintaxe JS e unicidade de IDs essenciais.
- Conferir que o serviço permanece antes de data, horário e nome no DOM.
- Verificar, em Chromium, que os dados opcionais começam ocultos, podem ser expandidos, não perdem valores ao fechar e funcionam após recarregar.
- Conferir textos em `pt-BR`, `en`, `es`, `ja`, `de`.
- Executar a rotina `.github/workflows/haus-qa.yml` e testar visualmente em dispositivos reais.
- Homologar agendamento real somente com autorização e registros isolados.

A inspeção estática por si só **não comprova** publicação bem-sucedida, aprovação do workflow ou experiência visual em dispositivo real.
