# Codex Agent Kit - Catalogo Mestre

Este arquivo e o ponto de entrada da pasta `.codex/`. Use-o como catalogo e como contrato minimo de qualidade para qualquer projeto que receba este kit.

Importante: para o Codex carregar instrucoes automaticamente ao trabalhar na raiz do projeto, copie ou adapte `C10_Maestro/C10_Agent_ProjectRules.md` para `PROJECT_ROOT/AGENTS.md`. A pasta `.codex/` funciona como biblioteca de agentes, templates e validadores para mencionar no chat.

## Padrao de Nomenclatura

Todo agente deve usar o prefixo semantico no nome da pasta e do arquivo:

| Prefixo | Area | Exemplo |
|---|---|---|
| `C10_` | Maestro, orquestracao e memoria do projeto | `C10_Maestro/C10_CAMISA10.md` |
| `A_` | Arquitetura cross-stack | `A_Architecture/A_Agent_CrossStackArchitect.md` |
| `B_` | Backend, API e dominio | reservado |
| `BI_` | Business Intelligence, metricas e dashboards | `BI_Dashboards/BI_Agent_DashboardDesigner.md` |
| `D_` | Design, UX e frontend visual | `D_Design/D_Agent_Design.md` |
| `E_` | Environment, secrets e deploy vars | `E_Environment/E_Agent_Environment.md` |
| `M_` | Mobile React Native + Expo | `M_MobilePlaystore/M_Agent_MobilePlaystore.md` |
| `O_` | Observabilidade, deploy e operacao | `O_Observability/O_Agent_DeployObservability.md` |
| `P_` | Performance e escalabilidade | `P_Performance/P_Agent_PerformanceValidator.toml` |
| `PR_` | Prompt engineering, briefing e refinamento de pedidos | `PR_PromptOps/PR_Agent_PromptRefiner.md` |
| `Q_` | QA, testes e confiabilidade | `Q_Quality/Q_Agent_TestEngineer.md` |
| `S_` | Seguranca | `S_Seguranca/S_Agent_SecurityValidator.toml` |
| `T_` | Templates reutilizaveis | `T_Templates/T_Template_PROJECT.md` |
| `V_` | Validacao de impacto e selo final | `V_Validation/V_Agent_ImpactValidator.toml` |

Regra: nomes de pasta e arquivo devem evitar acentos e espacos para funcionar bem em Windows, Linux, CI/CD, scripts e automacoes.

## Pipeline Recomendado

1. `C10_Maestro`: entende o projeto, define fase, monta brief e coordena.
2. `A_Architecture`: valida desenho desacoplado, contratos, fronteiras e riscos antes de codar.
3. `V_Validation/impact_validator`: revisa plano e impacto cross-stack.
4. `S_Seguranca/security_validator`: entra quando tocar auth, PII, secrets, upload, headers, permissoes ou pagamentos.
5. `P_Performance/performance_validator`: entra quando tocar hot path, cache, queries, listas grandes, imagens, filas, concorrencia ou custo.
6. Agente executor especializado: `D_Design`, `E_Environment`, `M_MobilePlaystore`, backend do projeto, etc.
7. `BI_Dashboards`: entra quando a entrega envolver metricas, relatorios, indicadores, graficos ou dashboards.
8. `PR_PromptOps`: entra quando o usuario pedir para gerar, lapidar ou transformar um pedido em prompt cirurgico.
9. `Q_Quality`: cria/ajusta plano de testes e cenarios de regressao.
10. `V_Validation/final_validator`: revisa diff final antes de merge/deploy.
11. `C10_DOCUMENTADOR`: registra LOG, STATUS, ADRs e aprendizados.

## Regras Globais Extraidas do Guia Vibe Coding

Todo agente desta pasta deve proteger a base oculta do iceberg, nao apenas a ponta visual do MVP.

- Projetar para sistemas desacoplados: frontend, backend e banco com contratos claros.
- Nunca dar acesso de escrita/exclusao em banco de producao para agente autonomo.
- Separar ambientes local, homologacao/staging e producao.
- Tratar entrada externa como nao confiavel: validar, sanitizar e autorizar.
- Usar idempotencia em acoes criticas, especialmente pagamentos, webhooks, filas e retries.
- Aplicar deduplicacao contra duplo clique, reenvio de formulario e eventos repetidos.
- Usar operacoes atomicas/transacoes quando uma mudanca depende de varias etapas.
- Implementar retry com exponential backoff, limite de tentativas e timeout.
- Prevenir race conditions com locks, constraints, transacoes ou filas quando houver concorrencia.
- Paginar listas e logs; nunca carregar tudo por padrao.
- Medir antes de otimizar quando possivel; otimizar hot paths, nao preferencias esteticas.
- Incluir observabilidade: logs estruturados, metricas, traces e alertas para fluxos criticos.
- Rodar validacoes possiveis antes de fechar: build, lint, typecheck, testes e smoke test.

## Politica de Execucao no Codex

- Antes de editar: ler arquivos completos relevantes, mapear dependencias e proteger mudancas do usuario.
- Antes de dar veredito: separar fato observado, inferencia e lacuna. Vereditos tecnicos precisam citar arquivos, simbolos, linhas ou comandos que sustentam a conclusao.
- Nenhum agente deve aprovar plano, diff, arquitetura, seguranca, performance ou release apenas por padrao generico. Se faltam arquivos ou contexto, o veredito correto e `QUESTIONAR`.
- Durante a implementacao: escopo pequeno, sem refatoracao lateral e sem dependencias pesadas sem justificativa.
- Depois de editar: validar com comandos reais do projeto quando existirem.
- Ao encontrar erro preexistente: documentar claramente, sem mascarar como sucesso.
- Ao tocar secrets: nunca imprimir valores, nunca criar `NEXT_PUBLIC_` com segredo, nunca hardcodar credencial.

## Padrao Anti-Alucinacao

Todo agente cirurgico deve trabalhar com esta cadeia:

1. Ler contexto do projeto.
2. Localizar arquivos e fluxos afetados.
3. Ler codigo real antes de opinar.
4. Rastrear consumidores e contratos.
5. Confrontar proposta contra evidencia.
6. Declarar lacunas explicitamente.
7. Emitir veredito proporcional ao que foi comprovado.

## Como Mencionar

Use o prefixo para marcar rapido no chat:

- `@C10` para orquestrar.
- `@A` para arquitetura.
- `@BI` para dashboards, metricas e business intelligence.
- `@D` para design/frontend visual.
- `@E` para environment/Vercel/secrets.
- `@M` para mobile Expo/Play Store.
- `@P` para performance.
- `@PR` para transformar ideias em prompts cirurgicos.
- `@Q` para testes.
- `@S` para seguranca.
- `@V` para validacao de impacto/final.
