# Haus Barber — Ajuste reversível de utilizações e cancelamento de combos

## Escopo
Atende ao pedido de poder **diminuir ou aumentar o saldo de utilizações** quando ocorrer um lançamento incorreto, e **retirar assinaturas canceladas da lista principal** sem destruir provas de pagamento ou histórico.

### Botões disponíveis em cada serviço
- **− USAR 1**: abre o formulário de visita com aquele serviço pré-selecionado. Depois da confirmação, uma utilização é contabilizada, o saldo diminui em uma unidade e a visita é registrada no histórico.
- **+ DEVOLVER 1**: encontra a utilização mais recente, ainda válida, daquela categoria e solicita uma justificativa. O registro original é marcado como **corrigido**, sem exclusão. O saldo volta uma unidade, mas nunca excede a quantidade contratada.
- **DETALHES**: permite selecionar uma utilização específica do histórico para devolvê-la, caso não seja a mais recente. O histórico identifica as correções, dias e profissionais.

### Cancelamento / retirada da listagem
- A ficha do cliente traz **CANCELAR E ARQUIVAR COMBO**, com motivo obrigatório e aviso antes de confirmar.
- O contrato sai das listas **Todas**, **Ativas**, **A vencer**, **Concluídas** e **Vencidas**, aparecendo somente na aba **Cancelados**.
- No histórico de cancelados, o botão **RESTAURAR COMBO** permite corrigir um cancelamento acidental, com motivo registrado.
- **Não é exclusão permanente de dados pessoais**: o cadastro, histórico de utilização, valores e financeiro permanecem preservados para auditoria. Uma solicitação de exclusão de dados pessoais requer fluxo próprio, observadas retenções legais.

### Regras importantes
- **Cancelamento não gera reembolso**, não devolve dinheiro ao cliente e não remove vendas do caixa. Eventual devolução financeira deve ser tratada por um procedimento de estorno específico, sem alterar as transações silenciosamente.
- A restauração mantém a data original de contratação e os mesmos 45 dias de validade; ela não reinicia nem prorroga o prazo.
- Uma devolução restaura apenas o crédito anteriormente utilizado. Não aumenta a quantidade do plano nem permite saldo negativo ou saldo artificial.
- Registros de uso, devolução, cancelamento e restauração são protegidos por RPC com checagem administrativa e trilha de auditoria.
- O site público, visual da Haus, GNG, preços de serviços, agendamentos existentes e demais módulos do painel não foram alterados.

### Banco e publicação
- Migração: supabase/migrations/20261021_haus_combo_corrections_and_cancellation.sql
- Alterações de interface: admin-combos.html, haus-combos.js, haus-combos.css
- Teste de regressão: tests/haus-combos-adjustments.test.cjs
- Registro anterior preservado: a migração não efetuou alterações nas fichas, utilizações ou movimentos financeiros existentes.
- Verificações: migração passou em transação de teste com rollback, depois aplicada; 19 testes das duas suítes aprovados em execução isolada e sintaxe do JS validada.

### Limitações da validação
Sem teste de clique autenticado com administrador real; sem simular cancelamento/estorno em registros de produção. Os testes verificam estrutura, lógica isolada, segurança declarativa e presença das operações. O primeiro cancelamento real deve ser conferido no painel para confirmar o ciclo completo.
