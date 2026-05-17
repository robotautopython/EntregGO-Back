# PROJECT - EntregGO

## Visao

**Objetivo:** Plataforma web de intermediacao de entregas sob demanda entre lojas e motoboys.
**Publico-alvo:** Administradores da operacao, lojas/logistas e motoboys.
**Resultado esperado:** Lojas solicitam entregas, motoboys ativos e online recebem notificacoes, o primeiro aceite assume a corrida, e o admin governa cadastros, bloqueios, confirmacao simples de pagamento externo e insights.

## Arquitetura

**Frontend:** Next.js 14+ App Router, React, TypeScript, Tailwind CSS, shadcn/ui, PWA/Service Worker.
**Backend:** Node.js 20+ LTS, Express, TypeScript, API REST JSON, Vercel serverless.
**Banco:** Supabase PostgreSQL com Auth, Storage, Realtime e RLS.
**Hospedagem:** Vercel em dois projetos separados: frontend e backend.
**Integracoes:** Supabase Auth, Supabase Storage, Supabase Realtime, Web Push API/VAPID.

## Fronteiras

- Frontend: UI, landing page, paineis, Supabase Auth no client, Realtime para painel do motoboy, PWA e consumo da API REST.
- Backend: regras de negocio, autorizacao, validacao server-side, uploads, envio de push, jobs de expiracao e acesso com service role ao Supabase.
- Banco: integridade, enums, constraints, indices, RLS e dados persistentes.
- Workers/jobs: expiracao de entregas aguardando aceite apos 1 minuto.
- Terceiros: Supabase, Vercel, Web Push/VAPID.

## Fluxos Criticos

- [ ] Auth e sessao
- [ ] Cadastro/onboarding de lojas e motoboys
- [ ] Aprovacao/bloqueio de usuarios pelo admin
- [ ] Solicitacao de entrega pela loja
- [ ] Notificacao e aceite por motoboy
- [ ] Atualizacao de status da corrida
- [ ] Confirmacao administrativa de pagamento externo
- [ ] Deploy e rollback front/back separados

## Regras de Producao

- Idempotencia: aceite de entrega deve usar update condicional/transacao; push subscription deve deduplicar por endpoint.
- Deduplicacao: primeira aceitacao vence; demais recebem conflito `ALREADY_ACCEPTED`.
- Rate limit: API geral e auth/register devem ter limites separados.
- Paginacao: todas as listas administrativas, historicos e insights devem paginar ou limitar payload.
- Observabilidade: logs estruturados sem PII/secrets; erros com codigo padronizado.
- Backups/migrations: migrations versionadas, aditivas quando possivel e com rollback definido.
- Pagamento externo: a plataforma nao processa cobranca, PIX, checkout, gateway, cartao ou repasse. O admin apenas registra se o logista/motoboy pagou fora da plataforma, com data e responsavel pela marcacao.
