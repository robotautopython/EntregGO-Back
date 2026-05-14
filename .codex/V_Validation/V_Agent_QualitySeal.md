# Agent_QualitySeal.md

> Cole o trecho abaixo no final do `AGENTS.md` que já existe na raiz do seu projeto.
> Esta é a seção do **selo de qualidade final**, complementar aos três validadores
> anteriores (`security_validator`, `performance_validator`, `impact_validator`).

---

## Selo de qualidade final pós-implementação (`final_validator`)

Quando este projeto receber um pedido de:

- "Valida o que foi feito" / "Confere se ficou bom"
- "Isso está pronto para mergear?" / "Pronto para deploy?"
- "Tem bug aí?" / "Fugiu do escopo?" / "Introduziu gambiarra?"
- Revisão de PR / branch / diff antes do merge

**Spawn o subagente `final_validator`** como ÚLTIMO portão antes do merge/deploy.

O `final_validator` opera em `read-only` e revisa **DIFFS** (não arquivos inteiros)
contra o **plano de referência** (PLANO.md, commit messages, ou ticket linkado).

### O que ele verifica

**ETAPA 1 — Scope drift**
Compara plano vs entregue. Marca cada item como DONE / PARTIAL / NOT DONE / OUT OF SCOPE.
Detecta scope creep (mudança que entrou sem estar no plano).

**ETAPA 2 — 7 eixos de validação técnica**
1. **Corretude lógica** — bugs sutis, off-by-one, null handling, async errado, encoding
2. **Regressão e quebra de fluxo** — consumidores afetados, breaking changes silenciosas
3. **Duplicação e coerência** — alinhado com convenções do projeto
4. **Gambiarra e dívida técnica** — TODO sem ticket, hack, hardcode, eslint-disable
5. **Regressão de segurança** — sinais de risco; delega ao `security_validator` se necessário
6. **Regressão de performance** — N+1, loops aninhados; delega ao `performance_validator` se necessário
7. **Testabilidade e cobertura** — testes existem? cobrem o caminho de erro?

### Vereditos possíveis

- ✅ **APROVADO** — pronto para merge/deploy
- 🟡 **APROVADO COM RESSALVA** — ajustes pequenos antes do merge
- ❌ **REPROVADO** — bug crítico / regressão / scope drift grave; bloqueio
- ❓ **QUESTIONAR / DELEGAR** — sinal de segurança ou performance que exige validador
  especializado antes do merge

### Como invocar

```
Use o final_validator para revisar o que foi implementado neste branch antes do merge.
```

ou após qualquer ciclo de implementação:

```
Spawn final_validator. O plano de referência é PLANO.md.
```

---

## O quarteto completo — pipeline de qualidade

Você agora tem **quatro agentes** trabalhando em momentos distintos do ciclo:

```
                        FLUXO COMPLETO

   ┌─────────────────────────────────────────────────────┐
   │  ANTES DA IMPLEMENTAÇÃO                             │
   │                                                     │
   │  1. impact_validator                                │
   │     └─ mapeia impacto do plano em 9 dimensões       │
   │     └─ recomenda delegar quando detecta superfície  │
   │           sensível ↓                                │
   │                                                     │
   │  2. security_validator (se delegado)                │
   │     └─ valida segurança do plano                    │
   │                                                     │
   │  3. performance_validator (se delegado)             │
   │     └─ valida performance do plano                  │
   │                                                     │
   └─────────────────────────────────────────────────────┘
                          ↓
   ┌─────────────────────────────────────────────────────┐
   │  IMPLEMENTAÇÃO                                      │
   │  Worker do Codex executa o plano aprovado.          │
   └─────────────────────────────────────────────────────┘
                          ↓
   ┌─────────────────────────────────────────────────────┐
   │  DEPOIS DA IMPLEMENTAÇÃO                            │
   │                                                     │
   │  4. final_validator                                 │
   │     └─ selo de qualidade final, revisão de diff     │
   │     └─ pode delegar de volta para os especialistas  │
   │           se detectar regressão de segurança/perf   │
   │                                                     │
   └─────────────────────────────────────────────────────┘
                          ↓
                   MERGE / DEPLOY
```

### Quando cada um é acionado

| Momento | Agente | Triggera |
|---|---|---|
| ANTES da impl. | `impact_validator` | Sempre — primeiro passo de qualquer plano |
| ANTES da impl. | `security_validator` | Plano toca auth, PII, upload, render input externo |
| ANTES da impl. | `performance_validator` | Plano toca cache, índice, hot path, paralelização |
| DEPOIS da impl. | `final_validator` | **SEMPRE** — último passo antes do merge/deploy |
| DEPOIS da impl. (delegação) | `security_validator` | `final_validator` detectou regressão de segurança no diff |
| DEPOIS da impl. (delegação) | `performance_validator` | `final_validator` detectou regressão de performance no diff |

### Regras de bloqueio do quarteto

- ❌ **REJEITADO/REPROVADO** em qualquer agente = bloqueio rígido
- 🟡 **APROVADO COM RESSALVA** = ressalvas são pré-requisito
- ❓ **QUESTIONAR/DELEGAR** = aguarde validador correspondente
- ✅ **APROVADO em todos os aplicáveis** = liberado

### Exemplo de fluxo end-to-end

> Pedido: "Adicionar endpoint de cobrança via Stripe para o checkout."

**Pré-implementação:**
1. Você pede um plano para outro agente → `PLANO.md` é gerado.
2. `impact_validator` valida o plano: identifica que toca PAGAMENTO (regulado, PCI-DSS).
   Veredito: ❓ DELEGAR para `security_validator`.
3. `security_validator` valida: chave do Stripe via env, mascaramento de last4 em logs,
   sem hardcode, etc. Veredito: 🟡 APROVADO COM RESSALVA (lista de pré-requisitos).
4. `performance_validator` não é necessário (sem cache/hot path/índice).

**Implementação:**
5. Codex worker implementa conforme o plano + ressalvas.

**Pós-implementação:**
6. `final_validator` revisa o diff:
   - Scope check: o plano dizia 1 endpoint, foram entregues 1 endpoint + alteração no
     UserService. **OUT OF SCOPE** detectado. Questiona se é necessário.
   - Eixo 1: detecta `user.stripeId` sem null guard (CRÍTICO).
   - Eixo 5: `console.log(user)` vaza PII (CRÍTICO).
   - Veredito: ❌ REPROVADO.

7. Worker corrige e roda `final_validator` novamente. Aprovado → merge.

Esse é o fluxo: **nada vai para produção sem passar pelo selo final.**
