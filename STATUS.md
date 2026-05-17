# STATUS - EntregGO

## Estado Atual

**Fase:** fundacao/auth-operacao
**Ultima atualizacao:** 2026-05-17
**Atualizado por:** Codex/Camisa10

## Em Andamento

- [ ] Manter dashboards, controle simples de pagamento externo, documentos, historico admin, realtime, push, cron e cancelamento como escopo futuro ate validacao de Security/Performance.

## Proximas Tarefas

- [ ] Rodar validadores de seguranca antes de auth sensivel novo, uploads, policies RLS finais, push, cancelamento, detalhe unico do historico ou dados pessoais novos do motoboy.
- [ ] Rodar validadores de performance antes de cron, queries de dashboard, realtime, push e polling/listas grandes.
- [ ] Especificar controle administrativo de pagamento externo: `GET /api/admin/payments` e `PATCH /api/admin/payments/:id/mark-paid`, sem gateway/checkout/PIX/cartao, com auditoria simples de quem marcou.
- [ ] Especificar pipeline de Storage com signed URLs somente com Security Validator por LGPD/PII.
- [ ] Planejar detalhe unico do historico do motoboy somente com contrato backend novo e validadores.

## Concluido

- [x] Documentacao funcional lida.
- [x] Documentacao tecnica lida.
- [x] Agentes Camisa10, CrossStackArchitect, Cetico, ImpactValidator e PromptRefiner lidos.
- [x] Spec inicial preparada.
- [x] Plano de estruturacao pre-dependencias documentado.
- [x] M-00A executado: governanca minima, estrutura de pastas, `.env.example`, README, STRUCTURE e CONTRACTS nos dois repositorios.
- [x] Fundacao tecnica do backend criada com Express, TypeScript, healthcheck, scripts e testes.
- [x] Fundacao tecnica do frontend criada com Next.js, TypeScript, Tailwind, App Router minimo e scripts.
- [x] Auditoria do frontend reduzida: dependencia PWA ociosa removida e vulnerabilidade transitiva de lint corrigida via override restrito.
- [x] M-01 criado: migration inicial Supabase com enums, tabelas, constraints, indices e RLS base conservadora.
- [x] M-01 aplicada no banco Supabase, conforme confirmacao manual do usuario em 2026-05-14.
- [x] Smoke remoto M-01 por catalogo SQL aprovado: enums, tabelas, RLS, policies, indices, constraints e grants verificados.
- [x] Smoke REST M-01 aprovado para service role e anon: service role acessa tabelas esperadas; anon recebe negacao.
- [x] M-02A implementado no backend: Supabase service role server-side, auth middleware, guards de role/status, cadastro loja/motoboy e rotas admin de aprovacao/bloqueio.
- [x] Testes M-02A criados com mocks do Supabase sem tocar banco real.
- [x] M-02B frontend implementado sem mudanca de contrato backend; smoke anon read-only confirmou negacao em tabelas de dominio.
- [x] Rotacao da service role anteriormente exposta confirmada pelo operador em 2026-05-14, sem valores sensiveis colados.
- [x] Script seguro `scripts/smoke-auth-rls.mjs` criado com dados ficticios e limpeza em `finally`.
- [x] Smoke real parcial executado: API backend validou `/api/auth/me`, negacao admin para usuario `pendente`, `logista` e `motoboy`, listagem admin paginada e exigencia de admin ativo para `approve/block/unblock`.
- [x] Smoke Auth/RLS real aprovado apos corrigir chaves Supabase modernas: backend com secret key `sb_secret_...`, frontend com publishable key `sb_publishable_...`, dados ficticios criados e limpeza concluida.
- [x] M-02C especificado: identidade visual do frontend documentada em `design.md` e landing `/` criada como ponto inicial de cadastro/login.
- [x] M-03 admin minimo no frontend validado contra backend M-02A: listagem paginada e aprovar/bloquear/desbloquear por API.
- [x] F7 Track A enxuta no frontend documentada: paginas admin segmentadas por preset, drawer estrutural de usuario e placeholders honestos para endpoints ausentes.
- [x] Track B backend inicial implementada: `GET /api/admin/users/:id` retorna usuario e perfil administrativo sanitizado sem campos de Storage/documentos.
- [x] Frontend admin integrado ao `GET /api/admin/users/:id`, exibindo perfil expandido sanitizado no drawer sem liberar documentos/pagamentos.
- [x] Backend `GET /api/admin/insights` disponivel com agregados minimos sem PII, e frontend `/admin/insights` integrado ao contrato real sem mocks.
- [x] Smoke pos-deploy final de `/admin/insights` aprovado em producao: frontend `93d0175` e backend `b34f30d`, chamada autenticada retornando `200` e UI renderizando dados reais do contrato.
- [x] Favicon de producao corrigido no frontend `587af96`, removendo o `404` estatico observado no smoke.
- [x] Fechamento local da migracao frontend para Next.js `15.5.18`/React `19.2.6` validado sem mudanca funcional no backend.
- [x] M-04A implementado localmente no backend: `POST /api/deliveries` para loja ativa, testes de autorizacao/validacao e migration de hardening RLS para `delivery_requests`.
- [x] M-04A validado pos-migration no Supabase alvo: smoke Auth/RLS real confirmou criacao de entrega por `logista` ativo, negacoes por role/status, RLS de `delivery_requests` e cleanup completo.
- [x] M-04C implementado localmente: `destinationAddress` opcional no contrato de criacao de entrega, migration nullable para `delivery_requests.destination_address`, payload restrito e docs cross-stack atualizadas.
- [x] M-04C validado pos-migration no Supabase alvo: SQL aplicado com sucesso e smoke Auth/RLS real confirmou criacao sem endereco com `destination_address=null`, negacoes por role/status, payload derivado rejeitado e cleanup completo.
- [x] M-04C validada pos-deploy em producao: smoke publico confirmou `401 AUTH_REQUIRED` sem token, frontend `/loja/nova-entrega` `200` e bundle com payload minimo; smoke autenticado criou entrega com payload `{}`, `destination_address=null`, `status=aguardando`, `courier_id=null` e cleanup completo, sem SQL adicional nem exposicao de secrets.
- [x] M-05 implementado localmente no backend: `GET /api/deliveries` lista entregas somente da loja autenticada com `store_id` derivado da sessao, schema strict de query (`page`/`limit<=50`/`status`), ordem `created_at desc`, resposta sem `store_id`/`courier_id`, sem migration/RLS; `typecheck`, `test` (49), `lint`, `build` e `git diff --check` passaram.
- [x] M-05 validada pos-deploy em producao: backend `f30bfc7` e frontend `6833695` publicados; smoke publico confirmou `GET`/`POST /api/deliveries` sem token com `401 AUTH_REQUIRED` e `/loja/historico` com `200`; smoke autenticado contra `https://entreggoback.vercel.app` validou listagem da propria loja, isolamento multi-tenant, filtro `status=aceita`, paginacao, validacoes negativas, ausencia de `store_id`/`courier_id` e cleanup completo, sem SQL/migration/RLS/grants/policies nem exposicao de secrets.
- [x] Cirurgico admin: `GET /api/admin/users` passou a retornar `store_name` por item via embed 1:1 (`stores.user_id` unico), preenchido so para `logista`, sem N+1, sem campos de Storage/PII novos; frontend `AdminUsersPanel` ganhou a coluna `Loja`. Gates ImpactValidator + PerformanceValidator aprovados; `typecheck`, `test` (52), `lint`, `build` e `git diff --check` passaram nos dois repos. Publicado em producao (backend `946d84d`, frontend `506c740`); smoke publico confirmou servico no ar e bundle com `store_name`; verificacao autenticada do valor fica no gate de credencial da M-05.
- [x] Fatia 1 do ciclo de aceite do motoboy implementada localmente no backend: `GET /api/deliveries/available` e `POST /api/deliveries/:id/accept` com guards de motoboy ativo/online, filtro server-side via service role, embed `stores(name,address)` sem N+1, aceite atomico/idempotente e logs JSON sem PII. Frontend atualizado somente em contrato/docs, sem UI real. Gates ImpactValidator + SecurityValidator + PerformanceValidator aprovados; backend `typecheck`, `test` (65), `lint` e `build` passaram; frontend `typecheck`, `lint`, `build` e `npm test --if-present` passaram.
- [x] Fatia 1 motoboy validada pos-deploy em producao: backend `f5ab8d8` e frontend `7db7fad` publicados; smoke publico confirmou `GET /api/deliveries/available` e `POST /api/deliveries/:id/accept` sem token com `401 AUTH_REQUIRED`, `/motoboy` com `200` e bundle contendo `/api/deliveries/available`; smoke autenticado validou listagem sem PII alem de `store.name`/`store.address`, aceite atomico com `ALREADY_ACCEPTED`, expirado com `DELIVERY_EXPIRED`, negacoes de offline/pendente/bloqueado/role errado e cleanup completo.
- [x] Fatia 2 do motoboy implementada localmente: `GET /api/deliveries/active` retorna a corrida `aceita` do courier autenticado em modo somente leitura, com `destination_address`/`notes` apenas pos-aceite, sem `store_id`/`courier_id`/Storage/campos de transicao, sem mutation e sem SQL/migration/RLS/grants/policies. Frontend correspondente consulta corrida ativa antes da fila e apos aceite. Gates ImpactValidator + SecurityValidator + PerformanceValidator aprovados; backend `test` (73) e `typecheck` passaram durante a implementacao.
- [x] Fatia 2 motoboy validada pos-deploy em producao: backend `af4d0df` e frontend `53a8e72` publicados; smoke publico confirmou `GET /api/deliveries/active` sem token com `401 AUTH_REQUIRED`, `/motoboy` com `200` e bundle contendo `/api/deliveries/active`; smoke autenticado validou que o motoboy ve somente sua corrida `aceita`, outro motoboy recebe `data: null`, offline/pendente/bloqueado/role errado sao negados, PII pre-aceite segue limitada a `store.name`/`store.address`, PII pos-aceite (`destination_address`/`notes`) aparece apenas para o courier atribuido e cleanup completo.
- [x] Fatia 3 motoboy implementada localmente: `GET /api/couriers/me/status` e `PATCH /api/couriers/me/status` permitem ao motoboy ativo consultar/alterar seu proprio `is_online`, sempre derivando `couriers.user_id` da sessao e retornando somente `{ is_online, updated_at }`. Sem `courier_id` no client, sem PII nova, sem SQL/migration/RLS/grants/policies. Gates ImpactValidator + SecurityValidator aprovados; backend `typecheck` e `test` (85) passaram durante a implementacao.
- [x] Fatia 3 motoboy validada pos-deploy em producao: backend `001a1c6` e frontend `3201d77` publicados. Smoke publico confirmou `GET` e `PATCH /api/couriers/me/status` sem token com `401 AUTH_REQUIRED`, `/motoboy` com `200` e bundle contendo `/api/couriers/me/status`. Smoke autenticado com dados ficticios temporarios confirmou motoboy ativo iniciando `is_online=false`, resposta de status somente `{ is_online, updated_at }`, `/api/deliveries/active` negado offline com `COURIER_OFFLINE`, `PATCH true/false`, active online com fixture aceita, payloads proibidos com `VALIDATION_ERROR`, role errada/pendente/bloqueado negados, UI sem chamada a `/active` ou `/available` antes de ficar online e cleanup completo.
- [x] Fatia 4A motoboy implementada localmente: `PATCH /api/deliveries/:id/status` permite transicoes `aceita -> coletada -> em_transito -> entregue` para o courier atribuido, com `courier_id` derivado da sessao, body strict, update condicional por status anterior, idempotencia para retry do mesmo status, logs sem PII e resposta sanitizada sem `store_id`/`courier_id`. `GET /api/deliveries/active` passou a considerar `aceita|coletada|em_transito` e excluir `entregue`. Sem SQL/migration/RLS/grants/policies, sem realtime/push/cron/cancelamento. Gates ImpactValidator, SecurityValidator, PerformanceValidator e TestEngineer aprovados antes da implementacao; backend `typecheck`, `test` (107), `lint`, `build` e `git diff --check` passaram.
- [x] Fatia 4A motoboy validada pos-deploy em producao: backend `a84df437cb30b62c592454fe22b25b173fce9f83` e frontend `b9239dcce3ac25535990d148f8f2480df1bcb232` publicados. Smoke publico confirmou `GET /api/health` -> `200`, `GET /api/deliveries/active` sem token -> `401 AUTH_REQUIRED`, `PATCH /api/deliveries/:id/status` sem token -> `401 AUTH_REQUIRED` e `/motoboy` -> `200`. Smoke API autenticado validou transicoes, idempotencia, isolamento de outro courier, payload strict, sanitizacao e remocao de `entregue` do `/active`; smoke UI autenticado com Playwright validou login real, botoes `Confirmar coleta`/`Iniciar transito`/`Concluir entrega`, timestamps no banco, remocao da corrida ativa e cleanup completo.
- [x] Planejamento de pagamentos ajustado em 2026-05-17: nao havera pagamento integrado na plataforma; o escopo correto e apenas confirmacao administrativa simples de pagamento externo para logistas/motoboys, usando a tabela `payments` como controle interno.
- [x] M-06 Core Flow implementado e validado localmente no backend: `GET /api/deliveries/:id` para `logista` ativo, com `store_id` derivado da sessao, query vazia strict, filtro server-side por `id` + `store_id`, `DELIVERY_NOT_FOUND` para inexistente/outra loja e resposta sanitizada sem `store_id`, `courier_id`, PII de motoboy, documentos, Storage, tokens ou headers. Sem SQL/migration/RLS/grants/policies, sem realtime/push/polling/cancelamento/cron. Backend `typecheck`, `test` (133), `lint`, `build`, `git diff --check`, `node --check scripts/smoke-auth-rls.mjs` e smoke autenticado local M-06 passaram com cleanup completo.
- [x] M-06 validada pos-deploy em producao: backend `27987f0b54b6747c6dac5a9f5134f4f2c80d8b3e` e frontend `20ab39710367bfcb9565246daef292f275e3c370` publicados com Vercel `success`; smoke publico confirmou `GET /api/health` -> `200`, `GET /api/deliveries/:id` sem token -> `401 AUTH_REQUIRED` e `/loja/entregas/<uuid>` -> `200`; smoke autenticado validou loja criando entrega ficticia, motoboy aceitando e avancando para `em_transito`, loja dona abrindo detalhe com timeline real e resposta sanitizada, outra loja recebendo `DELIVERY_NOT_FOUND`, query proibida/UUID invalido com `VALIDATION_ERROR` e cleanup completo.
- [x] Hardening pos-M-06 implementado localmente: `POST /api/deliveries` agora retorna o shape sanitizado da loja sem `store_id`/`courier_id`, `POST /api/deliveries/:id/accept` deixou de expor `courier_id` ao client, e logs JSON de aceite/status mantem `delivery_id`, evento, resultado e transicoes sem `courier_id`, PII, tokens, headers ou payload. Sem SQL/migration/RLS/grants/policies e sem alterar realtime/push/polling/cancelamento/cron.
- [x] Hardening pos-M-06 validado pos-deploy em producao: backend funcional `ad5ded4` e frontend funcional `8771b9b` publicados com Vercel `success`; smoke publico confirmou `/api/health` `200`, rotas de entrega protegidas com `401` sem token e `/loja/entregas/<uuid>` `200`; smoke autenticado criou entrega sem `store_id`/`courier_id` na resposta, abriu a UI de detalhe, aceitou sem `courier_id`, avancou status, confirmou detalhe sanitizado e cleanup completo.
- [x] M-06.1 auditada localmente: backend ja retornava o contrato correto para o motoboy (`store.name`/`store.address` pre-aceite e tambem pos-aceite, com `destination_address`/`notes` apenas em corrida ativa/status do courier atribuido); logs de aceite/status seguem sem PII, payload, header ou token. A unica correcao runtime ficou no frontend, normalizando observacoes em branco antes de renderizar. Sem SQL/migration/RLS/grants/policies e sem realtime/push/polling/cron/cancelamento.
- [x] M-06.1 publicada em `origin/main`: backend `3c168b5` e frontend `5005d84` enviados; smoke publico confirmou `/api/health` `200`, `/api/deliveries/active`, `/api/deliveries/available` e `/api/deliveries/:id/accept` sem token com `401`, e frontend `/motoboy` com `200`. Checks GitHub/Vercel nao foram lidos via `gh` porque o CLI local retornou `401 Unauthorized`; smoke autenticado nao foi executado por falta de credencial segura no contexto.
- [x] Fechamento operacional M-06.1 validado em producao: backend final `5ea06bc` e frontend final `038eb2b` confirmados em `origin/main`; smoke publico repetido com sucesso; smoke autenticado API+UI executado com credenciais locais seguras, dados ficticios, sem imprimir tokens/headers/secrets, validando loja cria entrega, motoboy ve fila sem destino/notas, aceita, `/active` e UI `/motoboy` mostram loja/coleta/destino/observacao pos-aceite, sem campos sensiveis, e cleanup completo (`domain_residue=0`, `auth_residue=0`).
- [x] Fatia 4B historico real do motoboy auditada localmente: `GET /api/deliveries/history` ja estava implementado e alinhado ao contrato, com `courier_id` derivado por `couriers.user_id`, sem exigir `is_online`, query strict (`page`, `limit<=50`, `status`) e resposta sanitizada com loja, destino, observacao e timestamps operacionais. Sem codigo funcional novo, sem SQL/migration/RLS/grants/policies e sem realtime/push/polling/cron/cancelamento. Gates ImpactValidator, SecurityValidator e TestEngineer aprovaram; backend `typecheck`, `test` (133), `lint`, `build` e `git diff --check` passaram, assim como a matriz frontend correlata.

## Bloqueios

- Projeto ainda nao possui uploads, push real, realtime real, cron, dashboards complexos, historico admin de entregas, detalhe unico do historico do motoboy ou cancelamento. O aceite REST atomico, a UI real de descoberta/aceite, a leitura pos-aceite, o status online/offline real, as transicoes pos-aceite REST, o detalhe da propria entrega para loja e o historico real paginado do motoboy existem, mas ainda sem realtime/push.
- Frontend ainda possui residual moderado de `npm audit` em `next@15.5.18` via `postcss@8.4.31` interno; sem alto/critico no relatorio local, mas PWA/push real devem aguardar acompanhamento de release/advisory e Security Validator.
- Logo/paleta inicial definida no frontend em `design.md`; refinamentos visuais seguem pendentes para telas internas.
- Credenciais Vercel/VAPID ainda pendentes e nao devem ser hardcoded.
- Abas admin de documentos, entregas, confirmacao de pagamento externo e notas seguem bloqueadas por falta de endpoints backend. Pagamento nao tera gateway nem cobranca integrada; precisa apenas de contrato simples, auditoria de marcacao e paginacao, mas nao e prioridade antes do fluxo principal.
- A visao demo de corrida do motoboy (`CorridaAtiva.tsx`) permanece mock e isolada em `?demo=`; o caminho padrao `/motoboy` usa fila real, leitura real da corrida ativa e transicoes pos-aceite REST. Nao misturar mock/demo com dado real.

## Saude do Projeto

**Build:** passando em backend e frontend
**Lint:** passando em backend e frontend
**Testes:** passando no backend e frontend (inclui Fatia 4B; backend 133 testes, frontend 64 testes)
**Deploy:** frontend e backend publicados em Vercel
**Riscos abertos:** 4
