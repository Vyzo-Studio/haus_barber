# HAUS BARBER — Pendências de 22/10/2026: implementação e evidências

Fonte: relatório enviado pelo responsável, referência `dbf0c60`. Projeto: `Vyzo-Studio/haus_barber`. Supabase: `pmhpgrdeknzbvegkrnxi`.

## Recuperação
Criadas antes das mudanças as branches `backup/haus-before-pendencias-2026-10-22` (snapshot de código) e `fix/haus-pendencias-2026-10-22` (alterações).
**Importante:** branch Git NÃO substitui backup do banco. Nenhum dado histórico foi apagado nem reclassificado. GNG e tabelas Luence não foram alteradas.

## Alterações implementadas nesta rodada

**3 — Proteção de solicitações repetidas (medida parcial e verificável)**
- Migração `20261022_haus_rate_cleanup_readonly.sql`: tabela privada `haus_security.booking_rate_bucket`, chaves HMAC com segredo aleatório privado, sem guardar nome/IP em texto.
- RPC `create_booking_request` aplica contagem transacional: no máximo 3 pedidos por mesmo nome/data em 15 minutos e 10 por endereço de origem quando um cabeçalho proxy estiver disponível.
- **Limitação de segurança:** cabeçalhos de origem podem ser falsificados; nomes podem variar. É uma camada preventiva, não um bloqueio à prova de bots. Integração com verificação anti-bot no proxy/Edge Function com credenciais de fornecedor não foi ativada.

**6 — Consulta de disponibilidade somente leitura**
- `get_public_booked_slots` não faz mais UPDATE; ignora pendências expiradas na seleção.
- Cron `haus-barber-expire-reservations` executa `haus_expire_pending_bookings()` a cada minuto para liberar a restrição GiST das reservas vencidas. Cron já estava instalado para controles de caixa.
- A expiração pode demorar até cerca de um minuto após o fim do TTL. Reservas ativas mantêm a proteção de intervalos.

**2 — Conciliação histórica sem invenções**
- Migração `20261022_haus_cash_reconciliation_audit.sql`: consulta administrativa dos casos em que a data local do registro difere do dia do caixa, e eventos de auditoria **append-only** com status e justificativa.
- Interface privada `admin-reconciliation.html` / `haus-reconciliation.js`, com botão no painel principal. Permite anexar justificativa textual, mas **não** edita caixa, pagamentos nem datas.
- Consulta em banco confirmou **7 lançamentos** e **0 revisões gravadas** inicialmente. Não foi possível comparar com comprovantes reais nesta execução; a conciliação final depende dessa documentação.

**5 — Permissões e rotinas**
- Auditoria das funções administrativas SECURITY DEFINER da Haus encontrou checagens textuais explícitas `public.is_admin()` em todas as funções administrativas relacionadas, sem substituir homologação negativa sob papéis reais.
- A função compartilhada `set_updated_at()` foi endurecida apenas com `search_path=''` após verificar que ela só usa `now()` e não acessa tabelas externas; sem trocar o corpo do gatilho.
- Tabelas auxiliares protegidas em schema privado, execução negada a anon/auth diretamente.
- Os 6 avisos de execução anônima incluem RPCs públicas intencionais de reservas e serviços compartilhados com Luence; **não** se devem revogar indiscriminadamente. Proteção contra senhas vazadas é configuração de Auth do projeto e permanece a verificar/ativar no painel Supabase.

**9 — Índices duplicados**
- Comparados os dois índices de `public.haus_combo_customers(whatsapp_digits)`: removido somente `haus_combo_customers_phone_lookup` redundante, preservado `haus_combo_customers_phone_idx`. Nenhuma linha de clientes removida.
- Outros 11 índices ausentes em FK e 17 índices relatados como não usados requerem análise de padrões de consulta antes de reindexação, sem exclusões especulativas.

**10 / 11 / 12 — Navegador real e testes**
- Nova suíte `tests/haus-browser-smoke.test.cjs` executa Chromium em três larguras (390/768/1440 px) sobre site, admin, combos, conciliação e privacidade.
- Só verifica páginas e formulários visíveis **sem login**, detecta erros JS e rolagem horizontal, arquiva capturas de áreas públicas por sete dias no GitHub Actions.
- `tests/haus-pendencias.test.cjs` valida contratos SQL, segurança e preservação dos dados.
- Não são testes autenticados de caixa/agenda/combos: estes exigem ambiente de teste isolado, contas dedicadas e fixtures seguras.

## Pendências que não podem ser declaradas resolvidas sem evidência

| Item | Situação e próximo passo |
|---|---|
| 1. Duração dos 14 serviços | **Pendente**: 14 ativos ainda sem minutos reais. Campo de cadastro existe e cálculo por intervalo foi implementado anteriormente. Configurar após confirmação do responsável; não inventar 30/60/90 min. |
| 2. Sete divergências financeiras | **Em análise assistida**: ferramenta administrativa criada; precisa comparar comprovantes antes de eventual ajuste rastreável. |
| 3. Agendamento abusivo | **Parcial**: rate limit no banco; proteção confiável por IP/CAPTCHA necessita infraestrutura capaz de verificar origem e desafios. |
| 4. Homologação do painel | **Pendente**: não foram realizadas cobranças/estornos, logins administrativos reais nem fluxos autenticados artificiais em produção. |
| 5. Supabase | **Parcial**: guardas de administração revisadas e função de gatilho endurecida; controle Auth (leaked password) e revisão profunda de permissões externas pendem. |
| 6. Consulta sem UPDATE | **Implementado**, cron ativo e funções conferidas via SQL. |
| 7. Combos | **Parcial**: testes estruturais existentes continuam, mas faltam testes transacionais E2E de alta concorrência com fixtures isoladas. |
| 8. Pagamentos e caixa | **Parcial**: sem alterações monetárias nesta rodada; ensaios completos autenticados precisam ambiente isolado. |
| 9. Índices | **Parcial**: duplicação comprovada removida; demais FKs/índices só serão tocados após plano de consulta. |
| 10. Responsividade | **Teste automatizado de entrada** em Chromium; conferência visual humana de todos os módulos logados continua pendente. |
| 11. Performance/WCAG | **Pendente de métricas Lighthouse/Core Web Vitals e revisão aprofundada**. |
| 12. Testes | **Ampliados** para smoke público em Chromium; não confundir com cobertura 100% autenticada. |

## Segurança e observações de produção
- Sem exclusão de clientes, fotos, assinaturas, histórico e dinheiro.
- Combos cancelados continuam consultáveis, e estorno financeiro não decorre automaticamente de cancelamento.
- Todos os pagamentos seguem exclusivamente presenciais: **nenhum checkout, Pix automático, gateway ou reembolso bancário**.
- O bucket HMAC armazena contagens temporárias; o cron remove buckets com mais de um dia.
- A chave aleatória HMAC permanece somente no schema interno; nenhuma chave secreta foi escrita no repositório.

## Testes e publicação
Após cada alteração relevante, os testes devem executar na PR e novamente em `main`. A publicação só é considerada **automatizadamente aprovada** com GitHub Actions verde. Mesmo assim, homologação humana e configuração de durações são etapas separadas.
