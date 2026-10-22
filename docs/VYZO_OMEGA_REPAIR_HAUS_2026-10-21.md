# VYZO OMEGA REPAIR — Relatório técnico de entrega HAUS Barber
**Data-base:** 21/10/2026 (Brasília). **Repositório:** `Vyzo-Studio/haus_barber`. **Branch:** `fix/omega-repair-2026-10-21`. **PR:** https://github.com/Vyzo-Studio/haus_barber/pull/17
**Commit auditado:** `323b3e194775fbd0c0316f34cf887aaa334fc6a3`.

## A. Resumo executivo
Inspeção do repositório e do Supabase `pmhpgrdeknzbvegkrnxi` (ativo). Ajustes de privacidade, agendamento com bloqueio de intervalos, segurança de login, correção de datas de caixa, identidade de clientes com WhatsApp compartilhado, fotos, paginação de combos e automação de QA.
**Nenhum lançamento histórico foi reclassificado, nenhum contrato, fotografia ou dado de cliente de produção foi excluído.** Correções foram feitas em migrações com transação de teste e sem vendas simuladas persistidas.
**Limite:** testes automatizados são regressões de código/contratos e análises de SQL; não substituem testes de fluxo autenticado e de concorrência real sob navegador de produção.

## B. Matriz de 14 observações
| ID | Problema/ação | Situação |
|---|---|---|
| HAUS-001 | Aviso antes do envio e `privacidade.html`; rodapé com link e fluxos WhatsApp/Supabase | IMPLEMENTADO; validação jurídica ainda necessária |
| HAUS-002 | CDN Supabase pinado `2.118.0` em três interfaces e fallback do admin | IMPLEMENTADO; pacote existe, login precisa smoke test |
| HAUS-003 | RPCs `haus_register_payment_parts` e `haus_register_manual_parts` existentes; versões originais capturadas no SQL; manual agora atômica | PARCIAL; não executei pagamento real de ponta a ponta |
| HAUS-004 | Endereços corrigidos `haus_barber` em sitemap/robots | IMPLEMENTADO; robots em subdiretório do Pages não substitui robots da raiz da origem |
| HAUS-005 | Durations em serviço/booking, constraint GiST, RPCs e calendário verificam intervalos | PARCIAL; duração real do catálogo ainda não cadastrada |
| HAUS-006 | Calendário atual compartilhado; tabela de barbeiros sem registros ativos no instante da verificação | NÃO APLICÁVEL **à arquitetura atual**; agenda paralela por profissional depende de demanda formal |
| HAUS-007 | `haus_combo_admin_list` e `haus_combo_admin_catalog`; busca e filtros no servidor, paginação 30/página | IMPLEMENTADO; não testado com >700 contratos reais |
| HAUS-008 | Gestão de foco/Tab/Escape/retorno ao acionador e conteúdo de fundo inerte em modais de combos | IMPLEMENTADO; validação de leitor de tela/navegador ainda pendente |
| HAUS-009 | Ocultar, arquivar/restaurar e excluir arquivo Storage após checagem de referências; arquivo GitHub não é apagável pelo painel | PARCIAL; exclusão permanente não foi executada em produção |
| HAUS-010 | Supabase auth usa `sessionStorage` preferencial e remove token local antigo | IMPLEMENTADO; não substitui proteção contra XSS nem revogação remota |
| HAUS-011 | Remove unicidade obrigatória do WhatsApp, impede renomeação por upsert de número compartilhado | IMPLEMENTADO; sem criar clientes fictícios em produção |
| HAUS-012 | Cancelamento de combos preservado sem reembolso automático; estorno é uma operação financeira separada | NÃO APLICÁVEL sem requisito explícito de estorno presencial de assinatura |
| HAUS-013 | Caixa usa dia de recebimento para lançamentos manuais e vendas divididas; 7 registros históricos divergentes sinalizados | PARCIAL; conciliação histórica depende de comprovantes e não foi inventada |
| HAUS-014 | GitHub Actions com permissões mínimas, sintaxe Node e 59 testes de regressão + 7 verificações de contrato | TESTADO E APROVADO no PR |

## C. Agendamento e integridade
- Função `create_booking_request` exige horário dentro do expediente, nunca domingo, usa duração cadastrada, ignora reservas canceladas/expiradas, evita sobreposição de intervalos `[início,fim)`.
- PostgreSQL possui restrição `EXCLUDE USING gist` como segunda defesa transacional, com bloqueio para o mesmo recurso compartilhado.
- A função pública de disponibilidade devolve os blocos de 30 minutos ocupados por atendimentos longos. O JS bloqueia início com qualquer bloco ocupado no intervalo do serviço selecionado.
- **Duração desconhecida:** nenhum serviço tinha `duration_minutes` confirmado. O painel permite informar 30–480 min em passos de 30. Química/estilo sem tempo informado falha de modo seguro. Serviços básicos seguem janela antiga mínima de 30 min, que **não é afirmação de duração real**.
- O horário de 20h é o limite de término para novas solicitações públicas; procedimentos que ultrapassarem não são oferecidos.
- Reserva independente por profissional não foi ativada para não inventar agendas/recursos.

## D. Financeiro e banco
- Funções financeiras originais da produção documentadas em `20261021_omega_financial_rpc_snapshot.sql`.
- `haus_register_manual_parts` agora cria em **uma transação** agendamento, lote e entradas de pagamentos divididos, com idempotência e valores em centavos. Não cria receita futura, não usa dia do atendimento como dia do caixa.
- `admin_register_manual_service` atualizado para a mesma regra de recebimento do dia atual e preservação de data do serviço.
- Contadores financeiros agora incluem venda de combo no relatório sem duplicar uma venda dividida; valores monetários permanecem somas de lançamentos.
- Reembolso bancário automático **não foi criado**; pagamentos da Haus são registrados presencialmente.
- **7 entradas manuais anteriores** têm dia do caixa distinto do dia local de registro. Não reclassificar sem conciliação com comprovantes. Esse número é uma fotografia da consulta, não prova automática de fraude.
- Banco ainda abriga estruturas de outros projetos (por exemplo Luence): nenhuma função externa foi intencionalmente alterada.

## E. Assinaturas e controle de clientes
- Mantidos criação de combo, abatimento de créditos, devolução rastreável, histórico, cancelamento, aba Cancelados, arquivamento e restauração.
- Registro de cliente passou a usar ID estável; WhatsApp é contato compartilhável, não prova inequívoca de pessoa.
- Busca por nome e WhatsApp com paginação real no SQL, contagens globais por estado e navegação por página; a API antiga permanece para compatibilidade.

## F. Segurança
- Funções administrativas controladas com `is_admin()`; RPCs expostas apenas a papéis necessários.
- A configuração de login em aba reduz permanência local, mas não constitui revogação remota.
- O linter Supabase reporta avisos sobre funções `SECURITY DEFINER` públicas (parte necessária para agendamento), privilégios de funções autenticadas e proteção de senha vazada ainda desativada. Eles **não foram declarados falsamente como eliminados**.
- `set_updated_at()` sem `search_path` fixo foi reportado pelo linter; é compartilhado, não alterado automaticamente.
- Verificações de segurança: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## G. Migrações adicionadas e aplicadas ao Supabase
- `20261021_omega_manual_payment_actual_date.sql`
- `20261021_omega_shared_whatsapp_identity.sql`
- `20261021_omega_gallery_archive.sql`
- `20261021_omega_combo_pagination.sql`
- `20261021_omega_booking_interval_schema.sql`
- `20261021_omega_booking_duration_rpcs.sql`
- `20261021_omega_manual_duration_snapshot.sql`
- `20261021_omega_cash_combo_sales_counts.sql`
- `20261021_omega_financial_rpc_snapshot.sql`: baseline de funções reais, **não** migração aplicada separadamente.

As migrações são incrementais para o esquema existente, não substituem backup nem equivalem a um dump autossuficiente do banco.

## H. Código atualizado
- `index.html`, `privacidade.html`, `style.css`, `robots.txt`, `sitemap.xml`: transparência e SEO.
- `script.js`, `haus-public-dynamic.js`: agenda sensível à duração, leitura de tempos cadastrados.
- `admin.html`, `haus-admin-extensions.js`: duração, galeria, exclusão com confirmação e estocagem independente.
- `config.js`: sessão no escopo da aba.
- `admin-combos.html`, `haus-combos.js`, `haus-combos.css`: paginação e foco acessível.
- `.github/workflows/haus-qa.yml` e testes atualizados/adicionados.

## I. Evidências de teste e GitHub
- Workflow GitHub Actions `Haus Barber QA` no PR #17: run **39712998877**, conclusão **success**. [GitHub Actions](https://github.com/Vyzo-Studio/haus_barber/actions/runs/39712998877)
- Testes: **59/59** mais **7/7** verificações repetidas de contratos; sem falhas na última execução.
- O primeiro ciclo encontrou 4 testes desatualizados que foram corrigidos com novos critérios, mantendo as verificações.
- PostgreSQL: migrações validadas com `BEGIN/ROLLBACK` antes de serem aplicadas. Teste de paginação administrativa encontrou um contrato cancelado na primeira página e 0 na segunda.
- Ainda falta teste com navegador autenticado em sessão real, concorrência real simulada em ambiente isolado e análise visual em celular/tablet.

## J. Pendências sem suposições
1. Profissional confirmar durações reais dos serviços (especialmente químicos).
2. Conciliar os 7 lançamentos históricos divergentes contra registros da barbearia.
3. Validar ao vivo fluxo de login, agenda longa, caixa, saldo combo e remoção de fotos **sem criar dados falsos**.
4. Revisar juridicamente política de privacidade e prazo de retenção com responsável comercial.
5. Decidir se agenda por barbeiro e estorno presencial de combos são requisitos reais.
6. Tratar demais avisos de Supabase não específicos da alteração em backlog próprio.

## K. Prontidão operacional
**APTO COM RESSALVAS no escopo verificado**: migrações aplicadas, testes de código passaram e segurança básica preservada. A liberação de horários para serviços de duração desconhecida permanece intencionalmente restrita até configuração real; alterações contábeis históricas não foram feitas. Não confundir automação de regressão com homologação humana completa.
