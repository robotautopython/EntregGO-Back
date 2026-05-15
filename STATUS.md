# STATUS - EntregGO

## Estado Atual

**Fase:** fundacao/auth-operacao
**Ultima atualizacao:** 2026-05-15
**Atualizado por:** Codex/Camisa10

## Em Andamento

- [ ] Planejar migracao segura do frontend para versao corrigida do Next.js antes de qualquer PWA/push real.
- [ ] Manter dashboards, pagamentos, documentos e historico de entregas como escopo futuro ate validacao de Security/Performance.

## Proximas Tarefas

- [ ] Rodar validadores de seguranca antes de auth real, uploads, policies RLS finais e push.
- [ ] Rodar validadores de performance antes de aceite concorrente real, cron, queries de dashboard e realtime.
- [ ] Especificar `/api/admin/payments` e `mark-paid` somente com auditoria e Security Validator.
- [ ] Especificar pipeline de Storage com signed URLs somente com Security Validator por LGPD/PII.

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

## Bloqueios

- Projeto ainda nao possui uploads, push real, realtime real, dashboards complexos ou historico admin de entregas.
- Frontend ainda possui vulnerabilidade residual em `next@14.2.35`/PostCSS interno; correcao exige migracao major do Next e deve ser tratada em ciclo proprio.
- Logo/paleta inicial definida no frontend em `design.md`; refinamentos visuais seguem pendentes para telas internas.
- Credenciais Vercel/VAPID ainda pendentes e nao devem ser hardcoded.
- Abas admin de documentos, entregas, pagamentos e notas seguem bloqueadas por falta de backend, schema/auditoria ou validadores especializados.

## Saude do Projeto

**Build:** passando em backend e frontend
**Lint:** passando em backend e frontend
**Testes:** passando no backend; frontend ainda sem suite de testes
**Deploy:** frontend e backend publicados em Vercel
**Riscos abertos:** 4
