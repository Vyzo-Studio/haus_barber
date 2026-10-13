# Haus Barber — Experiência e informações (outubro de 2026)

## Proposta

Evolução própria da Haus, inspirada no cuidado de usabilidade da GNG sem copiar seu layout. Mantidos logo, fotografias, tipografia, cores, catálogo avulso, sistema de login e administração.

## Recursos adicionados

- Seção **Combos Haus** independente da agenda avulsa, com as sete ofertas enviadas na imagem: Degradê (R$ 75/90/135), Social (R$ 60/75/120) e Barba (R$ 60). Validade de até 45 dias após a assinatura. Contratação consultada por DM do Instagram.
- Área de localização com prévia incorporada do Google Maps e botão para traçar rota no ponto `-15.8246584,-48.1270409`, fornecido pelo proprietário. Atualizado também o link do cartão de endereço. O endereço textual existente foi preservado, pois não foi validado contra as coordenadas.
- Navegação rápida no celular em estilo Haus (Combos, Agendar e Rota), com adaptação a safe area e ocultação durante a digitação no formulário.
- Orientações simples de etapas de agendamento, sem copiar a estrutura da GNG.

## Correções de agenda aplicadas no cliente

- No sábado, a agenda mantém os dias úteis da semana atual; no domingo, avança para segunda.
- Antes de consultar a disponibilidade, e após falhas ou respostas inválidas, os horários ficam indisponíveis. A atualização bem-sucedida reabilita o envio.
- A virada de semana é verificada nas atualizações periódicas.
- Impede segundo envio do mesmo formulário enquanto a reserva está sendo criada.
- Se o WhatsApp não abrir automaticamente, o cliente continua com o aviso de registro e um link para abrir a conversa manualmente.

## Testes

Execute `node --check script.js` e `node --test tests/haus-public.test.cjs`. Os testes cobrem ofertas, coordenadas, sábado/domingo e falha/recuperação de disponibilidade.

## Importante antes de integrar à main

- O Supabase foi **consultado somente em leitura** e **não foi alterado**. O banco atualmente bloqueia o mesmo início de horário, mas não valida interseção de horários baseada em duração. Esse risco demanda projeto e correção próprios na função SQL e testes com reservas reais.
- Os combos são apenas informativos; não estão cadastrados como produtos/assinaturas no banco. **Não cadastrar como serviços avulsos** sem regras próprias para controlar utilizações e vencimento.
- Testes visuais em navegadores reais, confirmação do pin no Maps e agendamento completo com Supabase devem ocorrer antes do merge.
- Os links apontam para Google Maps e Instagram; não há imagem do flyer incluída nos arquivos.
