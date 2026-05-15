# LOG - EntregGO

## Como Ler

Registro cronologico de ciclos significativos. Fatos ficam aqui; decisoes vao em DECISIONS; aprendizados vao em LEARNINGS.

## 2026-05-14 - INICIO DO PROJETO

**Fase:** concepcao/fundacao
**O que aconteceu:** Documentacoes funcional e tecnica foram lidas; agentes principais foram analisados; projeto identificado como dois repositorios independentes sem codigo inicial ainda.
**Agentes utilizados:** Camisa10, CrossStackArchitect, Cetico, ImpactValidator, PromptRefiner
**Status:** aberto

## 2026-05-14 - PLANO PRE-DEPENDENCIAS

**Fase:** fundacao
**O que aconteceu:** Definido que o proximo passo natural antes de instalar dependencias e executar M-00A: estruturar governanca, pastas, env examples e contratos minimos dos dois repositorios.
**Agentes utilizados:** Camisa10, PromptRefiner, Cetico, ImpactValidator
**Status:** aberto

## 2026-05-14 - M-00A EXECUTADO

**Fase:** fundacao
**O que aconteceu:** Criada a estrutura pre-dependencias nos repositorios EntregGO-Back e EntregGO-Front, com governanca minima, pastas vazias versionaveis, `.env.example`, README, STRUCTURE e CONTRACTS. Nenhuma dependencia foi instalada e nenhum manifesto `package.json` foi criado.
**Agentes utilizados:** Camisa10, PromptRefiner, Cetico, ImpactValidator, FinalValidator, Documentador
**Status:** fechado com ressalvas documentais

## 2026-05-14 - FUNDACAO TECNICA CRIADA

**Fase:** fundacao
**O que aconteceu:** Criados manifests, lockfiles, configuracoes TypeScript/Express/Next/Tailwind, scripts de build/lint/typecheck/test, healthcheck backend e App Router minimo no frontend. Dependencias foram instaladas nos dois repositorios.
**Agentes utilizados:** Camisa10, PromptRefiner, Cetico, ImpactValidator, FinalValidator, Documentador
**Status:** fechado com ressalva de auditoria no frontend

**Validacoes:** Backend `npm install`, `npm ci`, `npm run typecheck`, `npm run build`, `npm test`, `npm run lint` e `npm audit` passaram. Frontend `npm install`, `npm run typecheck`, `npm run build` e `npm run lint` passaram; `npm audit` reportou vulnerabilidades transitivas que exigem upgrades quebraveis.

## 2026-05-14 - HARDENING PARCIAL DE DEPENDENCIAS FRONTEND

**Fase:** fundacao/hardening de dependencias
**O que aconteceu:** No frontend, `next-pwa` foi removido por estar sem uso real e a cadeia vulneravel de Workbox/`serialize-javascript` saiu do lockfile. O `glob` transitivo do `eslint-config-next` foi corrigido com override restrito. O residual ficou concentrado em `next@14.2.35` e no PostCSS interno do Next.
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, SecurityValidator, FinalValidator, Documentador
**Status:** fechado com ressalva residual

**Validacoes:** Frontend `npm run typecheck`, `npm run build` e `npm run lint` passaram. `npm audit --audit-level=moderate` ainda falha e exige migracao major do Next para zerar.

## 2026-05-14 - M-01 BANCO SUPABASE BASE

**Fase:** fundacao/banco
**O que aconteceu:** Criada a migration inicial versionada do Supabase com enums de dominio, tabelas `users`, `stores`, `couriers`, `payments`, `delivery_requests` e `push_subscriptions`, constraints, indices iniciais e RLS base conservadora. Criado README operacional de migrations com notas de seguranca e rollback manual.
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, SecurityValidator, PerformanceValidator, FinalValidator, Documentador
**Status:** fechado localmente; migration ainda nao aplicada em banco remoto

**Validacoes:** Backend `npm run typecheck`, `npm run build`, `npm test`, `npm run lint`, `npm audit` e varredura local de secrets executados neste ciclo.

## 2026-05-14 - M-01 APLICADA NO SUPABASE

**Fase:** fundacao/banco
**O que aconteceu:** Usuario informou que a SQL da migration M-01 foi aplicada no banco Supabase. O registro local foi atualizado para refletir a aplicacao manual, sem validacao direta do banco remoto pelo Codex.
**Agentes utilizados:** Camisa10, Documentador
**Status:** fechado por confirmacao manual do usuario

**Validacoes:** Sem nova validacao remota executada pelo Codex neste registro.

## 2026-05-14 - SMOKE REMOTO M-01 BLOQUEADO POR CREDENCIAL

**Fase:** fundacao/banco
**O que aconteceu:** Foi tentado um smoke remoto read-only via Supabase REST para validar tabelas/colunas e acesso client-side. Todas as chamadas retornaram `401`, inclusive usando a variavel local `SUPABASE_SERVICE_ROLE_KEY`. Uma checagem segura de metadados mostrou que a variavel esta preenchida, mas nao tem formato JWT de service role. Tambem nao ha `psql`, Supabase CLI, pacote `pg` ou URL de conexao Postgres local para consultar o catalogo do banco.
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, SecurityValidator, FinalValidator, Documentador
**Status:** bloqueado por credencial/ferramenta ausente; sem evidenciar falha da migration

**Validacoes:** Backend `npm run typecheck`, `npm run build`, `npm test`, `npm run lint`, `npm audit` e varredura local de secrets passaram. Nenhum secret foi impresso.

## 2026-05-14 - SECRET SUPABASE EXPOSTO NO CHAT

**Fase:** fundacao/seguranca
**O que aconteceu:** Usuario colou uma chave Supabase service role no chat ao tentar desbloquear o smoke remoto. O valor nao foi registrado em arquivos nem reutilizado em comandos. O ciclo de smoke remoto deve aguardar rotacao da chave e configuracao local segura.
**Agentes utilizados:** Camisa10, SecurityValidator, Documentador
**Status:** bloqueado ate rotacao

**Validacoes:** Nenhuma validacao remota executada com a chave exposta.

## 2026-05-14 - SMOKE REMOTO M-01 PARCIAL

**Fase:** fundacao/banco
**O que aconteceu:** A configuracao local foi rechecada. `SUPABASE_SERVICE_ROLE_KEY` passou a ter formato JWT de service role e autenticou no Supabase REST. O REST confirmou leitura com service role para `users`, `stores`, `couriers` e `payments`, mas retornou `404` para `delivery_requests` e `push_subscriptions`. A tentativa de catalogo SQL via `SUPABASE_DB_URL` falhou com erro de autenticacao `28P01`.
**Agentes utilizados:** Camisa10, SecurityValidator, FinalValidator, Documentador
**Status:** parcial; bloqueado por autenticacao Postgres e verificacao pendente das duas tabelas no catalogo SQL

**Validacoes:** Nenhum secret foi impresso. Nenhuma escrita foi executada.

## 2026-05-14 - SMOKE REMOTO M-01 APROVADO COM RESSALVA AUTH

**Fase:** fundacao/banco
**O que aconteceu:** A conexao Postgres via `SUPABASE_DB_URL` passou e o catalogo SQL confirmou a fundacao M-01: enums, seis tabelas de dominio, RLS habilitado, policies esperadas, indices esperados, deduplicacao de `push_subscriptions.endpoint`, preparacao de aceite futuro e ausencia de grants amplos de escrita para `anon`/`authenticated`. O Supabase REST com service role confirmou leitura das seis tabelas e o perfil `anon` foi negado. Token sintetico `authenticated` retornou `401`, portanto a validacao de RLS de usuario final fica para sessao real no ciclo M-02.
**Agentes utilizados:** Camisa10, ImpactValidator, SecurityValidator, FinalValidator, Documentador
**Status:** fechado com ressalva de auth real

**Validacoes:** Smoke SQL remoto passou. Smoke REST passou para service role e anon. Nenhum secret foi impresso e nenhuma escrita foi executada.

## 2026-05-14 - M-02A AUTH BACKEND FUNDACAO

**Fase:** fundacao/auth
**O que aconteceu:** Implementada a fundacao backend de auth/cadastro/aprovacao usando Supabase Auth via service role somente server-side. Foram adicionados validadores Zod, cliente Supabase backend-only, middleware de autenticacao por Bearer token, guards de usuario ativo e role admin, cadastro de loja/motoboy com status `pendente`, listagem admin paginada e acoes admin de aprovar, bloquear e desbloquear usuarios.
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** fechado localmente com ressalva de validacao RLS por sessao real

**Validacoes:** Backend `npm run typecheck`, `npm run build`, `npm test`, `npm run lint` e `npm audit` passaram. Testes de healthcheck, payload invalido, token ausente, negacao de admin para nao-admin e services com Supabase mockado foram adicionados. Varredura local de secrets nao encontrou segredo real em arquivo versionavel; `.env.local` permanece ignorado. Nenhuma escrita em banco remoto foi executada neste ciclo.

## 2026-05-14 - M-02B FRONTEND CONSUMINDO AUTH BACKEND

**Fase:** fundacao/auth
**O que aconteceu:** Frontend M-02B implementado consumindo os endpoints M-02A sem alterar contrato backend. Login usa sessao Supabase Auth no browser e chama `/api/auth/me`; cadastro loja/motoboy segue pela API backend. Backend passou a carregar `.env.local` em desenvolvimento antes de `.env`, sem imprimir valores. Smoke anon read-only confirmou negacao nas seis tabelas de dominio, incluindo `payments`.
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** fechado localmente com ressalva de smoke autenticado real

**Validacoes:** Backend `npm run typecheck`, `npm run build`, `npm test`, `npm run lint` e `npm audit` passaram. Nenhuma mudanca de schema ou endpoint backend foi aplicada. Smoke com sessao real nao foi executado porque a rotacao da service role exposta ainda precisa ser confirmada e nao ha plano de limpeza segura para usuario temporario remoto. Varredura de secrets nao encontrou segredo real fora de `.env.local`; os demais achados sao placeholders/exemplos em documentacao de referencia.

## 2026-05-14 - HARDENING AUTH/RLS BLOQUEADO NO GATE DE SERVICE ROLE

**Fase:** fundacao/auth hardening
**O que aconteceu:** Foi inventariado o estado atual de backend e frontend para preparar o smoke autenticado com usuario real ficticio. A checagem local verificou apenas presenca e formato geral das envs necessarias, sem imprimir valores: backend com `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` e `FRONTEND_URL` presentes em formato esperado; frontend com `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_SUPABASE_URL` presentes em formato de URL e `NEXT_PUBLIC_SUPABASE_ANON_KEY` presente, mas nao em formato JWT classico. Nao houve decodificacao de payload, chamada remota com service role, criacao de usuario, escrita em banco ou smoke real.
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** bloqueado por ausencia de confirmacao de rotacao da service role exposta

**Validacoes:** Apenas leitura de arquivos, inventario de codigo e checagem cega de envs. O SecurityValidator bloqueou qualquer uso de service role e qualquer criacao remota ate existir confirmacao segura de rotacao. Plano de limpeza registrado: quando liberado, o smoke deve usar identificador unico `rls-smoke-<timestamp>`, criar apenas dados ficticios e remover usuario Auth, `public.users`, perfil `stores`/`couriers` e auxiliares criados pela propria execucao.

## 2026-05-14 - HARDENING ADMIN/RLS REAVALIADO E BLOQUEADO

**Fase:** fundacao/auth hardening
**O que aconteceu:** O ciclo de hardening admin/RLS foi reaberto com leitura obrigatoria de contexto backend/frontend, codigo `src/**`, migration M-01 e instrucoes dos validadores. O gate de seguranca exigia confirmacao segura externa da rotacao da service role anteriormente exposta. Como essa confirmacao nao estava disponivel no repositorio nem foi fornecida pelo operador, o ciclo parou antes de qualquer uso de credencial privilegiada.
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** bloqueado no gate de service role

**Validacoes:** Nenhuma chamada remota, smoke autenticado, consulta por catalogo SQL, criacao de usuario Auth, escrita em tabelas de dominio, verificacao de env local ou execucao de service role foi realizada neste ciclo. Nao foi criado script de smoke porque o SecurityValidator nao aprovou o gate.

## 2026-05-14 - RETOMADA DE HARDENING ADMIN/RLS SEM CONFIRMACAO DE ROTACAO

**Fase:** fundacao/auth hardening
**O que aconteceu:** O prompt de retomada do hardening admin/RLS foi reexecutado. Foram relidos o estado de governanca do backend, o estado do frontend e as instrucoes dos validadores solicitados. O gate obrigatorio exigia confirmacao explicita e segura da rotacao da service role por operador, secret manager ou Supabase dashboard, mas essa evidencia nao foi fornecida.
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** bloqueado no gate de service role

**Validacoes:** Nao houve verificacao de envs reais, chamada remota, uso de service role, consulta por catalogo SQL, criacao de usuario Auth, escrita em tabelas de dominio, execucao de smoke autenticado ou criacao de script. O bloqueio foi documentado sem expor secrets.

## 2026-05-14 - HARDENING ADMIN/RLS MANTIDO BLOQUEADO POR FALTA DE EVIDENCIA

**Fase:** fundacao/auth hardening
**O que aconteceu:** O prompt de retomada foi executado novamente. Foram relidos os documentos obrigatorios, `src/**` de backend e frontend, migration M-01 e instrucoes dos validadores. A mensagem de entrada continha o requisito de confirmar a rotacao, mas nao continha a confirmacao textual segura do operador, secret manager ou Supabase dashboard.
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** bloqueado no gate de service role

**Validacoes:** Nao houve leitura de `.env.local`, verificacao de env real, chamada remota, catalogo SQL, uso de service role, criacao de usuario Auth, escrita remota, script de smoke, testes, audit ou varredura ampla. O ciclo parou antes dessas etapas conforme gate de seguranca.

## 2026-05-14 - SMOKE AUTH/RLS REAL PARCIAL

**Fase:** fundacao/auth hardening
**O que aconteceu:** O operador confirmou de forma textual e segura que a service role anteriormente exposta foi rotacionada no Supabase dashboard/secret manager em 2026-05-14, sem colar valores. Foi criado `scripts/smoke-auth-rls.mjs`, carregando envs sem imprimir valores, usando dados ficticios `rls-smoke-<timestamp>@example.test`, criando usuarios Auth e linhas de dominio temporarias, e limpando tudo em `finally`. O smoke validou chamadas reais do backend com sessao real: `/api/auth/me`, negacao de rotas admin para usuario `pendente`, `logista` e `motoboy`, listagem admin paginada e exigencia de admin ativo para `approve/block/unblock`.
**Arquivos criados:** `scripts/smoke-auth-rls.mjs`
**Arquivos modificados:** `src/app.ts`, `STATUS.md`, `LOG.md`, `LEARNINGS.md`
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** parcial; bloqueado em RLS client-side autenticado

**Validacoes:** Checagem de presenca/formato das envs passou sem imprimir valores. O smoke criou apenas dados ficticios e confirmou limpeza completa em todas as execucoes. A validacao RLS client-side autenticada falhou: REST com chave publica anon e Bearer de usuario real retornou `401` em `users`. Nao houve consulta por catalogo SQL neste ciclo. Backend `typecheck`, `build`, `test`, `lint` e `npm audit` passaram. Frontend `typecheck`, `build`, `test --if-present` e `lint` passaram; `npm audit` segue falhando pelo residual conhecido em Next/PostCSS. Varredura de secrets nao imprimiu valores; achados reais ficaram em `.env.local` ignorado, e demais ocorrencias foram placeholders/referencias.

## 2026-05-14 - M-02C DESIGN E LANDING FRONTEND

**Fase:** fundacao/design
**O que aconteceu:** A spec geral passou a incluir o marco M-02C para identidade visual e landing. No frontend, foi criado `design.md`, a logo oficial foi adicionada como asset publico e a rota `/` virou landing de cadastro/login com paleta laranja/azul.
**Agentes utilizados:** Camisa10, Design Agent, ImpactValidator, FinalValidator, Documentador
**Status:** fechado no frontend, sem mudanca de contrato backend

**Validacoes:** Frontend `npm run typecheck`, `npm run build` e `npm run lint` passaram. Smoke HTTP local em `http://127.0.0.1:3002/` retornou `200`. Mudanca restrita a frontend/documentacao. Nenhum endpoint, migration, RLS, secret, push, realtime ou dashboard foi implementado.

## 2026-05-14 - SMOKE AUTH/RLS REAL APROVADO

**Fase:** fundacao/auth hardening
**O que aconteceu:** A configuracao de chaves Supabase foi corrigida para o modelo moderno: backend usando secret key em `SUPABASE_SERVICE_ROLE_KEY` e frontend usando publishable key em `NEXT_PUBLIC_SUPABASE_ANON_KEY`. O script `scripts/smoke-auth-rls.mjs` foi ajustado para aceitar secret key moderna no backend. O smoke real criou usuarios e dados ficticios, validou API backend e RLS client-side autenticado, e limpou todos os recursos temporarios.
**Arquivos criados:** nenhum neste fechamento
**Arquivos modificados:** `scripts/smoke-auth-rls.mjs`, `.env.local` local nao versionado, `STATUS.md`, `LOG.md`, `LEARNINGS.md`
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** fechado com sucesso

**Validacoes:** `node scripts/smoke-auth-rls.mjs` passou com `all checks passed` e `cleanup completed`. O smoke confirmou `/api/auth/me`, negacao admin para usuarios nao-admin e pendente, listagem admin paginada, `approve/block/unblock` restritos a admin ativo, anon negado nas tabelas de dominio, authenticated vendo somente sua propria linha em `users`, authenticated sem acesso a `payments`, escritas client-side negadas em tabelas de dominio e leitura propria em `stores`/`couriers`. Nenhum secret foi impresso.

## 2026-05-15 - F7 TRACK A ADMIN FRONTEND DOCUMENTADA

**Fase:** fundacao/auth-operacao
**O que aconteceu:** Foi registrado no backend o estado deixado pela implementacao frontend F7 Track A. O frontend admin agora usa o contrato backend M-02A existente para listar usuarios e executar aprovar/bloquear/desbloquear, com paginas segmentadas por preset (`/admin`, `/admin/lojas`, `/admin/motoboys`, `/admin/aprovacoes`, `/admin/usuarios`) e drawer estrutural de usuario. As abas de documentos, entregas, pagamentos e notas permanecem como placeholders honestos porque os endpoints e validacoes necessarios ainda nao existem no backend.
**Arquivos backend modificados:** `STATUS.md`, `LOG.md`, `LEARNINGS.md`, `README.md`, `CONTRACTS.md`
**Arquivos frontend observados:** `src/components/admin/AdminUsersPanel.tsx`, `src/components/admin/UserDetailDrawer.tsx`, `src/app/admin/**/page.tsx`
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, Documentador
**Status:** documentado; backend sem mudanca de codigo

**Validacoes:** Conferidos contratos reais do backend em `src/routes/admin.routes.ts`, `src/controllers/admin.controller.ts`, `src/services/admin.service.ts` e `CONTRACTS.md`. Confirmado que ainda nao existem `GET /api/admin/users/:id`, `/api/admin/insights`, `/api/admin/payments`, signed URLs de documentos ou `admin_notes`. Nenhum teste foi executado porque a mudanca foi documental.

## 2026-05-15 - TRACK B BACKEND ADMIN USER DETAIL

**Fase:** fundacao/auth-operacao
**O que aconteceu:** Implementado `GET /api/admin/users/:id` no backend, usando os mesmos middlewares admin existentes (`authenticate`, `requireActiveUser`, `requireRoles('admin')`). O endpoint retorna `user` com os campos de `DomainUser` e `profile` sanitizado conforme role: loja com `name`, `owner_name`, `address` e `description`; motoboy com `full_name` e `is_online`; admin com `profile: null`. Campos de Storage/documentos (`logo_url`, `bike_photo_url`, `license_photo_url`) ficaram fora dos tipos, selects e resposta.
**Arquivos modificados:** `src/types/domain.ts`, `src/services/admin.service.ts`, `src/controllers/admin.controller.ts`, `src/routes/admin.routes.ts`, `tests/admin-routes.spec.ts`, `CONTRACTS.md`, `STATUS.md`, `README.md`, `LEARNINGS.md`, `LOG.md`
**Agentes utilizados:** Camisa10, PromptRefiner, Cetico, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** fechado localmente; pendente integracao do frontend ao novo contrato

**Validacoes:** `npm run typecheck`, `npm test`, `npm run lint` e `npm run build` passaram. `npm test` rodou 5 arquivos e 17 testes. Testes novos cobrem token ausente, usuario autenticado nao-admin, admin ativo recebendo loja, admin ativo recebendo admin com `profile: null`, admin ativo recebendo motoboy sem campos de Storage/documento e usuario inexistente.

## 2026-05-15 - FRONTEND INTEGRADO AO ADMIN USER DETAIL

**Fase:** fundacao/auth-operacao
**O que aconteceu:** O frontend passou a consumir `GET /api/admin/users/:id` no drawer admin, usando estado efemero para o perfil expandido sanitizado. A integracao manteve documentos, entregas, pagamento e notas bloqueados como placeholders e nao adicionou acesso direto ao Supabase de negocio.
**Arquivos backend modificados:** `STATUS.md`, `README.md`, `LOG.md`
**Arquivos frontend modificados:** `src/types/auth.ts`, `src/lib/api.ts`, `src/components/admin/AdminUsersPanel.tsx`, `src/components/admin/UserDetailDrawer.tsx`, `STATUS.md`, `CONTRACTS.md`, `README.md`, `LEARNINGS.md`, `LOG.md`
**Agentes utilizados:** Camisa10, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** documentado; backend sem mudanca de codigo neste ciclo

**Validacoes:** No frontend, `npm run typecheck`, `npm run lint`, `npm test --if-present` e `npm run build` passaram. Build gerou 24 rotas.

## 2026-05-15 - FRONTEND INTEGRADO AO ADMIN INSIGHTS

**Fase:** fundacao/auth-operacao
**O que aconteceu:** O frontend substituiu o `ComingSoonPanel` de `/admin/insights` por consumo real de `GET /api/admin/insights`. A tela exibe contagens por role/status, lojas ativas, motoboys ativos, ultimos cadastros pendentes limitados pelo backend e `generated_at` formatado. Nao foram adicionados mocks, graficos complexos, cache, polling, realtime, acesso direto ao banco ou PII fora do contrato.
**Arquivos backend modificados:** `STATUS.md`, `README.md`, `LOG.md`, `LEARNINGS.md`
**Arquivos frontend modificados:** `src/types/auth.ts`, `src/lib/api.ts`, `src/app/admin/insights/page.tsx`, `STATUS.md`, `CONTRACTS.md`, `README.md`, `LEARNINGS.md`, `LOG.md`
**Agentes utilizados:** Camisa10, ImpactValidator, TestEngineer, Documentador
**Status:** documentado; backend sem mudanca de codigo neste ciclo

**Validacoes:** Frontend `npm run typecheck`, `npm run lint`, `npm test --if-present` e `npm run build` passaram. Backend, tocado apenas em documentacao, tambem passou em `npm run typecheck`, `npm test`, `npm run lint` e `npm run build`. Browser local em `http://127.0.0.1:3002/admin/insights` abriu sem o texto antigo do placeholder; sem sessao admin real disponivel no navegador, a verificacao visual ficou limitada ao shell/guard de auth.
