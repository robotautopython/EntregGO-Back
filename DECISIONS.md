# DECISIONS - EntregGO

## ADR-001 - Frontend e backend separados

**Data:** 2026-05-14
**Status:** aceito

**Contexto:** A documentacao define dois projetos independentes: `entreggo-front` e `entreggo-api`, cada um com repositorio, deploy e variaveis proprias.

**Decisao:** Manter frontend e backend desacoplados. O frontend consome a API por REST/JSON e nao acessa o banco diretamente, exceto Supabase Auth e Supabase Realtime conforme documentado.

**Consequencias:** Deploys independentes, contratos de API precisam ser estaveis, e secrets permanecem somente no backend.

## ADR-002 - Supabase como fundacao de dados/auth/storage/realtime

**Data:** 2026-05-14
**Status:** aceito

**Contexto:** O produto precisa de Auth, PostgreSQL, Storage para documentos/logos e Realtime para solicitacoes.

**Decisao:** Usar Supabase para PostgreSQL, Auth, Storage e Realtime, com RLS e projetos separados para dev/prod.

**Consequencias:** O backend usa service role com cuidado; o frontend usa anon key publica protegida por RLS; policies e migrations viram parte critica da entrega.

## ADR-003 - Estruturar repositorios antes das dependencias

**Data:** 2026-05-14
**Status:** aceito

**Contexto:** O projeto ainda nao possui codigo, manifests, migrations ou testes. Criar dependencias antes de definir fronteiras e estrutura aumentaria o risco de acoplamento entre frontend e backend.

**Decisao:** Executar o M-00A antes dos manifests: criar governanca minima, estruturas de pastas, `.env.example`, README, STRUCTURE e CONTRACTS nos dois repositorios, sem instalar pacotes e sem implementar runtime.

**Consequencias:** O proximo passo de criacao de dependencias parte de uma planta documentada. A validacao tecnica segue documental ate existirem manifests e codigo real.

## ADR-004 - Fundacao runtime minima antes das features

**Data:** 2026-05-14
**Status:** aceito

**Contexto:** A etapa seguinte ao M-00A precisava transformar a planta dos repositorios em projetos instalaveis e validaveis sem antecipar regras de negocio sensiveis.

**Decisao:** Criar runtime minimo: backend Express/TypeScript com apenas healthcheck padronizado e frontend Next.js/Tailwind com App Router placeholder. Auth, uploads, RLS, push, realtime, dashboards e migrations ficam fora desta etapa.

**Consequencias:** Os comandos de qualidade passam a existir e o proximo ciclo pode validar codigo real. Superficies sensiveis continuam bloqueadas ate validacao especializada.

## ADR-005 - Schema de dominio M-01 com RLS fechado por padrao

**Data:** 2026-05-14
**Status:** aceito

**Contexto:** O M-01 precisava criar a fundacao de banco sem implementar auth real, endpoints de cadastro, push, realtime ou dashboard. A documentacao exige Supabase Auth, RLS e separacao front/back, com service role restrita ao backend.

**Decisao:** Criar uma migration inicial versionada em `supabase/migrations`, com `public.users` vinculado a `auth.users` por `auth_id`, sem armazenar `password_hash` no schema de dominio. Todas as tabelas de dominio recebem RLS habilitado; leituras client-side ficam limitadas por policies conservadoras e escritas continuam reservadas ao backend/service role ate o ciclo de auth real.

**Consequencias:** A anon key publica depende de RLS desde a fundacao, `payments` fica sem policy client-side, e as policies de `delivery_requests` ja preparam leitura Realtime futura para motoboys ativos e online. O ciclo de auth/cadastro deve revisar e endurecer/ajustar essas policies antes de qualquer uso real em producao.

## ADR-006 - Auth/cadastro mediado pelo backend

**Data:** 2026-05-14
**Status:** aceito

**Contexto:** O cadastro precisa criar usuario Supabase Auth, usuario de dominio em `public.users` e perfil em `stores` ou `couriers`, preservando service role fora do frontend e mantendo usuarios novos como `pendente` ate aprovacao admin.

**Decisao:** Implementar M-02A no backend: cadastro publico chama a API, o backend usa service role server-side para criar Auth + dominio + perfil, e rotas admin usam Bearer token validado no Supabase Auth mais guards de role `admin` e status `ativo`. Senhas permanecem apenas no Supabase Auth e nao sao gravadas em `public.users`.

**Consequencias:** O frontend continua desacoplado e sem secrets privados. A consistencia entre Auth e dominio depende de compensacao best effort se uma etapa falhar apos a criacao Auth. Validacao RLS com usuario real fica para o ciclo operacional de login/cadastro, porque tokens sinteticos nao validaram como sessao real.

## ADR-007 - Descoberta e aceite do motoboy via service role com filtro server-side

**Data:** 2026-05-16
**Status:** aceito

**Contexto:** A M-04A endureceu RLS para nao expor entregas aguardando diretamente ao client, e a M-05 consolidou o padrao de endpoints backend usando service role com filtros server-side. A Fatia 1 do ciclo de aceite precisa liberar descoberta de entregas disponiveis e aceite atomico/idempotente sem abrir Realtime, push, cron, migration ou novas policies.

**Decisao:** Implementar `GET /api/deliveries/available` e `POST /api/deliveries/:id/accept` somente no backend, com `authenticate -> requireActiveUser -> requireRoles('motoboy')`, resolucao de `couriers` por `user_id`, exigencia de `is_online=true` e consultas service role filtradas explicitamente. A descoberta filtra `status='aguardando'`, `courier_id is null` e `expires_at > now()`, trazendo `stores(name,address)` por embed na mesma query. O aceite usa update condicional atomico e idempotencia por releitura unica quando zero linhas sao afetadas. RLS/grants/policies permanecem fechados e inalterados.

**Consequencias:** Motoboy passa a ter contrato REST minimo para ver apenas `store.name`/`store.address` e aceitar entrega sem receber `destination_address`/`notes`. A concorrencia fica protegida pelo update condicional, mas notificacao em tempo real, push, cron de expiracao, cancelamento, transicoes pos-aceite e UI real continuam em ciclos separados. Como service role ignora RLS, qualquer evolucao futura deste fluxo deve manter filtros server-side explicitos e repetir SecurityValidator/PerformanceValidator quando tocar PII, listas grandes, realtime ou concorrencia.

## ADR-008 - Corrida ativa do motoboy como leitura pos-aceite

**Data:** 2026-05-16
**Status:** aceito

**Contexto:** A Fatia 1 permitiu descobrir e aceitar entregas reais, mas a UI pos-aceite ainda era confirmacao estatica. Expor destino e observacao antes do aceite continuaria ampliando PII entre atores; ao mesmo tempo, o motoboy atribuido precisa ver a corrida aceita sem antecipar transicoes de status.

**Decisao:** Criar `GET /api/deliveries/active` como endpoint somente leitura, protegido pelos mesmos guards do motoboy ativo/online. O backend resolve `couriers.id` pela sessao, filtra `delivery_requests` por `courier_id=<courier.id>` e `status='aceita'`, ordena por `created_at desc`, limita a 1 e retorna `data: null` quando nao houver corrida ativa. O contrato pos-aceite permite `destination_address` e `notes` somente para o motoboy ja atribuido; segue proibido retornar `store_id`, `courier_id`, Storage/documentos, dados de dono da loja e campos de transicao. Sem mutation, SQL, migration, RLS, grant ou policy.

**Consequencias:** A UI pode substituir a confirmacao estatica por uma tela real somente leitura apos o aceite e ao carregar `/motoboy`. Como service role ignora RLS, o filtro por `courier_id` continua sendo obrigatorio no servidor. Transicoes (`coletada`, `em_transito`, `entregue`), cancelamento, realtime, push, cron e historico do motoboy permanecem em ciclos proprios com novos gates.

## ADR-009 - Status operacional do motoboy como contrato proprio

**Data:** 2026-05-16
**Status:** aceito

**Contexto:** O contrato de descoberta/aceite e corrida ativa exige `couriers.is_online=true`, mas novos perfis de motoboy nascem offline por padrao e ainda nao havia rota real para o proprio motoboy alterar esse estado. Isso fazia `/motoboy` depender de ajuste manual no banco ou smoke operacional.

**Decisao:** Criar `GET /api/couriers/me/status` e `PATCH /api/couriers/me/status` como contrato operacional separado de entregas. As rotas usam `authenticate -> requireActiveUser -> requireRoles('motoboy')`, derivam o perfil por `couriers.user_id = domainUser.id`, aceitam no PATCH apenas `{ isOnline: boolean }` e retornam somente `{ is_online, updated_at }`. Nenhum `courier_id` vem do client e nenhuma migration/RLS/grant/policy nova e necessaria.

**Consequencias:** O frontend pode pausar chamadas de corrida/fila quando o motoboy esta offline e ligar o fluxo real sem gambiarra. O status online/offline continua sendo disponibilidade operacional simples; localizacao, raio, realtime, push, historico de presenca e transicoes de entrega seguem em ciclos futuros.

## ADR-010 - Transicoes pos-aceite do motoboy via REST

**Data:** 2026-05-16
**Status:** aceito

**Contexto:** O enum e as colunas de timestamp de `delivery_requests` ja previam `coletada`, `em_transito` e `entregue`, mas o contrato do motoboy parava na corrida `aceita`. A evolucao precisava permitir o avanco operacional sem abrir realtime, push, cron, cancelamento, historico, GPS, migrations ou novas policies.

**Decisao:** Criar `PATCH /api/deliveries/:id/status` com body strict `{ status: 'coletada' | 'em_transito' | 'entregue' }`, protegido por `authenticate -> requireActiveUser -> requireRoles('motoboy')` e `couriers.is_online=true`. O backend deriva `couriers.id` pela sessao, exige entrega atribuida ao proprio courier, valida a maquina `aceita -> coletada -> em_transito -> entregue` e usa update condicional por `id`, `courier_id` e status anterior esperado, setando apenas o timestamp da etapa. Retry do mesmo status e idempotente por releitura curta. `GET /api/deliveries/active` passa a considerar `aceita|coletada|em_transito` e continua excluindo `entregue`.

**Consequencias:** O motoboy consegue avancar a corrida pelo contrato REST minimo, com resposta sanitizada e sem `store_id`/`courier_id`. Como o backend usa service role, filtros server-side seguem obrigatorios. O fluxo ainda nao possui realtime, push, cron, cancelamento, historico, GPS, pagamentos ou Storage; esses temas continuam exigindo ciclos e validadores proprios.
