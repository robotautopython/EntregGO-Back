# Auditoria Detalhada dos Agentes

Data da auditoria: 2026-05-05

Atualizacao de lapidacao: 2026-05-05

Base analisada:
- Pasta `C:\Users\israe\Downloads\.codex`
- PDF `C:\Users\israe\Downloads\guia_desenvolvimento_vibe_coding.pdf`

## Diagnostico Geral

O conjunto ja tinha uma boa base de postura: agentes ceticos, foco em nao quebrar fluxo, validacao antes/depois e preocupacao real com frontend/backend separados. O ponto fraco era organizacional: caminhos inconsistentes, referencias quebradas, ausencia de agentes citados, falta de catalogo raiz e pouco acoplamento explicito aos principios de producao do guia do iceberg.

Na segunda lapidacao, o ponto corrigido foi ainda mais importante: reduzir
alucinacao operacional. O `C_Cetico` agora exige leitura de codigo real,
inventario de evidencias, rastreamento de consumidores e confronto plano vs codigo
antes de emitir veredito. A mesma regra foi propagada para arquitetura, mobile,
QA, observabilidade, performance, environment e design.

Mudancas aplicadas:
- Pastas renomeadas para prefixo padronizado: `D_`, `E_`, `C10_`, `S_`, `V_`.
- Arquivos criticos renomeados para comecar com o prefixo do agente.
- Criado `AGENTS.md` como catalogo mestre da pasta `.codex`.
- Criados agentes faltantes: arquitetura, cetico, mobile, observabilidade, performance e QA.
- Criados templates reutilizaveis para onboarding do Camisa10.
- Removido acento de pasta (`Segurança` -> `S_Seguranca`) para portabilidade.

## Validacao Arquivo por Arquivo

### `AGENTS.md`

Status: criado e lapidado com padrao anti-alucinacao.

Funcao: catalogo mestre, padrao de nomenclatura e regras globais.

Motivo: sem um ponto de entrada, a pasta dependia da memoria do usuario e de referencias soltas. Agora existe uma fonte rapida para saber qual agente usar, qual prefixo seguir e quais principios de producao sao obrigatorios.

### `D_Design/D_Agent_Design.md`

Status: bom, lapidado para exigir evidencias lidas na resposta final.

O que faz bem:
- Protege funcionalidade acima de estetica.
- Pede leitura do arquivo completo antes de alterar UI.
- Cobre acessibilidade, responsividade, estados e performance visual.

Riscos encontrados:
- O titulo antigo sugeria que deveria ficar como `AGENTS.md` na raiz; isso confundia biblioteca de agente com arquivo automatico do Codex.
- Algumas regras visuais sao opinativas demais para qualquer tipo de sistema. Em SaaS operacional, por exemplo, cards grandes e visual premium podem atrapalhar densidade.

Recomendacao:
- Usar este agente para UI/UX, mas sempre subordinado ao padrao do produto existente.
- Em projeto operacional, priorizar densidade, clareza e consistencia sobre estetica editorial.

### `E_Environment/E_Agent_Environment.md`

Status: bom, renomeado e lapidado com protocolo anti-alucinacao.

O que faz bem:
- Entende frontend e backend como projetos Vercel separados.
- Trata variaveis interdependentes com cross-check.
- Tem boas regras para mascarar token e confirmar escrita.

Riscos encontrados:
- Muito focado em Next.js + Express na Vercel; agora o catalogo deixa claro que e especialista Vercel, nao regra universal para qualquer infra.
- Referencias internas antigas apontavam para `references/*`; os arquivos reais agora estao na propria pasta `E_Environment`.

Recomendacao:
- Em projetos fora da Vercel, usar como checklist conceitual, nao como executor.

### `E_Environment/E_Reference_CrossValidation.md`

Status: bom como referencia.

O que faz bem:
- Cobre API URL, CORS, secrets no lado errado, Supabase, environments e variaveis automaticas.

Riscos encontrados:
- Depende de valores que a API Vercel normalmente nao retorna. O agente deve pedir confirmacao humana sem tentar expor segredo.

Recomendacao:
- Manter como referencia do `E_Agent_Environment.md`.

### `E_Environment/E_Reference_Nomenclature.md`

Status: bom como referencia.

O que faz bem:
- Deixa clara a fronteira `NEXT_PUBLIC_` vs backend.
- Mapeia variaveis por servico e lado correto.

Riscos encontrados:
- `NEXTAUTH_SECRET` no frontend e correto apenas quando NextAuth roda no proprio app Next.js server-side. Em arquitetura totalmente desacoplada, a regra precisa ser avaliada pelo stack real.

Recomendacao:
- O agente deve confirmar onde a autenticacao roda antes de decidir lado da variavel.

### `E_Environment/E_Reference_VercelAPI.md`

Status: util, mas deve ser tratado como referencia que pode mudar.

O que faz bem:
- Centraliza endpoints e formatos.
- Alerta sobre redeploy apos alterar env.

Riscos encontrados:
- APIs externas mudam. Antes de executar contra Vercel em data futura, confirmar na documentacao oficial quando houver duvida.

Recomendacao:
- Usar com validacao atualizada quando for operar em producao.

### `C10_Maestro/C10_CAMISA10.md`

Status: forte conceitualmente, atualizado para enviar evidencias e lacunas ao Cetico.

O que faz bem:
- Atua como maestro de ciclo, fase, memoria e documentacao.
- Cria disciplina de status, log, decisoes e aprendizados.

Riscos encontrados:
- Exigia Cético e Validador, mas o Cético nao existia como arquivo.
- Referenciava templates que nao existiam.
- Dizia "nunca assumir", mas em Codex real o agente precisa equilibrar autonomia com perguntas apenas quando necessario.

Recomendacao:
- Usar como orquestrador principal, agora com `C_Cetico`, `V_Validation`, `Q_Quality` e templates criados.

### `C10_Maestro/C10_Agent_ProjectRules.md`

Status: template importante, renomeado e atualizado para exigir evidencia em validacoes.

O que faz bem:
- E o melhor candidato para virar `PROJECT_ROOT/AGENTS.md` em cada projeto.
- Define convencoes, stack, estrutura e regras de comportamento.

Riscos encontrados:
- Estava em `.codex/MAESTRO`, mas afirmava ser lido automaticamente pelo Codex. Isso so e verdade se copiado/adaptado para a raiz do projeto como `AGENTS.md`.

Recomendacao:
- No onboarding, gerar `PROJECT_ROOT/AGENTS.md` a partir deste template.

### `C10_Maestro/C10_DOCUMENTADOR.md`

Status: bom.

O que faz bem:
- Fecha ciclo com LOG, DECISIONS, LEARNINGS e STATUS.
- Diferencia fatos, decisoes e aprendizados.

Riscos encontrados:
- Pode virar burocracia se acionado em microalteracoes sem impacto. A regra ideal: documentar todo ciclo significativo, decisao arquitetural, incidente, bug ou aprendizado reutilizavel.

Recomendacao:
- Manter obrigatorio para entregas reais, flexivel para pequenos ajustes cosmeticos.

### `C10_Maestro/C10_DECISIONS.md`

Status: template util.

O que faz bem:
- Usa ADR e registra consequencias.

Riscos encontrados:
- Como arquivo dentro da biblioteca, nao deve representar o status de um projeto real.

Recomendacao:
- Usar `T_Templates/T_Template_DECISIONS.md` para novos projetos e manter este como exemplo legado.

### `C10_Maestro/C10_LEARNINGS.md`

Status: template util.

O que faz bem:
- Transforma erros em conhecimento reaproveitavel.

Riscos encontrados:
- Sem tags padronizadas, fica dificil buscar depois.

Recomendacao:
- Usar tags como `security`, `performance`, `deploy`, `mobile`, `database`, `ux`, `testing`.

### `C10_Maestro/C10_LOG.md`

Status: template simples.

O que faz bem:
- Cria historico cronologico.

Riscos encontrados:
- Pouco detalhado para auditoria de incidentes.

Recomendacao:
- Para entregas maiores, incluir comandos executados, hashes/branches e links de PR/deploy.

### `C10_Maestro/C10_STATUS.md`

Status: template simples.

O que faz bem:
- Mantem estado atual visivel.

Riscos encontrados:
- Metricas estao genericas.

Recomendacao:
- Em cada projeto, adaptar metricas para o dominio: uptime, cobertura, bugs abertos, endpoints criticos, telas prontas, builds verdes.

### `S_Seguranca/S_Agent_SecurityValidator.toml`

Status: bom e TOML valido.

O que faz bem:
- Ceticismo correto: valida correcoes de seguranca, nao inventa vulnerabilidade.
- Opera read-only.
- Bloqueia mudancas que aumentam superficie de ataque.

Riscos encontrados:
- O nome da pasta com acento quebrava portabilidade; corrigido.
- Deve ser acionado tambem para arquitetura inicial de auth, PII, permissoes, uploads, pagamentos e secrets, nao apenas "fixes".

Recomendacao:
- Manter como gate de seguranca antes de implementacao e tambem no final se o `final_validator` detectar regressao.

### `V_Validation/V_Agent_ImpactGuard.md`

Status: bom como guia de uso.

O que faz bem:
- Explica quando acionar `impact_validator`.
- Define pipeline de delegacao para seguranca e performance.

Riscos encontrados:
- Citava `performance_validator`, que nao existia. Corrigido com novo agente `P_Performance`.

Recomendacao:
- Manter como documentacao humana do pipeline.

### `V_Validation/V_Agent_QualitySeal.md`

Status: bom como guia de uso.

O que faz bem:
- Define o selo final pos-implementacao.
- Reforca revisao por diff e plano de referencia.

Riscos encontrados:
- Tambem citava `performance_validator` ausente.

Recomendacao:
- Usar sempre antes de merge/deploy de mudancas relevantes.

### `V_Validation/V_Agent_ImpactValidator.toml`

Status: excelente base e TOML valido.

O que faz bem:
- Mapeia impacto cross-stack.
- Evita over-engineering e duplicacao.
- Atua antes de escrever codigo.

Riscos encontrados:
- Regras muito rigidas podem atrasar ajustes triviais. O Camisa10 deve aplicar proporcionalidade.

Recomendacao:
- Obrigatorio para plano de feature, refatoracao, schema, API, auth, pagamento, deploy, performance ou arquitetura.

### `V_Validation/V_Agent_FinalValidator.toml`

Status: excelente base e TOML valido.

O que faz bem:
- Revisa diff final contra escopo.
- Foca bugs sutis, regressao, scope creep, seguranca, performance e testes.

Riscos encontrados:
- Deve receber sempre o plano de referencia; sem plano, vira revisao generica e perde forca.

Recomendacao:
- Sempre chamar com: objetivo original, arquivos alterados, comandos rodados e riscos conhecidos.

## Agentes Faltantes Criados

### `C_Cetico/C_Agent_Cetico.md`

Motivo: o Camisa10 exigia Cético antes de implementar, mas ele nao existia. Agora existe o revisor de plano que questiona necessidade, escopo, riscos, alternativas e criterios de aceite.

Lapidacao aplicada: virou `Cetico Cirurgico`. Ele nao pode aprovar sem ler codigo
real, rastrear dependencias, citar evidencias e declarar lacunas. Se nao tiver
acesso aos arquivos, o veredito correto e `QUESTIONAR`.

### `BI_Dashboards/BI_Agent_DashboardDesigner.md`

Motivo: faltava um agente especialista em BI e dashboards. Este agente cobre
metricas, fonte da verdade, filtros de periodo com calendario inicio/fim,
legendas, tooltips, design visual, seguranca de dados, performance de query,
permissoes, multi-tenant, exportacao e estados de UI.

Templates criados:
- `BI_Template_DASHBOARD_SPEC.md`
- `BI_Template_METRIC_DICTIONARY.md`
- `BI_Template_DASHBOARD_QA.md`

### `P_Performance/P_Agent_PerformanceValidator.toml`

Motivo: era citado pelos validadores, mas ausente. Agora cobre cache, queries, hot paths, concorrencia, payload, mobile, imagens, filas, custos e metricas.

Lapidacao aplicada: passou a exigir codigo do hot path, baseline/evidencia e
distincao entre fato observado e inferencia.

### `PR_PromptOps/PR_Agent_PromptRefiner.md`

Motivo: faltava um agente esperto para transformar pedidos e ideias em prompts
cirurgicos. Ele entra quando o usuario pedir para gerar ou melhorar prompt.

O que faz bem:
- Le contexto do projeto antes de escrever o prompt.
- Exige leitura de codigo real quando a tarefa toca implementacao.
- Gera prompts de investigacao, plano, implementacao segura ou validacao.
- Protege contratos, seguranca, performance, padroes locais e duplicacao.
- Declara lacunas para evitar comando cego.

Template criado:
- `PR_Template_PROMPT_BRIEF.md`

### `M_MobilePlaystore/M_Agent_MobilePlaystore.md`

Motivo: pedido explicito. Atua como Camisa10 mobile para React Native + Expo, com backend separado, offline-first, Play Store, EAS, seguranca, performance e documentacao.

Lapidacao aplicada: em app existente, exige leitura de configs Expo/EAS, navegacao,
features afetadas, storage, sync, permissoes e testes antes de aprovar abordagem.

### `A_Architecture/A_Agent_CrossStackArchitect.md`

Motivo: faltava um agente para definir fronteiras, contratos e arquitetura desacoplada antes da implementacao.

Lapidacao aplicada: passou a exigir leitura de documentos, estrutura real,
rotas, services, schemas, models, clients e configuracoes antes de recomendar
arquitetura em projeto existente.

### `Q_Quality/Q_Agent_TestEngineer.md`

Motivo: havia validacao, mas nao havia dono explicito de estrategia de testes.

Lapidacao aplicada: agora precisa ler plano/diff, arquivos alterados, testes
existentes e comandos reais antes de propor matriz de testes.

### `O_Observability/O_Agent_DeployObservability.md`

Motivo: o guia do iceberg exige logs, metricas, traces, alertas, deploy seguro e operacao de producao.

Lapidacao aplicada: agora precisa ler deploy config, env examples, CI/CD, scripts,
endpoints/jobs/webhooks criticos e instrumentacao existente antes de aprovar operacao.

## Veredito Final

O kit agora esta muito mais proximo de uma base reutilizavel para qualquer projeto desacoplado. A melhoria principal foi transformar um conjunto de bons arquivos isolados em um sistema: catalogo, pipeline, validadores, templates, agentes faltantes e regras de producao derivadas do guia.
