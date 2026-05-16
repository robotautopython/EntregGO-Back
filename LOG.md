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

## 2026-05-15 - SMOKE POS-DEPLOY ADMIN INSIGHTS APROVADO

**Fase:** fundacao/auth-operacao
**O que aconteceu:** O frontend em producao `https://entreggo.vercel.app`, publicado no commit `93d0175`, foi validado contra o backend em producao `https://entreggoback.vercel.app`, publicado no commit `b34f30d`. A checagem publica confirmou que o bundle do frontend contem a chamada a `/api/admin/insights` e que o backend sem token responde `401 AUTH_REQUIRED`, comprovando rota existente e protegida. Em sessao real de admin ativo no navegador do operador, `GET https://entreggoback.vercel.app/api/admin/insights` retornou `200` e a tela `/admin/insights` renderizou `Insights da central`, cards de usuarios, lojas ativas, motoboys ativos e dados do contrato sem o placeholder antigo.
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, TestEngineer, Documentador
**Status:** fechado com ressalvas operacionais

**Validacoes:** Smoke autenticado de sucesso aprovado por evidencia visual do operador, sem colar tokens, cookies ou headers sensiveis. A tela nao exibiu `Area reservada`, `Metricas de operacao entram depois...`, `Evitar dashboard fake...` ou `ComingSoonPanel`. A ausencia de PII fora do contrato foi validada no codigo e na area visivel do smoke: o painel usa apenas contagens, `id`, `role`, `status`, `created_at` e `generated_at`. Smoke de vazio nao executado porque nao havia dataset seguro naturalmente zerado em producao e nao foram criados dados artificiais. Smoke de falha de API foi observado no incidente real de deploy stale anterior, com UI exibindo `Falha ao carregar` e `Tentar novamente`; bloqueio reversivel via DevTools nao foi executado pelo Codex porque a sessao logada estava apenas no navegador do operador. Regressao basica parcial: `/admin` ja havia sido aberto na sessao de producao, e a navegacao admin permaneceu visivel; acoes destrutivas e logout nao foram executados.

## 2026-05-15 - FAVICON FRONTEND PRODUCAO CORRIGIDO

**Fase:** fundacao/auth-operacao
**O que aconteceu:** O frontend recebeu `public/favicon.ico` gerado a partir do simbolo oficial ja existente, removendo o `404` de `https://entreggo.vercel.app/favicon.ico` observado no smoke. A mudanca ficou restrita ao frontend e a documentacao; backend, contratos, auth, banco e rotas admin nao foram alterados.
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, TestEngineer, Documentador
**Status:** fechado em producao

**Validacoes:** Frontend `npm run typecheck`, `npm run lint`, `npm test --if-present` e `npm run build` passaram. Localmente, `/favicon.ico` retornou `200` e `/admin/insights` retornou `200`. Apos deploy do frontend `587af96`, `https://entreggo.vercel.app/favicon.ico` passou de `404` para `200`, e `/admin/insights` permaneceu acessivel.

## 2026-05-15 - FECHAMENTO LOCAL DA MIGRACAO FRONTEND NEXT 15

**Fase:** fundacao/auth-operacao
**O que aconteceu:** O backend permaneceu sem mudanca funcional enquanto o ciclo frontend foi fechado localmente em Next.js `15.5.18`, `eslint-config-next@15.5.18`, React `19.2.6` e React DOM `19.2.6`. A documentacao cross-stack foi atualizada para remover o bloqueio antigo de `next@14.2.35` e registrar o residual real de auditoria em Next/PostCSS interno.
**Agentes utilizados:** Camisa10, PromptRefiner, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** documentado; backend sem mudanca de codigo

**Validacoes:** No frontend, `npm run typecheck`, `npm run lint`, `npm test --if-present` e `npm run build` passaram. `npm audit --json` falhou com 2 vulnerabilidades moderadas (`next` via `postcss` interno), sem altas ou criticas. Smoke local aprovou `/`, `/login`, `/registro`, `/aguardando-aprovacao`, `/admin/insights`, `/admin/usuarios`, `/admin/lojas` e `/admin/motoboys` com `200`, alem de `/admin` e `/admin/aprovacoes` com redirects esperados.

## 2026-05-15 - PROMOCAO MANUAL DE ADMIN VIA SQL

**Fase:** fundacao/auth-operacao
**O que aconteceu:** O usuario `elismar@entreggo.com` foi promovido a `admin` ativo via SQL direto no projeto Supabase de producao, executado pelo operador `admin@entreggo.com` no SQL Editor com a service role do painel. O usuario havia sido criado pelo painel `auth.users` do Supabase, sem passar pelo endpoint `POST /api/auth/register/*`, e por isso nao tinha linha-espelho em `public.users`. A diagnostica seguiu o fluxo cetico: primeiro `SELECT` em `public.users` retornou zero, depois `SELECT` em `auth.users` confirmou a existencia da conta (`auth_id` real `1739e1a6-9506-42f2-b26b-6b3b1e3a8265`, com `c` truncado na screenshot inicial corrigido para `6`). Em seguida, `INSERT` aditivo em `public.users` criou a linha com `role='admin'`, `status='ativo'`, `approved_at=now()` e `approved_by` apontando para o `public.users.id` de `admin@entreggo.com` (`3264363d-14e6-49b2-8e87-c826a163437d`). O `RETURNING` confirmou: `id=063a9f7b-d36b-4631-aba7-42d2...`, `auth_id=1739e1a6-9506-42f2-b26b-6b3b1e3a8265`, `email=elismar@entreggo.com`, `role=admin`, `status=ativo`, `approved_at=2026-05-15 19:50:41.5133+00`, `approved_by=3264363d-14e6-49b2-8e87-c826a163437d`. Nenhum codigo backend, frontend, migration ou contrato foi alterado.
**Arquivos modificados:** `LOG.md` (EntregGO-Back)
**Agentes utilizados:** Camisa10, Cetico, Documentador
**Status:** fechado em producao

**Validacoes:** `SELECT` previo em `public.users` por `auth_id` e `email` retornou zero linhas, confirmando ausencia. `SELECT` em `auth.users` confirmou conta verificada (`email_verified=true`, `created_at=2026-05-15 19:12:49`). `SELECT` top-10 em `public.users` por `created_at DESC` confirmou que `admin@entreggo.com` existe com `role=admin/status=ativo` e forneceu o `id` correto para `approved_by`. Apos o `INSERT`, o `RETURNING` exibiu a linha criada com todos os campos esperados. Recomendacoes operacionais para `elismar@entreggo.com`: fazer logout e novo login para a sessao JWT refletir o `role=admin`, e o painel `/admin/usuarios` ja deve listar a conta com a contagem real. Promocao de role continua sendo operacao exclusiva via service role no painel Supabase porque o backend M-02A so manipula `status` via endpoints (`approve/block/unblock`), por design.

## 2026-05-15 - M-04A BACKEND DELIVERY CREATE E RLS HARDENING

**Fase:** fundacao/auth-operacao
**O que aconteceu:** Implementada a primeira fatia do fluxo de entregas no backend: `POST /api/deliveries` permite que apenas `logista` ativo crie uma solicitacao de entrega usando o perfil `stores` derivado do usuario autenticado. O body aceita `destinationAddress` e `notes`, e o backend grava `delivery_requests` via service role com `status=aguardando`, `courier_id=null` e `expires_at` pelo default do banco. No mesmo patch, foi criada a migration M-04A para substituir a policy inicial de `delivery_requests`, removendo a leitura client-side de entregas aguardando por motoboys ativos/online e mantendo leitura apenas para a loja ativa dona ou motoboy ativo ja atribuido.
**Arquivos criados:** `src/routes/delivery.routes.ts`, `src/controllers/delivery.controller.ts`, `src/services/delivery.service.ts`, `src/validators/delivery.validators.ts`, `tests/delivery-routes.spec.ts`, `supabase/migrations/20260515210000_m04a_delivery_request_rls_hardening.sql`
**Arquivos modificados:** `src/app.ts`, `src/types/domain.ts`, `scripts/smoke-auth-rls.mjs`, `CONTRACTS.md`, `README.md`, `supabase/README.md`, `STATUS.md`, `LOG.md`, `LEARNINGS.md`
**Agentes utilizados:** Camisa10, Cetico, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** fechado localmente; smoke remoto pendente de aplicar a migration M-04A no Supabase alvo

**Validacoes:** `npm run typecheck`, `npm test`, `npm run lint` e `npm run build` passaram. `npm test` rodou 6 arquivos e 30 testes. O teste novo cobre token ausente, usuario pendente/bloqueado, motoboy ativo negado, payload invalido, logista ativo sem perfil `stores`, criacao por logista ativo e derivacao de `store_id` do usuario autenticado. O smoke `scripts/smoke-auth-rls.mjs` foi atualizado para validar `POST /api/deliveries`, negar escrita client-side em `delivery_requests` e confirmar que motoboy online nao ve entrega aguardando sem atribuicao; ele nao foi executado neste ciclo porque depende da migration M-04A ja aplicada no ambiente Supabase alvo.

## 2026-05-15 - M-04A VALIDADA POS-MIGRATION

**Fase:** fundacao/auth-operacao
**O que aconteceu:** A migration `supabase/migrations/20260515210000_m04a_delivery_request_rls_hardening.sql` foi considerada aplicada no Supabase alvo a partir da evidencia visual do operador (`Success. No rows returned`) e o smoke real atualizado foi executado contra o ambiente. O smoke confirmou `POST /api/deliveries` para `logista` ativo, negacao para `pendente`, `motoboy` e payload invalido, escrita client-side negada em `delivery_requests`, leitura da loja para suas proprias entregas, leitura do motoboy somente para entrega ja atribuida a ele e ausencia de visibilidade de entrega `aguardando` sem atribuicao para motoboy online.
**Arquivos criados:** nenhum
**Arquivos modificados:** `scripts/smoke-auth-rls.mjs`, `STATUS.md`, `README.md`, `LOG.md`, `LEARNINGS.md`
**Agentes utilizados:** Camisa10, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** fechado com sucesso

**Validacoes:** `npm run typecheck`, `npm test`, `npm run lint` e `npm run build` passaram apos o ajuste final do smoke. `npm test` rodou 6 arquivos e 30 testes. `node scripts/smoke-auth-rls.mjs` passou com `all checks passed` e `cleanup completed`. A varredura residual por marcadores ficticios do smoke retornou zero para `auth_users`, `users`, `stores`, `couriers`, `delivery_requests` e `push_subscriptions`. Durante a validacao, tentativas iniciais expuseram residuos ficticios de smoke por falha no proprio script; somente registros com prefixo/marcadores `rls-smoke-*` foram removidos antes da execucao final limpa. Nenhum secret, token, header sensivel ou dado real foi impresso.

## 2026-05-15 - M-04C BACKEND DESTINO OPCIONAL

**Fase:** fundacao/auth-operacao
**O que aconteceu:** O contrato real de `POST /api/deliveries` foi ajustado para aceitar criacao sem `destinationAddress`. Foi criada a migration M-04C para tornar `delivery_requests.destination_address` nullable e trocar o check antigo por uma regra que aceita `null` ou texto nao vazio. O backend passou a aceitar `destinationAddress` ausente, vazio ou whitespace, normalizando para `null`, e manteve `notes` opcional tambem normalizado para `null`. O schema Zod ficou `strict`, rejeitando `store_id`, `status`, `courier_id` e campos desconhecidos no body. Aceite, pool de motoboys, realtime, push, cron, historico, cancelamento e expiracao seguiram bloqueados.
**Arquivos criados:** `supabase/migrations/20260515223000_m04c_delivery_destination_nullable.sql`
**Arquivos modificados:** `src/validators/delivery.validators.ts`, `src/services/delivery.service.ts`, `src/types/domain.ts`, `tests/delivery-routes.spec.ts`, `scripts/smoke-auth-rls.mjs`, `CONTRACTS.md`, `README.md`, `supabase/README.md`, `STATUS.md`, `LOG.md`, `LEARNINGS.md`
**Agentes utilizados:** Camisa10, ImpactValidator, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** fechado localmente com ressalva operacional: aplicar a migration M-04C no Supabase alvo antes de smoke real/deploy

**Validacoes:** `npm run typecheck`, `npm test`, `npm run lint`, `npm run build` e `git diff --check` passaram. `npm test` rodou 6 arquivos e 36 testes. A varredura confirmou que campos derivados aparecem no insert server-side derivado (`store_id: store.id`), nos tipos/respostas e nos testes negativos; `store_id`, `status` e `courier_id` enviados no request agora recebem `VALIDATION_ERROR` antes do service. `console.log` permanece apenas no startup local (`src/index.ts`) e no script de smoke. `node scripts/smoke-auth-rls.mjs` nao foi executado porque a migration M-04C ainda precisa ser aplicada no banco alvo para o smoke real criar entrega sem endereco com seguranca.

## 2026-05-15 - M-04C VALIDADA POS-MIGRATION

**Fase:** fundacao/auth-operacao
**O que aconteceu:** O operador aplicou a SQL da migration `supabase/migrations/20260515223000_m04c_delivery_destination_nullable.sql` no SQL Editor do Supabase alvo e o painel retornou `Success. No rows returned`. Em seguida, o smoke Auth/RLS real foi executado contra o backend buildado localmente. O smoke confirmou criacao de entrega por `logista` ativo sem `destinationAddress`, persistindo `destination_address=null`; rejeicao de payload com `store_id` no body; negacoes para usuario pendente e motoboy; RLS de `delivery_requests`; e cleanup completo dos recursos ficticios.
**Arquivos criados:** nenhum
**Arquivos modificados:** `STATUS.md`, `README.md`, `LOG.md`
**Agentes utilizados:** Camisa10, SecurityValidator, TestEngineer, FinalValidator, Documentador
**Status:** fechado com sucesso

**Validacoes:** `npm run build` passou. `node scripts/smoke-auth-rls.mjs` passou com `all checks passed` e `cleanup completed`. Nenhum secret, token, header sensivel ou dado real foi impresso. Aceite, pool de motoboys, realtime, push, cron, historico, cancelamento e expiracao seguem bloqueados.

## 2026-05-15 - M-04C POS-DEPLOY PRODUCAO APROVADA

**Fase:** fundacao/auth-operacao
**O que aconteceu:** A M-04C foi validada em producao contra backend `https://entreggoback.vercel.app` no commit `d70e45e` e frontend `https://entreggo.vercel.app` no commit `d304339`. Os dois repositorios estavam limpos, em `main`, com upstream `origin/main` e `HEAD...origin/main` em `0 0`. O smoke publico confirmou que `POST /api/deliveries` sem token retorna `401 AUTH_REQUIRED`, que `/loja/nova-entrega` retorna `200` e que o bundle publicado da rota contem o marcador funcional de payload minimo incremental sem strings vazias. O smoke autenticado usou env local seguro e recursos ficticios temporarios, sem imprimir token/header/cookie, criou entrega como `logista` ativo com payload `{}` e limpou os recursos no `finally`.
**Arquivos criados:** nenhum
**Arquivos modificados:** `STATUS.md`, `LOG.md`
**Agentes utilizados:** Camisa10, TestEngineer, FinalValidator, Documentador
**Status:** fechado em producao

**Validacoes:** Smoke autenticado de producao retornou `201`, `success=true`, `destination_address=null`, `status=aguardando`, `courier_id=null` e `store_id` derivado da sessao. O payload enviado nao continha string vazia, `store_id`, `status` nem `courier_id`; as chaves enviadas foram `[]`. Cleanup retornou `completed`. Nenhum SQL adicional foi executado. Nenhum secret, token, cookie ou header sensivel foi impresso. Aceite, pool de motoboys, realtime, push, cron, historico, cancelamento e expiracao seguem bloqueados.

## 2026-05-15 - M-05 BACKEND LISTAGEM DE ENTREGAS DA LOJA

**Fase:** fundacao/auth-operacao
**O que aconteceu:** Implementado `GET /api/deliveries` no backend, listando somente as entregas da loja vinculada ao usuario autenticado. A rota reusa `authenticate`, `requireActiveUser` e `requireRoles('logista')`. O `store_id` e derivado de `stores.user_id = domainUser.id` (helper `resolveOwnedStore` extraido e compartilhado com `createDelivery`) e o servico filtra `delivery_requests` por esse `store_id` via service role, sem depender de RLS para isolamento. O schema Zod de query e `strict` (`page` coerce int min 1 default 1; `limit` coerce int min 1 max 50 default 20; `status` enum opcional dos 7 valores) e rejeita parametros desconhecidos como `store_id`, `courier_id` e `user_id`. A ordem e fixa `created_at desc`, com paginacao por offset e `count: 'exact'` (mesmo padrao do admin). O `select` da listagem nao traz `store_id` nem `courier_id`. Nenhuma migration, RLS, grant ou policy foi alterada. Aceite, realtime, push, cron, cancelamento, expiracao, historico admin e detalhe unico seguem fora de escopo.
**Arquivos modificados:** `src/validators/delivery.validators.ts`, `src/services/delivery.service.ts`, `src/controllers/delivery.controller.ts`, `src/routes/delivery.routes.ts`, `tests/delivery-routes.spec.ts`, `CONTRACTS.md`, `README.md`, `STATUS.md`, `LOG.md`, `LEARNINGS.md`
**Agentes utilizados:** Camisa10, SecurityValidator, PerformanceValidator, TestEngineer, FinalValidator, Documentador
**Status:** fechado localmente; smoke real e deploy pendentes, integracao frontend pendente

**Validacoes:** `npm run typecheck`, `npm test`, `npm run lint`, `npm run build` e `git diff --check` passaram. `npm test` rodou 6 arquivos e 49 testes (13 novos do M-05). Os testes novos cobrem token ausente (`AUTH_REQUIRED`), `pendente`/`bloqueado` (403), motoboy ativo (`FORBIDDEN_ROLE`), logista ativo sem perfil store (`STORE_PROFILE_REQUIRED`), listagem escopada a `store_id` da sessao com ausencia de `store_id`/`courier_id` e ordem `created_at desc`, filtro por `status` com range de paginacao, `status` invalido (`VALIDATION_ERROR`), `limit > 50` (`VALIDATION_ERROR`) e parametros desconhecidos `store_id`/`courier_id`/`user_id`/`unknown` (`VALIDATION_ERROR`). Nenhum SQL, migration, RLS, grant ou policy foi tocado. Ressalva de performance herdada: `count: 'exact'` e paginacao por offset sao aceitaveis no MVP por escopo de loja, mas seguem como divida; consulta sem `status` usa o indice `idx_delivery_requests_store_status_created_at` apenas pela igualdade de `store_id`, exigindo sort por `created_at`.

## 2026-05-16 - M-05 POS-DEPLOY PRODUCAO APROVADA

**Fase:** fundacao/auth-operacao
**O que aconteceu:** A M-05 foi fechada em producao com backend `https://entreggoback.vercel.app` no commit `f30bfc7` e frontend `https://entreggo.vercel.app` no commit `6833695`. `scripts/smoke-auth-rls.mjs` foi estendido para cobrir `GET /api/deliveries` e aceitar `SMOKE_API_BASE_URL`, preservando o modo local quando a variavel nao existe. O smoke autenticado foi executado contra a URL de producao com dados ficticios temporarios, sessao real Supabase Auth e cleanup em `finally`, sem imprimir token, cookie, header ou secret.
**Arquivos criados:** nenhum
**Arquivos modificados:** `scripts/smoke-auth-rls.mjs`, `STATUS.md`, `LOG.md`, `LEARNINGS.md`
**Agentes utilizados:** Camisa10, TestEngineer, SecurityValidator, PerformanceValidator, FinalValidator, Documentador
**Status:** fechado em producao

**Validacoes:** Smoke publico confirmou `GET /api/deliveries` e `POST /api/deliveries` sem token com `401 AUTH_REQUIRED`, e o frontend `/loja/historico` com `200`. Backend `npm run typecheck`, `npm test` (49 testes), `npm run lint`, `npm run build` e `git diff --check` passaram. Smoke autenticado de producao validou que logista ativo lista somente entregas da propria loja, entrega de outra loja nao aparece, filtro `status=aceita` funciona, paginacao `page=1&limit=1` funciona, `limit=51`, `status=invalido` e `store_id` desconhecido retornam `VALIDATION_ERROR`, resposta nao inclui `store_id` nem `courier_id`, ordem `created_at desc` foi preservada e pendente/motoboy/admin foram negados. Cleanup retornou `completed`. Nenhum SQL, migration, RLS, grant ou policy foi executado ou alterado. Nenhum secret, token, cookie ou header sensivel foi impresso. Aceite, realtime, push, cron, cancelamento, expiracao, detalhe unico, busca textual, filtro por data, historico admin, dados de motoboy, pagamentos, documentos e uploads seguem fora de escopo.

## 2026-05-16 - DIAGNOSTICO NOME DA LOJA (ADMIN E MOTOBOY)

**Fase:** fundacao/auth-operacao
**O que aconteceu:** Investigacao read-only da queixa "nome da loja nao aparece no painel admin nem na visao final do motoboy". Nenhum codigo foi alterado neste registro. No backend, `GET /api/admin/users/:id` (`getUserDetail`) ja seleciona `name` em `adminStoreProfileSelect` e devolve `profile.name`; o backend de listagem `GET /api/admin/users` (`listUsers`) retorna apenas `DomainUser`, sem nome da loja.
**Evidencias:** `src/services/admin.service.ts:19-20` (`adminStoreProfileSelect` inclui `name`) e `getUserDetail` (~linhas 192-207); frontend `EntregGO-Front/src/components/admin/UserDetailDrawer.tsx:355` ja renderiza `Nome da loja` via `profile.name`; `EntregGO-Front/src/components/admin/AdminUsersPanel.tsx` (tabela de listagem sem coluna de loja); `EntregGO-Front/src/components/motoboy/CorridaAtiva.tsx:94,107` usa `ride.store.name` vindo de mock em `courier-types.ts`.
**Decisao de escopo:** Admin = correcao cirurgica tratada em ciclo proprio (causa provavel: contrato de listagem nao traz o nome), com ImpactValidator + PerformanceValidator (incluir campo em endpoint de listagem sem N+1). Motoboy = backlog; expor nome/dados da loja ao motoboy e mudanca de contrato/PII e fica para o ciclo de aceite com SecurityValidator. Sem SQL, migration, RLS, grants ou policies.
**Agentes utilizados:** Camisa10, ImpactValidator (planejado), Documentador
**Status:** diagnostico registrado; sem codigo

## 2026-05-16 - CIRURGICO ADMIN: NOME DA LOJA NA LISTAGEM

**Fase:** fundacao/auth-operacao
**O que aconteceu:** `GET /api/admin/users` (`listUsers`) passou a retornar `store_name` por item. O `select` usa embed 1:1 do PostgREST (`stores.user_id` unico -> `users.id`) na mesma query paginada/contada (sem N+1); um normalizador (`extractStoreName`/`toAdminUserListItem`) aceita objeto ou array do embed, expoe somente `name` e remove a chave `stores` da resposta. `store_name` e `null` para `admin`/`motoboy`. Novo tipo `AdminUserListItem` (backend e frontend); `getUserDetail` e demais contratos inalterados. O frontend `AdminUsersPanel` ganhou a coluna `Loja` (mostra `store_name` ou `—`), sem chamar o detalhe por linha. Nenhum campo de Storage/PII novo, nenhuma migration, RLS, grant, policy ou SQL.
**Arquivos modificados (backend):** `src/types/domain.ts`, `src/services/admin.service.ts`, `tests/admin-routes.spec.ts`, `CONTRACTS.md`, `STATUS.md`, `LOG.md`, `LEARNINGS.md`
**Arquivos modificados (frontend):** `src/types/auth.ts`, `src/components/admin/AdminUsersPanel.tsx`, `CONTRACTS.md`, `STATUS.md`, `LOG.md`
**Agentes utilizados:** Camisa10, ImpactValidator, PerformanceValidator, TestEngineer, FinalValidator, Documentador
**Status:** fechado localmente; deploy pendente

**Validacoes:** Gates ImpactValidator (campo aditivo retrocompativel, cross-stack mapeado) e PerformanceValidator (embed 1:1 numa unica query elimina N+1; +1 string curta por item; `count: 'exact'` e order/range inalterados) aprovados. Backend `npm run typecheck`, `npm test` (6 arquivos, 52 testes, 3 novos da listagem), `npm run lint`, `npm run build` e `git diff --check` passaram. Frontend `npm run typecheck`, `npm run lint`, `npm run build`, `npm test --if-present` (sem suite) e `git diff --check` passaram. Os testes novos cobrem: sem token (`AUTH_REQUIRED`), nao-admin (`FORBIDDEN_ROLE`) e admin recebendo `store_name` so para logista, `null` para admin/motoboy, sem vazar a chave `stores` nem `logo_url`. Nenhum secret, token ou header foi exposto. Motoboy segue backlog do ciclo de aceite com SecurityValidator.

## 2026-05-16 - CIRURGICO ADMIN POS-DEPLOY

**Fase:** fundacao/auth-operacao
**O que aconteceu:** Backend publicado (`f30bfc7..946d84d`) e frontend publicado (`6833695..506c740`) na Vercel; ambos os repos `0 0` com `origin/main` apos o push (backend primeiro, depois frontend). Smoke publico confirmou o servico e o deploy do frontend.
**Agentes utilizados:** Camisa10, TestEngineer, FinalValidator, Documentador
**Status:** fechado em producao com ressalva de smoke autenticado

**Validacoes:** Backend `GET /api/health` -> `200` e `GET /api/admin/users` sem token -> `401 AUTH_REQUIRED` (rota protegida; servico no ar). Frontend `/admin/usuarios` -> `200` e o bundle publicado (chunk compartilhado `87-*.js`) contem `store_name`, a coluna `Loja` e `api/admin/users`, confirmando o codigo M-cirurgico em producao. Ressalva: `GET /api/admin/users` e autenticado e nao tem marcador publico distintivo no backend; a verificacao do valor de `store_name` por sessao real depende de smoke autenticado (mesmo gate de credencial da M-05) e nao foi executada para nao expor secret/token/header. Nenhum SQL, migration, RLS, grant ou policy. Nenhum secret/token/header exposto. Motoboy segue backlog do ciclo de aceite com SecurityValidator.

## 2026-05-16 - FATIA 1 ACEITE MOTOBOY BACKEND

**Fase:** fundacao/auth-operacao
**O que aconteceu:** Implementada a Fatia 1 do ciclo de aceite do motoboy no backend. `GET /api/deliveries/available` lista entregas disponiveis para motoboy ativo e online, usando service role com filtro server-side `status='aguardando'`, `courier_id is null` e `expires_at > now()`, paginacao strict (`page`, `limit<=50`), ordem `created_at desc` e embed `stores(name,address)` no mesmo select. `POST /api/deliveries/:id/accept` aceita entrega por update condicional atomico (`id`, `status='aguardando'`, `courier_id is null`, `expires_at > now()`), seta `status='aceita'`, `courier_id` e `accepted_at`, e trata zero linhas com uma releitura por `id` para `DELIVERY_NOT_FOUND`, idempotencia do mesmo courier, `ALREADY_ACCEPTED` ou `DELIVERY_EXPIRED`. Logs de aceite sao uma linha JSON com `event`, `delivery_id`, `courier_id` e `result`, sem nome, endereco, email, token, header, `destination_address` ou `notes`.
**Arquivos modificados (backend):** `src/validators/delivery.validators.ts`, `src/services/delivery.service.ts`, `src/controllers/delivery.controller.ts`, `src/routes/delivery.routes.ts`, `tests/delivery-routes.spec.ts`, `CONTRACTS.md`, `STATUS.md`, `DECISIONS.md`, `LEARNINGS.md`, `LOG.md`
**Arquivos modificados (frontend):** `CONTRACTS.md`, `STATUS.md`, `LOG.md`, `DECISIONS.md`, `LEARNINGS.md`
**Agentes utilizados:** Camisa10, ImpactValidator, SecurityValidator, PerformanceValidator, TestEngineer, FinalValidator, Documentador
**Status:** fechado localmente; deploy/smoke autenticado real ficam para ciclo operacional se solicitado

**Gates:** ImpactValidator aprovado (mudanca aditiva, rota de loja M-05 preservada, frontend apenas docs, sem migration/RLS/infra); SecurityValidator aprovado (guards existentes, service role somente server-side, filtro explicito, resposta sem `destination_address`/`notes`, logs sem PII/secrets); PerformanceValidator aprovado (paginacao obrigatoria, limite 50, embed 1:1 sem N+1, update por PK/condicoes e indices existentes da M-01).

**Validacoes:** Backend `npm run typecheck`, `npm test` (6 arquivos, 65 testes), `npm run lint` e `npm run build` passaram. Frontend `npm run typecheck`, `npm run lint`, `npm run build` e `npm test --if-present` passaram; nao ha suite de testes frontend. `git diff --check` passou nos dois repositorios. Nenhum SQL, migration, RLS, grant ou policy foi criado, executado ou alterado. Nenhum secret, token, cookie ou header sensivel foi impresso.

**Fora do escopo:** realtime, push/Web Push/VAPID, cron/expiracao automatica, cancelamento, status pos-aceite (`coletada`, `em_transito`, `entregue`), pagamentos, Storage, historico admin, busca textual e UI real do motoboy.

## 2026-05-16 - FATIA 1 MOTOBOY POS-DEPLOY PRODUCAO APROVADA

**Fase:** fundacao/auth-operacao
**O que aconteceu:** O backend da Fatia 1 foi publicado em producao no commit `f5ab8d8` apos o frontend `7db7fad` ja estar publicado. O primeiro smoke publico havia bloqueado porque o backend anterior retornava `404`; apos o push do backend, a Vercel propagou os endpoints e o smoke publico passou. O smoke autenticado foi executado contra `https://entreggoback.vercel.app` com usuarios/perfis/entregas ficticios temporarios e cleanup em `finally`, sem imprimir token, cookie, header ou secret.
**Arquivos criados:** nenhum
**Arquivos modificados:** `STATUS.md`, `LOG.md`
**Agentes utilizados:** Camisa10, TestEngineer, SecurityValidator, PerformanceValidator, FinalValidator, Documentador
**Status:** fechado em producao

**Validacoes locais antes do commit backend:** `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` (6 arquivos, 65 testes) e `git diff --check` passaram; `diff --check` exibiu apenas avisos LF/CRLF.

**Validacoes pos-deploy:** Smoke publico confirmou `GET /api/deliveries/available` sem token -> `401 AUTH_REQUIRED`, `POST /api/deliveries/:id/accept` sem token -> `401 AUTH_REQUIRED`, frontend `/motoboy` -> `200` e bundle publicado contendo `/api/deliveries/available`. Smoke autenticado confirmou que a listagem disponivel retorna apenas `id/status/created_at/expires_at/store` e que `store` contem somente `name/address`; nao retornou `destination_address`, `notes`, `store_id` ou `courier_id`. O aceite concorrente retornou um sucesso e um `ALREADY_ACCEPTED`; entrega expirada retornou `DELIVERY_EXPIRED`; resposta pos-aceite ficou estatica em `status=aceita` sem campos/transicoes `coletada`, `em_transito` ou `entregue`; motoboy offline, pendente, bloqueado e role errado foram negados. Cleanup retornou `completed`. Nenhum SQL, migration, RLS, grant ou policy foi executado ou alterado.

**Fora do escopo preservado:** realtime, push/Web Push/VAPID, cron/expiracao automatica, cancelamento, transicoes pos-aceite, pagamentos, Storage, historico admin, busca textual, filtro por data, detalhe unico e historico do motoboy.

## 2026-05-16 - FATIA 2 MOTOBOY CORRIDA ATIVA SOMENTE LEITURA

**Fase:** fundacao/auth-operacao
**O que aconteceu:** Implementado `GET /api/deliveries/active` no backend para o motoboy ativo/online ver sua corrida `aceita` atual em modo somente leitura. A rota reutiliza `authenticate`, `requireActiveUser`, `requireRoles('motoboy')`, valida query vazia strict, resolve `couriers.id` pela sessao e filtra explicitamente `delivery_requests` por `courier_id=<courier.id>` e `status='aceita'`, com `order(created_at desc)` e `limit(1)`. Retorna `data: null` quando nao existe corrida ativa. O contrato pos-aceite permite `destination_address` e `notes` somente ao courier atribuido e nao retorna `store_id`, `courier_id`, dados de Storage, dono da loja ou campos de transicao.
**Arquivos modificados (backend):** `src/validators/delivery.validators.ts`, `src/services/delivery.service.ts`, `src/controllers/delivery.controller.ts`, `src/routes/delivery.routes.ts`, `tests/delivery-routes.spec.ts`, `CONTRACTS.md`, `STATUS.md`, `DECISIONS.md`, `LEARNINGS.md`, `LOG.md`
**Agentes utilizados:** Camisa10, ImpactValidator, SecurityValidator, PerformanceValidator, TestEngineer, FinalValidator, Documentador
**Status:** fechado localmente; deploy/smoke autenticado real pendentes

**Gates pre-codigo:** ImpactValidator aprovado (mudanca aditiva, rota nova, sem quebra dos contratos M-04/M-05/Fatia 1); SecurityValidator aprovado com guardrail de filtro server-side por `courier_id` e PII so pos-aceite; PerformanceValidator aprovado com query limitada a 1, sem `count`, sem polling e alinhada ao indice existente por `courier_id/status/created_at`.

**Validacoes parciais durante implementacao:** Backend `npm test` passou com 6 arquivos e 73 testes; `npm run typecheck` passou. Nenhum SQL, migration, RLS, grant ou policy foi criado, executado ou alterado. Nenhum secret, token, cookie ou header sensivel foi impresso.

**Fora do escopo:** mutation, transicoes `coletada`/`em_transito`/`entregue`, cancelamento, realtime, push/Web Push/VAPID, cron/expiracao automatica, historico do motoboy, historico admin, pagamentos e Storage.

## 2026-05-16 - FATIA 2 MOTOBOY POS-DEPLOY PRODUCAO APROVADA

**Fase:** fundacao/auth-operacao
**O que aconteceu:** Backend publicado em producao no commit `af4d0df` e frontend publicado no commit `53a8e72`. A rota `GET /api/deliveries/active` foi validada contra `https://entreggoback.vercel.app` e a UI `/motoboy` contra `https://entreggo.vercel.app`. O smoke autenticado usou usuarios/perfis/entregas ficticios temporarios com cleanup em `finally`, sem imprimir token, cookie, header Authorization ou secret.
**Arquivos criados:** nenhum
**Arquivos modificados:** `STATUS.md`, `LOG.md`
**Agentes utilizados:** Camisa10, ImpactValidator, SecurityValidator, PerformanceValidator, TestEngineer, FinalValidator, Documentador
**Status:** fechado em producao

**Validacoes locais antes dos commits:** Backend `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` (6 arquivos, 73 testes) e `git diff --check` passaram. Frontend `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` (5 arquivos, 31 testes) e `git diff --check` passaram. O frontend tambem foi aberto localmente em `/motoboy`; sem sessao, exibiu o estado esperado de sessao ausente.

**Validacoes pos-deploy:** Smoke publico confirmou `GET /api/deliveries/active` sem token -> `401 AUTH_REQUIRED`, frontend `/motoboy` -> `200` e bundle publicado contendo `/api/deliveries/active`. Smoke autenticado confirmou que o motoboy dono ve sua propria corrida `aceita` em modo somente leitura, com `destination_address` e `notes` apenas pos-aceite; outro motoboy recebe `data: null`; motoboy offline retorna `COURIER_OFFLINE`; pendente retorna `USER_PENDING`; bloqueado retorna `USER_BLOCKED`; role errado retorna `FORBIDDEN_ROLE`. A listagem pre-aceite continuou sem `destination_address`, `notes`, `store_id` ou `courier_id`, expondo apenas `store.name` e `store.address`. Cleanup retornou `completed`. Nenhum SQL, migration, RLS, grant ou policy foi executado ou alterado.

**Fora do escopo preservado:** mutation/transicoes `coletada`/`em_transito`/`entregue`, cancelamento, realtime, push/Web Push/VAPID, cron/expiracao automatica, historico do motoboy, historico admin, pagamentos, Storage e dados operacionais adicionais.

## 2026-05-16 - FATIA 3 MOTOBOY STATUS OPERACIONAL

**Fase:** fundacao/auth-operacao
**O que aconteceu:** Implementado localmente o contrato real de online/offline do motoboy. O backend ganhou `GET /api/couriers/me/status` e `PATCH /api/couriers/me/status`, ambos protegidos por `authenticate`, `requireActiveUser` e `requireRoles('motoboy')`. O perfil e sempre derivado por `couriers.user_id = domainUser.id`; o PATCH aceita body strict `{ isOnline: boolean }`, atualiza somente `is_online` e retorna apenas `{ is_online, updated_at }`. Nenhum `courier_id` vem do client e nenhum campo de nome/documento/Storage/entrega/loja entra na resposta. Nenhum SQL, migration, RLS, grant ou policy foi criado ou alterado.
**Arquivos modificados (backend):** `src/app.ts`, `src/routes/courier.routes.ts`, `src/controllers/courier.controller.ts`, `src/services/courier.service.ts`, `src/validators/courier.validators.ts`, `tests/courier-routes.spec.ts`, `CONTRACTS.md`, `STATUS.md`, `DECISIONS.md`, `LEARNINGS.md`, `LOG.md`
**Agentes utilizados:** Camisa10, ImpactValidator, SecurityValidator, TestEngineer, Documentador
**Status:** fechado localmente; deploy/smoke de producao pendentes

**Gates:** ImpactValidator aprovado (mudanca aditiva, contrato novo, sem schema/infra, front tratado em fatia cruzada); SecurityValidator aprovado (auth/role/status existentes, perfil derivado da sessao, body strict, resposta sem PII/secrets, sem logs sensiveis).

**Validacoes:** Backend `npm run typecheck` passou. Backend `npm test` passou com 7 arquivos e 85 testes. Nenhum secret, token, cookie ou header sensivel foi impresso.

**Fora do escopo:** localizacao/GPS, disponibilidade por raio, realtime, push/Web Push/VAPID, cron, historico de presenca, transicoes pos-aceite, cancelamento, pagamentos, Storage e documentos.

## 2026-05-16 - FATIA 3 MOTOBOY POS-DEPLOY PRODUCAO APROVADA

**Fase:** fundacao/auth-operacao
**O que aconteceu:** Backend publicado em producao no commit `001a1c6` e frontend publicado no commit `3201d77`. O backend `https://entreggoback.vercel.app` e o frontend `https://entreggo.vercel.app/motoboy` foram validados em producao. O smoke autenticado usou usuarios/perfis/loja/entrega ficticios temporarios e cleanup em `finally`, sem imprimir token, cookie, header Authorization, service role ou secret.
**Arquivos criados:** nenhum
**Arquivos modificados:** `STATUS.md`, `LOG.md`
**Status:** fechado em producao

**Validacoes locais antes dos commits:** Backend `npm run typecheck`, `npm test` (7 arquivos, 85 testes), `npm run lint`, `npm run build` e `git diff --check` passaram. Frontend `npm run typecheck`, `npm test` (5 arquivos, 36 testes), `npm run lint`, `npm run build` e `git diff --check` passaram.

**Validacoes pos-deploy:** Smoke publico confirmou `GET /api/couriers/me/status` sem token -> `401 AUTH_REQUIRED`, `PATCH /api/couriers/me/status` sem token -> `401 AUTH_REQUIRED`, `/motoboy` -> `200` e bundle publicado contendo `/api/couriers/me/status`. Smoke autenticado confirmou: motoboy ativo criado com `is_online=false`; `GET /api/couriers/me/status` retornou somente `{ is_online, updated_at }`; offline negou `/api/deliveries/active` com `COURIER_OFFLINE`; `PATCH { isOnline: true }` retornou `is_online=true`; online, `/api/deliveries/active` retornou a fixture aceita; `PATCH { isOnline: false }` retornou `is_online=false`; payloads com `courier_id`, `user_id`, `is_online` ou campo extra retornaram `VALIDATION_ERROR`; role errada retornou `FORBIDDEN_ROLE`; pendente retornou `USER_PENDING`; bloqueado retornou `USER_BLOCKED`. No frontend de producao autenticado, antes de clicar em "Ficar online", os recursos observados foram `/api/auth/me` e `/api/couriers/me/status`, com zero chamadas a `/api/deliveries/active` e `/api/deliveries/available`; apos o clique, a UI exibiu "Corrida aceita" e chamou `/api/deliveries/active`. Cleanup retornou `completed`.

**Fora do escopo preservado:** SQL/migration/RLS/grants/policies, PII nova, realtime, push/Web Push/VAPID, polling, cron, localizacao/GPS, disponibilidade por raio, historico de presenca, transicoes pos-aceite, cancelamento, pagamentos, Storage e documentos.
