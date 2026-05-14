# SPEC - Implementacao Inicial EntregGO

**Data:** 2026-05-14
**Fase:** concepcao -> fundacao
**Base de evidencia:** documental. Ainda nao ha codigo, manifests, migrations ou testes nos diretorios `EntregGO-Back` e `EntregGO-Front`.

## Evidencias Lidas

- `EntregGO_Documentacao_Sistema.md`: visao funcional, usuarios, fluxos, endpoints, regras de negocio e checklist.
- `EntregGO_Documentacao_Tecnica.md`: stack, envs, estrutura de pastas, seguranca, contratos, SQL, performance e logs.
- `.codex/C10_Maestro/C10_CAMISA10.md`: governanca, fases e fluxo C10 -> Cetico -> Validador -> Documentador.
- `.codex/A_Architecture/A_Agent_CrossStackArchitect.md`: fronteiras e saida arquitetural.
- `.codex/C_Cetico/C_Agent_Cetico.md`: criterios de revisao antes de implementar.
- `.codex/V_Validation/V_Agent_ImpactValidator.toml`: eixos de impacto cross-stack.
- `.codex/PR_PromptOps/PR_Agent_PromptRefiner_v2.md`: formato dos prompts cirurgicos.

## Decisao Arquitetural Recomendada

**Contexto:** EntregGO sera uma plataforma web de entregas sob demanda com admin, loja e motoboy. Nao tera pagamento integrado, chat, app nativo, reputacao ou rastreamento em tempo real.

**Fronteiras:**
- Frontend: Next.js, UI, PWA, Supabase Auth client, Supabase Realtime para entregas e chamadas REST para a API.
- Backend: Express API, RBAC, validacao Zod, regras de negocio, uploads, push, jobs e service role do Supabase.
- Banco: PostgreSQL/Supabase com enums, constraints, indices, RLS e migrations.
- Workers/jobs: expiracao de solicitacoes aguardando apos 60 segundos.
- Terceiros: Supabase, Vercel e Web Push/VAPID.

**Contratos:** API REST sob `/api/*`, resposta padrao de sucesso/erro, status HTTP documentados, DTOs validados por Zod no back e tipos equivalentes no front.

**Riscos:** auth/RLS/secrets/uploads/PII, race condition no aceite, push em massa para motoboys online, cron em ambiente serverless, expiracao concorrente, listas administrativas sem paginacao.

**Validacoes obrigatorias:** Security Validator antes de auth/uploads/RLS/push; Performance Validator antes de aceite concorrente/indices/cron/realtime; FinalValidator antes de considerar tarefas concluidas.

**Trade-offs:** Manter dois repositorios reduz acoplamento e protege secrets, mas exige disciplina de contrato e versionamento entre front e back.

**Proximo agente:** Cetico + ImpactValidator para validar cada plano antes da implementacao.

## Divisao de Implementacao

### M-00 - Governanca e Fundacao de Repos

**Camadas:** DOC, INFRA
**Objetivo:** Criar base minima dos dois projetos com manifests, scripts, estrutura de pastas, env examples e regras de qualidade.

**Backend:**
- `package.json`, `tsconfig.json`, `vercel.json`, `.env.example`
- `src/index.ts`
- pastas `routes`, `controllers`, `services`, `middlewares`, `validators`, `jobs`, `config`, `types`, `utils`
- healthcheck `/api/health`

**Frontend:**
- Next.js 14 App Router + TypeScript + Tailwind
- `src/app`, `src/components`, `src/hooks`, `src/lib`, `src/types`, `public`
- `.env.example`
- tela inicial simples sem fakear fluxos ainda

**Criterio de aceite:** `npm install`, build/typecheck/lint funcionando nos dois projetos.

### M-01 - Banco e Supabase Base

**Camadas:** BANCO, BACK, INFRA, SEGURANCA
**Objetivo:** Criar migrations iniciais com enums, tabelas, indices e policies RLS.

**Escopo:** `users`, `stores`, `couriers`, `payments`, `delivery_requests`, `push_subscriptions`.

**Ressalva:** Exige Security Validator por tocar RLS, auth, PII e documentos.

### M-02 - Auth, Cadastro e Aprovacao

**Camadas:** FRONT, BACK, BANCO, CONTRATO, SEGURANCA
**Objetivo:** Registro de loja/motoboy, login/logout, status pendente/bloqueado/ativo, aprovacao pelo admin.

**Ressalva:** Exige Security Validator por auth, senha, JWT, role/status e upload de documentos.

### M-02C - Identidade Visual e Landing Page

**Camadas:** FRONT, DOC
**Objetivo:** Definir `design.md` no frontend e transformar a rota `/` na landing page inicial de cadastro/login, usando a logo oficial e a paleta laranja/azul da marca.

**Escopo:** landing institucional-operacional, CTAs para `/registro` e `/login`, tokens visuais no Tailwind/CSS, asset da logo em `public/brand`, documentacao e status atualizados.

**Fora de escopo:** Nao implementar dashboard, push real, realtime real, Service Worker real, nova regra de negocio, novo endpoint ou bypass de aprovacao.

**Ressalva:** Mudancas visuais devem preservar handlers de login/cadastro, contrato com backend e fronteira de seguranca do frontend.

### M-03 - Admin Operacional

**Camadas:** FRONT, BACK, BANCO, CONTRATO
**Objetivo:** Dashboard, listagens paginadas, filtros, aprovacao, bloqueio/desbloqueio e pagamento interno.

**Ressalva:** Exige paginacao, filtros indexados e logs de auditoria para acoes sensiveis.

### M-04 - Fluxo de Entrega Loja -> Motoboy

**Camadas:** FRONT, BACK, BANCO, CONTRATO, PERFORMANCE
**Objetivo:** Loja solicita entrega; motoboys online veem solicitacoes; primeiro aceite ganha; status avanca ate entregue.

**Ressalva:** Exige Performance Validator por concorrencia, update condicional, realtime, polling fallback e expiracao.

### M-05 - Push/PWA

**Camadas:** FRONT, BACK, INTEGRACAO, SEGURANCA, PERFORMANCE
**Objetivo:** Service Worker, subscription, envio Web Push, clique abrindo painel do motoboy, fallback visual/sonoro no painel.

**Ressalva:** Exige Security Validator por subscriptions e secrets VAPID; Performance Validator por envio em lote.

### M-06 - Hardening, Testes e Deploy

**Camadas:** QA, INFRA, OBSERVABILIDADE
**Objetivo:** testes, CI, logs, Vercel dev/prod, smoke tests e roteiro de rollback.

## Dependencias Recomendada - Backend

Runtime:
`express`, `@supabase/supabase-js`, `web-push`, `zod`, `jsonwebtoken`, `multer`, `cors`, `helmet`, `express-rate-limit`, `dotenv`, `node-cron`

Dev:
`typescript`, `tsx`, `@types/node`, `@types/express`, `@types/cors`, `@types/jsonwebtoken`, `@types/multer`, `@types/web-push`, `@types/node-cron`, `vitest`, `supertest`, `@types/supertest`, `eslint`, `prettier`

Scripts esperados:
- `dev`: rodar API local com `tsx watch`
- `build`: compilar TypeScript
- `start`: rodar build compilado
- `typecheck`: `tsc --noEmit`
- `test`: vitest
- `lint`: eslint

## Dependencias Recomendada - Frontend

Runtime:
`next`, `react`, `react-dom`, `@supabase/supabase-js`, `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`, `lucide-react`, `sonner`, `date-fns`, `recharts`, `next-pwa`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`

Dev:
`typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next`, `tailwindcss`, `postcss`, `autoprefixer`, `prettier`

Scripts esperados:
- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start`
- `lint`: `next lint` ou `eslint`
- `typecheck`: `tsc --noEmit`

## Veredito do Cetico

**Veredito:** APROVADO COM RESSALVAS

**Resumo:** O plano de fundacao e coerente com a documentacao e respeita as fronteiras front/back/banco. A aprovacao e documental porque ainda nao ha codigo real.

**Ressalvas obrigatorias:**
- Nao implementar auth, uploads, RLS, secrets, push ou PII sem Security Validator.
- Nao implementar aceite concorrente, cron de expiracao, realtime/polling ou queries de dashboard sem Performance Validator.
- Nao criar contratos de API sem DTOs e formato de erro padronizado.
- Nao usar secrets reais em `.env.example`.
- Revalidar contra codigo real apos scaffolding.

## Veredito do ImpactValidator

**Veredito geral:** APROVADO COM RESSALVAS para scaffolding; QUESTIONAR/VALIDAR para features sensiveis.

**Impacto cross-stack:**
- Contrato publico: AFETA-OK se endpoints forem criados com schema e resposta padrao.
- Interface interna: AFETA-OK se camadas routes/controllers/services/validators forem mantidas.
- Banco/schema: AFETA-FALTA ate migrations e RLS serem escritas.
- Frontend/consumo: AFETA-OK se front consumir apenas API REST, Auth e Realtime permitidos.
- Jobs/workers: AFETA-FALTA ate definir comportamento de cron na Vercel.
- Integracoes: AFETA-FALTA ate configurar Supabase e VAPID.
- Infra/operacional: AFETA-FALTA ate `.env.example`, Vercel e ambientes dev/prod existirem.
- Testes: AFETA-FALTA ate Vitest/smoke tests.
- Documentacao: AFETA-OK com este spec e governanca inicial.

## Prompt Cirurgico - Backend

**Tipo:** implementacao segura
**Agente recomendado:** Codex Worker + Cetico antes de executar + FinalValidator ao terminar
**Objetivo:** Criar a fundacao do backend `entreggo-api` com dependencias, estrutura, configuracoes e healthcheck, sem implementar regras de negocio ainda.

**Tarefa para o agente:**
"""
Voce esta no diretorio `C:\Users\israe\Downloads\EntregGO\EntregGO-Back`. Leia `PROJECT.md`, `STATUS.md`, `AGENTS.md`, `SPEC_IMPLEMENTACAO_ENTREGGO.md`, `EntregGO_Documentacao_Sistema.md` e `EntregGO_Documentacao_Tecnica.md` antes de editar.

Objetivo: criar a fundacao do backend EntregGO API em Node.js 20+, Express e TypeScript.

Escopo permitido:
- Criar `package.json`, `tsconfig.json`, `vercel.json`, `.env.example`.
- Criar estrutura `src/index.ts`, `src/routes`, `src/controllers`, `src/services`, `src/middlewares`, `src/validators`, `src/jobs`, `src/config`, `src/types`, `src/utils`.
- Instalar dependencias runtime: `express`, `@supabase/supabase-js`, `web-push`, `zod`, `jsonwebtoken`, `multer`, `cors`, `helmet`, `express-rate-limit`, `dotenv`, `node-cron`.
- Instalar dependencias dev: `typescript`, `tsx`, `@types/node`, `@types/express`, `@types/cors`, `@types/jsonwebtoken`, `@types/multer`, `@types/web-push`, `@types/node-cron`, `vitest`, `supertest`, `@types/supertest`, `eslint`, `prettier`.
- Criar healthcheck `GET /api/health` retornando o padrao `{ success: true, data, message }`.
- Configurar CORS a partir de `FRONTEND_URL`, Helmet, JSON parser, rate limit basico e handler padrao de erro.

Fora de escopo:
- Nao implementar auth real, uploads, push real, migrations, RLS, cadastro, painel admin ou fluxo de entrega.
- Nao inserir secrets reais.
- Nao conectar em Supabase se as envs reais nao existirem.

Regras:
- Backend concentra regras de negocio e secrets.
- `.env.example` deve conter apenas nomes e placeholders.
- Validacao futura deve usar Zod em `src/validators`.
- Respostas devem seguir o contrato documentado.
- Codigo em ingles; documentacao em portugues.

Validacoes obrigatorias:
- `npm install`
- `npm run typecheck`
- `npm run build`
- `npm test` se houver teste criado

Resposta esperada:
- Liste arquivos criados.
- Informe comandos executados e resultado.
- Informe lacunas pendentes para M-01/M-02.
"""

**Criterios de aceite:**
- Backend instala dependencias sem erro.
- TypeScript compila.
- Healthcheck existe e segue contrato.
- `.env.example` separa secrets privados do backend.

## Prompt Cirurgico - Frontend

**Tipo:** implementacao segura
**Agente recomendado:** Codex Worker + Cetico antes de executar + FinalValidator ao terminar
**Objetivo:** Criar a fundacao do frontend `entreggo-front` com Next.js 14+, Tailwind, shadcn-ready, PWA-ready e estrutura de paineis.

**Tarefa para o agente:**
"""
Voce esta no diretorio `C:\Users\israe\Downloads\EntregGO\EntregGO-Front`. Leia `EntregGO_Documentacao_Sistema.md`, `EntregGO_Documentacao_Tecnica.md` e `.codex/C10_Maestro/C10_CAMISA10.md` antes de editar. Se os arquivos `PROJECT.md`, `STATUS.md`, `AGENTS.md` e `SPEC_IMPLEMENTACAO_ENTREGGO.md` nao existirem neste diretorio, use as copias do backend como fonte de contexto ou solicite que sejam replicadas.

Objetivo: criar a fundacao do frontend EntregGO em Next.js 14+ App Router, React, TypeScript e Tailwind.

Escopo permitido:
- Criar `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `.env.example`.
- Criar estrutura `public`, `src/app`, `src/components`, `src/hooks`, `src/lib`, `src/types`, `src/styles`.
- Instalar runtime: `next`, `react`, `react-dom`, `@supabase/supabase-js`, `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`, `lucide-react`, `sonner`, `date-fns`, `recharts`, `next-pwa`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`.
- Instalar dev: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next`, `tailwindcss`, `postcss`, `autoprefixer`, `prettier`.
- Criar App Router minimo com layout raiz, pagina inicial simples EntregGO e estrutura preparada para `/login`, `/registro/loja`, `/registro/motoboy`, `/admin`, `/loja`, `/motoboy`, `/aguardando-aprovacao`.
- Criar `src/lib/api.ts` com Axios apontando para `NEXT_PUBLIC_API_URL`.
- Criar `src/lib/supabase.ts` usando apenas envs publicas.
- Preparar `public/manifest.json` e placeholder para Service Worker sem implementar push real ainda.

Fora de escopo:
- Nao implementar telas completas, auth real, upload, push real, realtime ou dashboards.
- Nao acessar banco diretamente pelo frontend.
- Nao inserir secrets reais.
- Nao criar design final antes da logo/paleta final.

Regras:
- Frontend pode usar Supabase Auth e Realtime conforme documentado, mas dados de negocio devem passar pela API.
- Estados de loading/erro devem ser previstos nos componentes base quando surgirem.
- UI deve respeitar Next.js App Router, Tailwind e shadcn/ui-ready.
- Codigo em ingles; textos de usuario em portugues.

Validacoes obrigatorias:
- `npm install`
- `npm run typecheck`
- `npm run build`
- `npm run lint` se configurado

Resposta esperada:
- Liste arquivos criados.
- Informe comandos executados e resultado.
- Informe lacunas pendentes para auth, paineis e PWA.
"""

**Criterios de aceite:**
- Frontend instala dependencias sem erro.
- Build/typecheck passam.
- Env publica nao contem secrets privados.
- Estrutura inicial segue a documentacao tecnica.
