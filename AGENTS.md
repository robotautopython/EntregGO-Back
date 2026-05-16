# AGENTS - EntregGO

## Contexto

Voce esta trabalhando no projeto EntregGO. Leia `PROJECT.md`, `STATUS.md`, `LOG.md` e `DECISIONS.md` antes de propor ou implementar mudancas.

## Stack

- Frontend: Next.js 14+ App Router, React, TypeScript, Tailwind CSS, shadcn/ui, PWA/Service Worker.
- Backend: Node.js 20+ LTS, Express, TypeScript, Supabase JS, Web Push, Zod.
- Banco: Supabase PostgreSQL com RLS, Storage e Realtime.
- Deploy: Vercel em dois projetos separados.

## Regras

- Nenhum secret no frontend.
- Frontend nunca acessa banco diretamente, exceto Supabase Auth e Realtime documentados.
- Backend concentra regra de negocio, validacao server-side e autorizacao.
- API deve manter resposta padrao `{ success, data, message }` ou `{ success, error }`.
- Mudancas em auth, PII, uploads, RLS, secrets ou push exigem Security Validator.
- Mudancas em concorrencia de aceite, indices, queries, cron, realtime ou listas grandes exigem Performance Validator.
- Criterios de aceite incluem build, lint/typecheck e testes quando existirem.
- Sempre que o operador precisar rodar SQL manualmente, a resposta deve trazer uma secao destacada `ACAO MANUAL NECESSARIA - SQL` com: ambiente alvo, caminho absoluto do arquivo SQL, bloco completo do SQL a executar, motivo da execucao, resultado esperado no painel/CLI, validacao seguinte e aviso explicito para nao colar secrets ou dados reais.

## Agentes Principais

- Camisa10: `.codex/C10_Maestro/C10_CAMISA10.md`
- CrossStackArchitect: `.codex/A_Architecture/A_Agent_CrossStackArchitect.md`
- Cetico: `.codex/C_Cetico/C_Agent_Cetico.md`
- ImpactValidator: `.codex/V_Validation/V_Agent_ImpactValidator.toml`
- PromptRefiner: `.codex/PR_PromptOps/PR_Agent_PromptRefiner_v2.md`
- SecurityValidator: `.codex/S_Seguranca/S_Agent_SecurityValidator.toml`
- PerformanceValidator: `.codex/P_Performance/P_Agent_PerformanceValidator.toml`
- TestEngineer: `.codex/Q_Quality/Q_Agent_TestEngineer.md`
- FinalValidator: `.codex/V_Validation/V_Agent_FinalValidator.toml`
- Documentador: `.codex/C10_Maestro/C10_DOCUMENTADOR.md`
