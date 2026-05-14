# Guia Completo do Codex Agent Kit

Gerado em: 2026-05-05

Este guia mapeia todos os arquivos da pasta `.codex`, explica o papel de cada agente/template/referencia e indica quando usar cada um para ser mais assertivo.

## Visao Geral

- Arquivos do kit mapeados: 41
- Artefatos do guia: 2
- Total descrito neste material: 43

## Como Usar em 5 Passos
1. Comece por `AGENTS.md` para entender prefixos, pipeline e politica anti-alucinacao.
2. Use `C10_Maestro/C10_CAMISA10.md` para orquestrar projeto, fase e brief.
3. Antes de implementar, passe pelo `C_Cetico` e pelo `V_ImpactValidator` quando houver risco cross-stack.
4. Acione especialistas: `D_Design`, `BI_Dashboards`, `M_MobilePlaystore`, `E_Environment`, `S_Seguranca`, `P_Performance`, `Q_Quality` ou `O_Observability`.
5. Feche com `V_FinalValidator` e `C10_DOCUMENTADOR` para validar e documentar.

## Mapa por Pasta
### ROOT - Raiz da pasta .codex
- Funcao: Ponto de entrada, inventario e documentacao principal do kit.
- Melhor uso: Use primeiro para entender o kit, padroes de nomenclatura, pipeline e auditorias.
  - `AGENTS.md`: Catalogo mestre do kit
  - `AUDIT_AGENTES.md`: Auditoria evolutiva dos agentes
  - `GUIA_COMPLETO_CODEX_AGENT_KIT.md`: Fonte editavel deste guia
  - `GUIA_COMPLETO_CODEX_AGENT_KIT.pdf`: PDF final do guia

### A_Architecture - Arquitetura cross-stack
- Funcao: Define fronteiras entre frontend, backend, banco, workers e integracoes.
- Melhor uso: Use antes de features que mexem em API, schema, auth, filas, webhooks ou decisoes estruturais.
  - `A_Architecture/A_Agent_CrossStackArchitect.md`: Agente arquiteto cross-stack

### BI_Dashboards - Business Intelligence e dashboards
- Funcao: Cria dashboards bonitos, legiveis, seguros e conectados a dados confiaveis.
- Melhor uso: Use para KPIs, graficos, relatorios, filtros por data, metricas, tabelas e analises executivas.
  - `BI_Dashboards/BI_Agent_DashboardDesigner.md`: Agente BI e dashboard designer
  - `BI_Dashboards/BI_Template_DASHBOARD_QA.md`: Checklist QA para dashboards
  - `BI_Dashboards/BI_Template_DASHBOARD_SPEC.md`: Especificacao de dashboard
  - `BI_Dashboards/BI_Template_METRIC_DICTIONARY.md`: Dicionario de metricas

### C10_Maestro - Maestro do projeto
- Funcao: Orquestra fases, memoria, status, decisoes, aprendizados e fluxo de agentes.
- Melhor uso: Use no inicio de qualquer projeto ou ciclo significativo.
  - `C10_Maestro/C10_Agent_ProjectRules.md`: Template de AGENTS.md do projeto
  - `C10_Maestro/C10_CAMISA10.md`: Agente maestro Camisa10
  - `C10_Maestro/C10_DECISIONS.md`: Template de decisoes ADR
  - `C10_Maestro/C10_DOCUMENTADOR.md`: Agente documentador
  - `C10_Maestro/C10_LEARNINGS.md`: Template de aprendizados
  - `C10_Maestro/C10_LOG.md`: Template de log cronologico
  - `C10_Maestro/C10_STATUS.md`: Template de status atual

### C_Cetico - Cetico cirurgico
- Funcao: Confronta planos contra codigo real antes de implementar.
- Melhor uso: Use antes de toda feature, refatoracao, schema, auth, pagamento, deploy ou mudanca arriscada.
  - `C_Cetico/C_Agent_Cetico.md`: Agente Cetico Cirurgico

### D_Design - Design e UI/UX
- Funcao: Melhora interface preservando logica, acessibilidade, responsividade e contratos.
- Melhor uso: Use para telas, componentes, design system, UX, frontend visual e polimento.
  - `D_Design/D_Agent_Design.md`: Agente design e frontend visual

### E_Environment - Variaveis de ambiente e Vercel
- Funcao: Audita e alinha secrets/configs entre frontend e backend separados.
- Melhor uso: Use antes de deploy, ao configurar envs ou quando CORS/API/secrets falharem.
  - `E_Environment/E_Agent_Environment.md`: Agente environment/Vercel
  - `E_Environment/E_Reference_CrossValidation.md`: Referencia de cross-validation
  - `E_Environment/E_Reference_Nomenclature.md`: Referencia de nomenclatura env
  - `E_Environment/E_Reference_VercelAPI.md`: Referencia API Vercel

### M_MobilePlaystore - Mobile React Native + Expo
- Funcao: Planeja apps nativos Expo com backend separado, offline, seguranca e Play Store.
- Melhor uso: Use para criar ou evoluir app mobile Android/Play Store com documentacao e release profissional.
  - `M_MobilePlaystore/M_Agent_MobilePlaystore.md`: Agente mobile Play Store
  - `M_MobilePlaystore/M_Template_MOBILE_OFFLINE.md`: Template offline mobile
  - `M_MobilePlaystore/M_Template_MOBILE_PROJECT.md`: Template projeto mobile
  - `M_MobilePlaystore/M_Template_MOBILE_RELEASE.md`: Template release mobile
  - `M_MobilePlaystore/M_Template_MOBILE_SECURITY.md`: Template seguranca mobile
  - `M_MobilePlaystore/M_Template_MOBILE_TEST_PLAN.md`: Template testes mobile

### O_Observability - Observabilidade e deploy
- Funcao: Garante logs, metricas, alertas, health checks, smoke tests e rollback.
- Melhor uso: Use antes de producao, em incidentes ou ao criar jobs, webhooks e fluxos criticos.
  - `O_Observability/O_Agent_DeployObservability.md`: Agente operacao e observabilidade

### PR_PromptOps - Prompt engineering cirurgico
- Funcao: Transforma ideias e pedidos em prompts precisos, seguros e verificaveis.
- Melhor uso: Use sempre que quiser gerar ou melhorar um prompt para Codex, Claude, ChatGPT ou outro agente.
  - `PR_PromptOps/PR_Agent_PromptRefiner.md`: Agente refinador de prompts
  - `PR_PromptOps/PR_Template_PROMPT_BRIEF.md`: Template de briefing de prompt

### P_Performance - Performance e escala
- Funcao: Valida gargalos, cache, queries, listas grandes, hot paths e custo operacional.
- Melhor uso: Use quando houver lentidao, otimizacao, alto volume, dashboard pesado ou query critica.
  - `P_Performance/P_Agent_PerformanceValidator.toml`: Validador de performance

### Q_Quality - QA e testes
- Funcao: Converte risco em matriz de testes, criterios de aceite e regressao.
- Melhor uso: Use antes de fechar feature, release, dashboard, app mobile ou fluxo critico.
  - `Q_Quality/Q_Agent_TestEngineer.md`: Agente QA/testes

### S_Seguranca - Seguranca
- Funcao: Valida correcoes e planos que tocam auth, PII, secrets, permissoes e superficie de ataque.
- Melhor uso: Use em uploads, pagamentos, usuarios, multi-tenant, headers, tokens e dados sensiveis.
  - `S_Seguranca/S_Agent_SecurityValidator.toml`: Validador de seguranca

### T_Templates - Templates gerais
- Funcao: Fornece modelos de PROJECT, STATUS, LOG, DECISIONS e LEARNINGS.
- Melhor uso: Use no onboarding de qualquer projeto novo.
  - `T_Templates/T_Template_DECISIONS.md`: Template ADR geral
  - `T_Templates/T_Template_LEARNINGS.md`: Template aprendizados geral
  - `T_Templates/T_Template_LOG.md`: Template log geral
  - `T_Templates/T_Template_PROJECT.md`: Template PROJECT.md
  - `T_Templates/T_Template_STATUS.md`: Template STATUS.md

### V_Validation - Validacao de impacto e selo final
- Funcao: Revisa planos antes e diffs depois, com foco em impacto, escopo, regressao e qualidade.
- Melhor uso: Use como portao antes de implementar e antes de merge/deploy.
  - `V_Validation/V_Agent_FinalValidator.toml`: Validador final
  - `V_Validation/V_Agent_ImpactGuard.md`: Guia de uso do impact validator
  - `V_Validation/V_Agent_ImpactValidator.toml`: Validador de impacto
  - `V_Validation/V_Agent_QualitySeal.md`: Guia do selo final

## Arquivos Detalhados
### `A_Architecture/A_Agent_CrossStackArchitect.md`
- Pasta: `A_Architecture`
- Papel: Agente arquiteto cross-stack
- O que faz de melhor: Define fronteiras, contratos, responsabilidades e riscos entre camadas do sistema.
- Melhor situacao de uso: Use quando uma decisao pode afetar frontend, backend, banco, workers ou integracoes.

### `AGENTS.md`
- Pasta: `ROOT`
- Papel: Catalogo mestre do kit
- O que faz de melhor: Resume prefixos, pipeline, regras globais, politica anti-alucinacao e como mencionar cada agente.
- Melhor situacao de uso: Use como primeira leitura da pasta .codex e como referencia para escolher o agente certo.

### `AUDIT_AGENTES.md`
- Pasta: `ROOT`
- Papel: Auditoria evolutiva dos agentes
- O que faz de melhor: Documenta validacao arquivo por arquivo, lacunas encontradas, melhorias aplicadas e veredito do kit.
- Melhor situacao de uso: Use para entender por que cada agente existe e quais problemas foram corrigidos.

### `BI_Dashboards/BI_Agent_DashboardDesigner.md`
- Pasta: `BI_Dashboards`
- Papel: Agente BI e dashboard designer
- O que faz de melhor: Cria dashboards com metricas definidas, filtros de calendario inicio/fim, legendas, seguranca e performance.
- Melhor situacao de uso: Use para dashboards executivos, operacionais, financeiros, produto, suporte e relatorios.

### `BI_Dashboards/BI_Template_DASHBOARD_QA.md`
- Pasta: `BI_Dashboards`
- Papel: Checklist QA para dashboards
- O que faz de melhor: Valida dados, visual, seguranca, permissao, multi-tenant e performance de dashboards.
- Melhor situacao de uso: Use antes de entregar dashboard ou relatorio.

### `BI_Dashboards/BI_Template_DASHBOARD_SPEC.md`
- Pasta: `BI_Dashboards`
- Papel: Especificacao de dashboard
- O que faz de melhor: Modelo para documentar objetivo, fontes de dados, filtros, metricas, layout, estados, performance e seguranca.
- Melhor situacao de uso: Use antes de implementar qualquer dashboard relevante.

### `BI_Dashboards/BI_Template_METRIC_DICTIONARY.md`
- Pasta: `BI_Dashboards`
- Papel: Dicionario de metricas
- O que faz de melhor: Fonte da verdade para formula, origem, unidade, data, permissoes e regras de cada metrica.
- Melhor situacao de uso: Use para impedir KPI inventado ou inconsistente.

### `C10_Maestro/C10_Agent_ProjectRules.md`
- Pasta: `C10_Maestro`
- Papel: Template de AGENTS.md do projeto
- O que faz de melhor: Base para criar o AGENTS.md da raiz de cada projeto, com stack, regras e subagentes.
- Melhor situacao de uso: Use no onboarding para fazer o Codex carregar regras do projeto automaticamente.

### `C10_Maestro/C10_CAMISA10.md`
- Pasta: `C10_Maestro`
- Papel: Agente maestro Camisa10
- O que faz de melhor: Orquestra fases, agentes, briefing, validacao, documentacao e continuidade do projeto.
- Melhor situacao de uso: Use no inicio de uma sessao, feature nova ou ciclo de entrega.

### `C10_Maestro/C10_DECISIONS.md`
- Pasta: `C10_Maestro`
- Papel: Template de decisoes ADR
- O que faz de melhor: Modelo de registro de decisoes arquiteturais com contexto, alternativas e consequencias.
- Melhor situacao de uso: Use quando uma escolha tecnica mudar o futuro do sistema.

### `C10_Maestro/C10_DOCUMENTADOR.md`
- Pasta: `C10_Maestro`
- Papel: Agente documentador
- O que faz de melhor: Fecha ciclos atualizando LOG, DECISIONS, LEARNINGS e STATUS.
- Melhor situacao de uso: Use depois que o validador aprovar uma entrega.

### `C10_Maestro/C10_LEARNINGS.md`
- Pasta: `C10_Maestro`
- Papel: Template de aprendizados
- O que faz de melhor: Modelo para registrar erros, padroes, armadilhas e descobertas reutilizaveis.
- Melhor situacao de uso: Use apos bugs, incidentes, revert, descoberta tecnica ou padrao novo.

### `C10_Maestro/C10_LOG.md`
- Pasta: `C10_Maestro`
- Papel: Template de log cronologico
- O que faz de melhor: Modelo para registrar fatos de ciclos e entregas.
- Melhor situacao de uso: Use para manter historico objetivo do projeto.

### `C10_Maestro/C10_STATUS.md`
- Pasta: `C10_Maestro`
- Papel: Template de status atual
- O que faz de melhor: Modelo para fase, tarefas abertas, concluidas, bloqueios e saude do projeto.
- Melhor situacao de uso: Use para saber rapidamente onde o projeto esta.

### `C_Cetico/C_Agent_Cetico.md`
- Pasta: `C_Cetico`
- Papel: Agente Cetico Cirurgico
- O que faz de melhor: Revisa planos contra codigo real, rastreia consumidores, evidencia lacunas e bloqueia risco.
- Melhor situacao de uso: Use antes de implementar qualquer coisa relevante.

### `D_Design/D_Agent_Design.md`
- Pasta: `D_Design`
- Papel: Agente design e frontend visual
- O que faz de melhor: Evolui interfaces preservando logica, fluxos, handlers, acessibilidade e performance.
- Melhor situacao de uso: Use para UX, UI, componentes, layout, design system e refinamento visual.

### `E_Environment/E_Agent_Environment.md`
- Pasta: `E_Environment`
- Papel: Agente environment/Vercel
- O que faz de melhor: Audita variaveis de frontend e backend, valida CORS/API URL/secrets e aplica mudancas com seguranca.
- Melhor situacao de uso: Use em configuracao Vercel, deploy, envs, secrets e projetos desacoplados.

### `E_Environment/E_Reference_CrossValidation.md`
- Pasta: `E_Environment`
- Papel: Referencia de cross-validation
- O que faz de melhor: Checklist para conferir consistencia entre frontend e backend em Vercel.
- Melhor situacao de uso: Use junto com o agente de environment para evitar API URL/CORS/secrets errados.

### `E_Environment/E_Reference_Nomenclature.md`
- Pasta: `E_Environment`
- Papel: Referencia de nomenclatura env
- O que faz de melhor: Mapeia variaveis por servico e por lado frontend/backend.
- Melhor situacao de uso: Use para decidir se uma variavel e publica, privada, frontend ou backend.

### `E_Environment/E_Reference_VercelAPI.md`
- Pasta: `E_Environment`
- Papel: Referencia API Vercel
- O que faz de melhor: Documenta endpoints, payloads, erros e cuidados ao gerenciar env vars pela API.
- Melhor situacao de uso: Use ao automatizar auditoria ou escrita de variaveis na Vercel.

### `M_MobilePlaystore/M_Agent_MobilePlaystore.md`
- Pasta: `M_MobilePlaystore`
- Papel: Agente mobile Play Store
- O que faz de melhor: Planeja React Native + Expo com backend separado, offline, seguranca, performance, EAS e release.
- Melhor situacao de uso: Use para criar app nativo Android/Expo profissional.

### `M_MobilePlaystore/M_Template_MOBILE_OFFLINE.md`
- Pasta: `M_MobilePlaystore`
- Papel: Template offline mobile
- O que faz de melhor: Define estrategia offline, fila local, retry, idempotencia e conflitos.
- Melhor situacao de uso: Use quando o app precisa funcionar sem internet.

### `M_MobilePlaystore/M_Template_MOBILE_PROJECT.md`
- Pasta: `M_MobilePlaystore`
- Papel: Template projeto mobile
- O que faz de melhor: Documenta visao, stack, fluxos, dados locais e arquitetura do app.
- Melhor situacao de uso: Use no inicio de app React Native/Expo.

### `M_MobilePlaystore/M_Template_MOBILE_RELEASE.md`
- Pasta: `M_MobilePlaystore`
- Papel: Template release mobile
- O que faz de melhor: Checklist de EAS, Play Store, versionamento, Data Safety e smoke test.
- Melhor situacao de uso: Use antes de subir build interno, fechado ou producao.

### `M_MobilePlaystore/M_Template_MOBILE_SECURITY.md`
- Pasta: `M_MobilePlaystore`
- Papel: Template seguranca mobile
- O que faz de melhor: Classifica dados locais, permissoes, logs, SecureStore e protecao de PII.
- Melhor situacao de uso: Use antes de persistir dados no device ou pedir permissoes.

### `M_MobilePlaystore/M_Template_MOBILE_TEST_PLAN.md`
- Pasta: `M_MobilePlaystore`
- Papel: Template testes mobile
- O que faz de melhor: Matriz de testes para device, offline, rede lenta, permissoes e regressao critica.
- Melhor situacao de uso: Use antes de release mobile.

### `O_Observability/O_Agent_DeployObservability.md`
- Pasta: `O_Observability`
- Papel: Agente operacao e observabilidade
- O que faz de melhor: Planeja logs, metricas, traces, alertas, health checks, smoke tests e rollback.
- Melhor situacao de uso: Use antes de producao ou em fluxos criticos.

### `P_Performance/P_Agent_PerformanceValidator.toml`
- Pasta: `P_Performance`
- Papel: Validador de performance
- O que faz de melhor: Valida cache, query, hot path, payload, concorrencia, custo e baseline antes de aprovar otimizacao.
- Melhor situacao de uso: Use quando desempenho, escala, dados grandes ou custo estiverem em jogo.

### `PR_PromptOps/PR_Agent_PromptRefiner.md`
- Pasta: `PR_PromptOps`
- Papel: Agente refinador de prompts
- O que faz de melhor: Transforma pedidos em prompts cirurgicos com contexto, escopo, validacoes, seguranca e performance.
- Melhor situacao de uso: Use sempre que quiser pedir algo melhor para um agente.

### `PR_PromptOps/PR_Template_PROMPT_BRIEF.md`
- Pasta: `PR_PromptOps`
- Papel: Template de briefing de prompt
- O que faz de melhor: Modelo para estruturar objetivo, contexto, evidencias, escopo, riscos e prompt final.
- Melhor situacao de uso: Use para criar pedidos assertivos e reutilizaveis.

### `Q_Quality/Q_Agent_TestEngineer.md`
- Pasta: `Q_Quality`
- Papel: Agente QA/testes
- O que faz de melhor: Cria matriz de testes por risco e cobre caminhos feliz, erro, permissao, concorrencia e regressao.
- Melhor situacao de uso: Use antes de fechar feature, dashboard, mobile ou deploy.

### `S_Seguranca/S_Agent_SecurityValidator.toml`
- Pasta: `S_Seguranca`
- Papel: Validador de seguranca
- O que faz de melhor: Revisa correcoes/planos de seguranca, evita falso positivo, regressao e aumento de superficie.
- Melhor situacao de uso: Use em auth, PII, secrets, upload, permissoes, headers e pagamentos.

### `T_Templates/T_Template_DECISIONS.md`
- Pasta: `T_Templates`
- Papel: Template ADR geral
- O que faz de melhor: Modelo simples para registrar decisoes arquiteturais.
- Melhor situacao de uso: Use no onboarding ou ao criar DECISIONS.md do projeto.

### `T_Templates/T_Template_LEARNINGS.md`
- Pasta: `T_Templates`
- Papel: Template aprendizados geral
- O que faz de melhor: Modelo para registrar erros, padroes, armadilhas, otimizacoes e descobertas.
- Melhor situacao de uso: Use para alimentar memoria reutilizavel.

### `T_Templates/T_Template_LOG.md`
- Pasta: `T_Templates`
- Papel: Template log geral
- O que faz de melhor: Modelo cronologico de acontecimentos do projeto.
- Melhor situacao de uso: Use como LOG.md inicial.

### `T_Templates/T_Template_PROJECT.md`
- Pasta: `T_Templates`
- Papel: Template PROJECT.md
- O que faz de melhor: Modelo de visao, arquitetura, fronteiras, fluxos criticos e regras de producao.
- Melhor situacao de uso: Use na criacao de qualquer projeto novo.

### `T_Templates/T_Template_STATUS.md`
- Pasta: `T_Templates`
- Papel: Template STATUS.md
- O que faz de melhor: Modelo de fase, tarefas, bloqueios e saude do projeto.
- Melhor situacao de uso: Use para acompanhar estado atual.

### `V_Validation/V_Agent_FinalValidator.toml`
- Pasta: `V_Validation`
- Papel: Validador final
- O que faz de melhor: Revisa diff contra plano, detecta scope drift, bugs, regressao, gambiarra, seguranca, performance e testes.
- Melhor situacao de uso: Use como ultimo portao antes de merge/deploy.

### `V_Validation/V_Agent_ImpactGuard.md`
- Pasta: `V_Validation`
- Papel: Guia de uso do impact validator
- O que faz de melhor: Explica quando acionar impacto, seguranca e performance antes de implementar.
- Melhor situacao de uso: Use como documentacao humana do pipeline de validacao.

### `V_Validation/V_Agent_ImpactValidator.toml`
- Pasta: `V_Validation`
- Papel: Validador de impacto
- O que faz de melhor: Mapeia impacto cross-stack de planos antes de codigo existir.
- Melhor situacao de uso: Use para validar plano, RFC, feature ou proposta antes da execucao.

### `V_Validation/V_Agent_QualitySeal.md`
- Pasta: `V_Validation`
- Papel: Guia do selo final
- O que faz de melhor: Explica o pipeline completo de qualidade e o papel do final validator.
- Melhor situacao de uso: Use para orientar revisoes antes de merge/deploy.

### `GUIA_COMPLETO_CODEX_AGENT_KIT.md`
- Pasta: `ROOT`
- Papel: Fonte editavel deste guia
- O que faz de melhor: Versao Markdown do material para leitura rapida, ajustes futuros e versionamento.
- Melhor situacao de uso: Use quando quiser atualizar o guia sem mexer direto no PDF.

### `GUIA_COMPLETO_CODEX_AGENT_KIT.pdf`
- Pasta: `ROOT`
- Papel: PDF final do guia
- O que faz de melhor: Material bonito e didatico para consultar o kit inteiro e explicar cada arquivo.
- Melhor situacao de uso: Use como manual oficial da pasta .codex.
