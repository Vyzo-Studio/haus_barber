# Haus Barber — módulo de combos e fidelização (21/10/2026)

## Objetivo
Permitir que a equipe da Haus venda planos, cadastre clientes com WhatsApp, controle validade de 45 dias e dê baixa nos serviços executados. A identidade e paleta de cores da Haus permanecem intactas.

## Planos — valores conforme a imagem
| Plano | Valor | Créditos |
|---|---:|---|
| 4 Cortes Degradê | R$ 75 | 4 cortes |
| 4 Cortes Degradê + Sobrancelha | R$ 90 | 4 cortes + 4 sobrancelhas |
| 4 Cortes Degradê + Barba | R$ 135 | 4 cortes + 4 barbas |
| 4 Cortes Social | R$ 60 | 4 cortes |
| 4 Cortes Social + Sobrancelha | R$ 75 | 4 cortes + 4 sobrancelhas |
| 4 Cortes Social + Barba | R$ 120 | 4 cortes + 4 barbas |
| 4 Barbas | R$ 60 | 4 barbas |

**Interpretação da arte:** o adicional «+ Sobrancelha» ou «+ Barba» é tratado como um adicional por corte (até 4). A imagem não informa explicitamente o número de adicionais; confirmar essa regra comercial antes de divulgá-la como definitiva. Saldos independentes: uma visita pode consumir corte e adicional juntos ou separados.

## Regras de operação
- 45 dias corridos, começando pela data de contratação (primeiro dia incluído). O último dia de utilização é 44 dias após o início; a data de vencimento registrada é exclusiva.
- Histórico de contratos anteriores, vencidos e concluídos preservado. Renovação gera novo contrato e novo pagamento.
- WhatsApp em tabela de clientes protegida: consultas e alterações somente por funções com autorização administrativa; papéis anônimos sem acesso.
- Cadastro exige nome, WhatsApp com DDD, plano, data de contratação e pagamento integral.
- Pagamento único ou dividido em dinheiro, Pix, débito e crédito, com soma exata do valor do plano. Troco é calculado sobre a parte em dinheiro.
- Venda lançada uma única vez no caixa aberto de **hoje**, com até quatro entradas correspondentes às formas usadas. A utilização não cria receita extra.
- Valor e quantidades congelados no contrato; alterações posteriores em serviços não modificam vendas anteriores.
- Registro de visita: data, horário opcional, barbeiro opcional, corte, barba ou sobrancelha; pode lançar mais de um na mesma operação transacional.
- Sem saldo negativo, serviços fora do plano, data futura ou data fora da validade. Mesma categoria não pode ser lançada duas vezes no mesmo contrato e dia.
- Correção restaura crédito com motivo obrigatório e registro de auditoria; nunca apaga a utilização anterior.
- **Não bloqueia automaticamente a agenda de reservas públicas**: é um controle de serviço prestado. O agendamento existente continua independente.
- Cancelamento financeiro de contrato não foi implementado: um reembolso real precisaria de uma rotina segura específica para os pagamentos divididos. A baixa de serviço não efetua reembolso.

## Arquivos
- admin-combos.html, haus-combos.css e haus-combos.js: gestão privada e responsiva.
- admin.html: entrada PLANOS / COMBOS.
- supabase/migrations/20261021_haus_combos.sql: schema, pagamentos e funções seguras.
- tests/haus-combos.test.cjs: validações estruturais e de fluxos.

## Validação
- Migração testada no Postgres com transação revertida e depois aplicada com sucesso.
- Sete planos confirmados. Nenhum cliente, contrato ou uso fictício criado.
- Acesso anônimo às funções administrativas negado; execução permitida ao papel autenticado com autorização interna de is_admin.
- 10 testes estruturais aprovados e sintaxe do JavaScript validada.
- Avisos de RLS sem políticas nas tabelas novas são intencionais: acesso direto revogado; leituras exclusivamente via RPC autorizada.
- Ainda falta testar um contrato e uma utilização reais com uma conta administrativa; não foram criadas vendas de produção como teste.

## Primeira utilização
1. Abra o caixa do dia no painel principal.
2. Entre em PLANOS / COMBOS.
3. Cadastre o contrato com cliente, WhatsApp, data, plano e pagamento.
4. Clique em BAIXAR para contabilizar os serviços de uma visita.
5. Em DETALHES, veja prazos, saldos e histórico; CORRIGIR exige motivo.
6. RENOVAR gera um contrato novo, preservando o anterior.

## Limites
- Mostra os 700 contratos mais recentes; acima disso deve haver paginação.
- Sem avisos automáticos por WhatsApp.
- Sem integração automática entre combo e reserva pública por barbeiro.
- Métricas legadas de número de vendas podem contar cada componente de pagamento combinado separadamente; valores de faturamento e repartição por método permanecem corretos. Será ideal introduzir KPI específico para contratos vendidos.
