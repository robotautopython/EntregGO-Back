# F_Promoted — Agentes Graduados da Fabrica

> Esta pasta contem todos os agentes criados pela AgentForge que provaram
> seu valor em campo e foram promovidos pelo usuario.
>
> Diferente dos agentes estaticos da `.codex/`, estes nasceram dinamicos,
> foram testados em execucao real, validados pelo WorkAuditor, e
> aperfeicoados antes de entrar aqui.

---

## Regras desta Pasta

1. **So entra quem foi promovido.** Nenhum agente e salvo aqui diretamente.
   O caminho e: Fabrica → execucao → WorkAuditor aprova → usuario autoriza
   → AgentComposer refina → salva aqui.

2. **Todo agente tem um diario.** Cada agente promovido ganha um arquivo
   `[nome]_DIARY.md` que registra cada execucao, resultado e aprendizado.

3. **Existe uma memoria coletiva.** O arquivo `COLLECTIVE_MEMORY.md` acumula
   aprendizados de TODOS os agentes promovidos. Quando um agente novo e
   criado pela fabrica, o ContextScanner le este arquivo para nao repetir
   erros que outros agentes ja cometeram.

4. **Agentes evoluem aqui.** Quando o WorkAuditor detecta falha, o agente
   e atualizado in-place com versao incrementada. O diario registra o que
   mudou e por que.

5. **Agentes aposentados saem daqui para `_archive/`.** Nunca deletados.

---

## Estrutura

```
.codex/F_Promoted/
├── README.md                          ← este arquivo
├── COLLECTIVE_MEMORY.md               ← aprendizados de todos os agentes
├── REGISTRY.md                        ← catalogo dos agentes promovidos
│
├── [Prefixo]_Agent_[Nome].md          ← agente promovido
├── [Prefixo]_Agent_[Nome]_DIARY.md    ← diario de execucoes desse agente
│
├── [outro agente].md
├── [outro agente]_DIARY.md
│
└── ...
```

---

## Como um Agente Chega Aqui

```
1. Fabrica cria agente (EFEMERO)
2. Agente executa tasks
3. WorkAuditor valida → APROVADO
4. Foreman pergunta: "Promover?"
5. Usuario diz SIM
6. AgentComposer aplica refinamentos finais
7. Arquivo salvo em .codex/F_Promoted/
8. Diario criado: [nome]_DIARY.md (entrada #1: criacao)
9. REGISTRY.md atualizado
10. COLLECTIVE_MEMORY.md atualizado (se houve aprendizado na primeira execucao)
11. AGENTS.md da raiz atualizado (pipeline, prefixo, mencao)
```

---

## Mencao no Chat

Para usar um agente promovido:
```
@FP.[nome]
```

Exemplo:
```
@FP.PaymentFlowBuilder
@FP.AccessibilityAuditor
@FP.MigrationPlanner
```

Para listar todos os promovidos:
```
"Quais agentes promovidos eu tenho?"
→ Foreman le REGISTRY.md e responde
```
