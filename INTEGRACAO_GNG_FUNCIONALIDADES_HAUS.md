# Haus Barber — gestão inspirada nas funções da GNG (2026-10)

## Diretrizes preservadas
- Identidade visual, logotipo, paleta azul-marinho/vermelho/marfim, navegação e experiência pública da **Haus** foram mantidos.
- A GNG é referência **funcional**, não template visual. **Nenhum editor de cores, tema ou fontes** foi adicionado.
- Não houve mudança no código da GNG, nem exclusão ou edição de dados históricos de clientes.

## Recursos integrados
1. **Pagamentos:** recebimento em dinheiro, Pix, débito ou crédito; modo combinado com soma validada em centavos e troco calculado sobre a parcela em dinheiro. O total contabilizado é o preço do serviço, não o dinheiro entregue. Compatível com finalização de reservas e lançamentos manuais.
2. **Serviços:** painel para adicionar, alterar nome, categoria, ordem, preço ou ocultar serviço. Catálogo online e preços passam a consultar `haus_services`; valores históricos já pagos permanecem inalterados.
3. **Equipe:** painel com nome, ordem e estado ativo/inativo; profissional opcional na inclusão manual. **A agenda online ainda é global, não uma agenda de horários independentes por barbeiro.**
4. **Fotos:** listar, adicionar JPEG/PNG/WebP (até 5 MiB) ao bucket `haus-gallery`, editar título, ocultar, exibir e retirar da listagem. Retirar o cadastro mantém o arquivo físico como segurança. Site lê as 35 fotos já cadastradas e novos uploads via `haus_gallery`.
5. **Relatórios:** o banco contabiliza um atendimento apenas uma vez nas contagens agregadas, mesmo com várias parcelas; cada parcela conserva método e valor no livro-caixa. Estorno financeiro usa `haus_refund_payment`, com valor por parcela.

## Infraestrutura e segurança
- Foi reutilizado o **esquema real já existente** no Supabase Haus, projeto `pmhpgrdeknzbvegkrnxi`, sem criar tabelas ou duplicar migrações incompatíveis.
- Tabelas: `haus_services`, `haus_barbers`, `haus_gallery`, `haus_payment_batches`, `bookings`, `cash_entries`.
- RPCs existentes: `haus_register_payment_parts`, `haus_register_manual_parts`, `haus_refund_payment`, `service_price_cents`. As RPCs financeiras negam EXECUTE ao usuário anônimo e verificam `public.is_admin()`.
- RLS restringe inserção/edição à administração; somente serviços/fotos ativos são públicos.
- A precificação e disponibilidade são validadas no servidor. Quando o preço atual não puder ser consultado, o formulário online não aceita solicitações usando preços antigos.
- Credenciais secretas jamais ficam no JavaScript público; permanece apenas chave publishable.

## Verificações executadas
- `node --check`: scripts públicos e administrativos válidos.
- 11 regressões públicas anteriores aprovadas; 5 testes adicionais de estrutura e preservação de identidade aprovados.
- Navegação dos módulos: 320, 360, 390, 768 e 1440 px sem rolagem horizontal.
- Pagamento combinado R$ 10 em dinheiro + R$ 15 em Pix = R$ 25, com R$ 20 entregues e R$ 10 de troco; soma incorreta e dinheiro insuficiente bloqueados.
- 12 serviços e 35 fotos existentes identificados no banco. Não foram criados pagamentos reais para testar.
- A checagem de segurança do Supabase também revelou recomendações **anteriores e fora deste escopo**, especialmente funções SECURITY DEFINER e tabelas Luence sem políticas. Não alterar outros projetos aqui.

## Ainda exige validação prática
1. Entrar como administrador em `/admin.html` e cadastrar um serviço de teste controlado, restaurando-o depois.
2. Registrar **um pagamento real autorizado** em caixa aberto, conferir o extrato e testar estorno (sem efetuar transações bancárias automáticas).
3. Selecionar um barbeiro em um lançamento manual e verificar relatório conforme necessidade.
4. Subir uma imagem original e conferir o portfólio no celular e desktop.
5. Agendamento online de vários barbeiros com disponibilidade independente precisará de nova etapa específica com prevenção de conflitos por duração/profissional.
