# HAUS BARBER — VYZO Global Experience V1.0
**Data de implementação:** 22/10/2026. **Repositório:** `Vyzo-Studio/haus_barber`. **PR:** https://github.com/Vyzo-Studio/haus_barber/pull/20.

## 1. Projeto identificado
- Site público da **Haus Barber**, Sol Nascente/DF; GitHub Pages estático.
- HTML/CSS/JavaScript puro, Supabase para agendamentos e catálogo. Área administrativa existente não foi redesenhada nem modificada.
- Identidade visual preservada: azul-marinho **#080d1a**, creme **#f1ede7**, vermelho **#b83a30**, Bebas Neue/Montserrat e logotipo original.
- O agendamento cria pedido temporário de até 30 minutos; confirmação pelo WhatsApp da Haus. Pagamentos não ocorrem no checkout.
- Google Maps incorporado anteriormente carregava pelo iframe sem consentimento; não foram identificados Analytics/Meta Pixel ou mecanismos publicitários.

## 2. Política de Privacidade
`privacidade.html` agora apresenta documento completo em pt-BR, inglês, espanhol, japonês e alemão. Aborda:
- nome, serviço, dia, horário enviados ao banco de reservas;
- telefone público **opcional**, que não é enviado pela RPC de reservas (pode constar em mensagem de WhatsApp iniciada pelo cliente);
- informações de combo/WhatsApp/recebimento registradas pelo painel administrativo;
- hospedagem GitHub Pages, Supabase, Google Fonts e links externos;
- preferências locais, consentimento de mapa, retenção conhecida para navegador e exclusão;
- direitos do titular, canal de atendimento (WhatsApp (61) 99570-5082).
**A validar pelo responsável:** identificação jurídica do controlador, bases legais específicas, períodos administrativos de retenção e revisão formal da LGPD. Não se afirma certificação jurídica.

## 3. Termos de Serviço
`termos.html`, nos mesmos cinco idiomas. Documenta:
- serviços/preços atuais em reais e agendamento sujeito à disponibilidade;
- pedido de horário provisório, não confirmação imediata;
- confirmação via WhatsApp;
- horários online de segunda a sábado;
- venda de planos na barbearia com validade informada de até 45 dias;
- pagamentos presenciais, sem gateway;
- inexistência de regras padronizadas publicadas sobre multa, cancelamento e reembolso;
- uso adequado e contato.
**A validar:** políticas comerciais específicas e identificação legal. Não cria nova política de reembolso.

## 4. Consentimento de cookies e conteúdo externo
Arquivos: `haus-experience.js` e `haus-experience.css`.
- Primeiro acesso sem preferência válida: banner não bloqueante com **ACEITAR TODOS**, **REJEITAR OPCIONAIS** e **PERSONALIZAR**, além de link de política.
- Categorias *Necessários* e *Mapa externo (Google Maps)*; não inventa estatísticas/marketing se não foram instalados.
- O Google Maps embutido só recebe `src` após autorização. A recusa mantém placeholder local. Retirada remove o iframe ativo e impede novas cargas automáticas pelo código da Haus; não pode desfazer processamento já realizado pelo Google antes da retirada.
- O rodapé reabre as preferências. Registro: `localStorage` sob `vyzo:haus_barber:consent:v1`, validade **180 dias**; no vencimento reexibe a decisão.
- Outros links externos são abertos por escolha explícita do visitante. O Google Fonts já fazia parte do design original e continua sendo carregado para tipografia; isso não é disfarçado como conteúdo bloqueado.

## 5. Lembrar meus dados (opt-in independente)
- Campo de telefone **opcional** adicionado ao agendamento público, sem alterar RPC ou tabela de reservas.
- Checkbox desmarcada por padrão: **Lembrar meus dados neste dispositivo**.
- A informação é salva somente **após sucesso da RPC de agendamento e seleção afirmativa do cliente**, apenas nome e telefone, por até **90 dias**.
- Prefill numa visita posterior ao mesmo navegador; ambos continuam editáveis.
- Desmarcar a opção ou clicar **Esquecer meus dados deste dispositivo** remove imediatamente o registro local, sem apagar histórico legítimo de atendimento no banco.
- Falhas ou proibição do armazenamento não impedem agendamento.
- O número informado só é incluído no texto do WhatsApp quando o cliente abre/envia voluntariamente sua mensagem; a RPC pública de reservas não recebe esse campo.

**Ressalva de segurança:** `localStorage` não é criptografado e pertence à origem web, não ao caminho do repositório. Outros projetos do mesmo host `vyzo-studio.github.io` compartilham tecnicamente a mesma origem de armazenamento; a chave usa prefixo exclusivo apenas para evitar colisões. Proteção forte entre projetos exige **origens separadas (domínios/subdomínios próprios)**. Dispositivos e perfis de navegador compartilhados também podem revelar o preenchimento. A interface informa risco de uso compartilhado; não promete isolamento criptográfico.

## 6. Idiomas
`haus-i18n-data.js`, `haus-experience.js`, `haus-legal-data.js`, `haus-legal.js`:
- pt-BR padrão; inglês `en`, espanhol `es`, japonês `ja`, alemão `de`.
- Dicionário central de textos reais do site; não depende de serviços externos de tradução em tempo real.
- Troca imediata e memória da escolha na chave `vyzo:haus_barber:locale:v1`.
- Navegação, cabeçalhos, portfólio, planos, rodapé, agenda, avisos, estados de erro, consentimento, páginas legais e textos de WhatsApp incluídos.
- O calendário atualiza abreviações de dias/meses e data pelo `Intl.DateTimeFormat`; mantém seleção e informações digitadas.
- Preços continuam em **BRL**; nomes comerciais de serviços e nomes próprios são preservados.
- Catálogo e portfólio do Supabase continuam sendo a fonte oficial, sem inventar traduções comerciais.
- A tradução de textos dinâmicos é feita por observação limitada às áreas públicas e dicionário conhecido; valores livres enviados por cliente e nomes próprios nunca são traduzidos automaticamente.

## 7. Responsividade e acessibilidade
- Rodapé organizado com quatro controles e seletor de idioma acessível.
- Modal de preferências com foco/Tab/Escape/retorno ao ativador; banner não bloqueante.
- Controles alcançáveis por teclado; contraste usando a paleta Haus; foco visível.
- Estilos adaptados a texto extenso alemão e caracteres japoneses; respeita preferência `prefers-reduced-motion`.
- Testes Chromium medem rolagem horizontal em **320, 375, 390, 430, 768, 1024, 1366 e 1920 px** para os cinco idiomas, incluindo páginas legais.
- Não afirmar auditoria WCAG 2.2 AA certificada apenas por testes automatizados.

## 8. Arquivos
**Alterados:** `index.html`, `script.js`, `privacidade.html`, `.github/workflows/haus-qa.yml`, testes anteriores que precisavam refletir arquivos dinamicamente localizados.
**Novos:** `termos.html`, `haus-experience.js`, `haus-experience.css`, `haus-i18n-data.js`, `haus-legal-data.js`, `haus-legal.js`, `haus-legal.css`, `tests/haus-global-experience.test.cjs`, `tests/haus-global-experience.browser.test.cjs`.
**Sem alterações de banco, caixa, combos, Painel Admin ou repositórios externos.**

## 9. Validação
- Testes Node: consistência de locales, arquivos, ausência de mapa antes de consentimento, fluxo de gravação após sucesso e preservação de dados.
- Chromium: primeira visita e recusa; persistência/reabertura; autorização e revogação do mapa; opt-in e exclusão local; troca dos cinco idiomas; privacidade/termos localizados; viewport 320–1920; agendamento com RPC Supabase simulada **em navegador isolado**.
- Agendamentos reais não foram criados no banco de produção.
- A confirmação em produção deve se basear no sucesso dos workflows GitHub Actions (PR e, após merge, branch `main`); não confundir teste local com publicação no Pages.
