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
