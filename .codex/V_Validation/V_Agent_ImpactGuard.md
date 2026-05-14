# Agent_ImpactGuard.md

> Cole o trecho abaixo no final do `AGENTS.md` que já existe na raiz do seu projeto.
> Se você já adicionou os trechos dos validadores anteriores (`security_validator` e
> `performance_validator`), substitua a seção "Validação cruzada" pela versão consolidada
> abaixo, que agora contempla os três agentes trabalhando em conjunto.

---

## Validação geral de planos de implementação (`impact_validator`)

Quando este projeto receber:

- Um arquivo de plano (`PLANO.md`, `PLANO_IMPLEMENTACAO.md`, `IMPLEMENTACAO.md`, `RFC.md`, `FEATURE.md`)
- Sugestão de implementação de outro agente (Codex, Claude, Gemini, etc.)
- Plano colado direto no chat
- Pedido do usuário como "valida esse plano", "isso vai quebrar?", "isso afeta algo?",
  "tem algo parecido no projeto?", "vale a pena implementar?"

**Spawn o subagente `impact_validator`** antes de qualquer implementação.

O `impact_validator` opera em `read-only` e faz **mapeamento completo de impacto** em 9
dimensões cross-stack:

1. Contrato público / API
2. Interface interna (assinaturas, módulos)
3. Banco de dados / schema
4. Frontend / consumo
5. Jobs / workers / filas / cron
6. Integrações / terceiros
7. Infra / operacional
8. Testes
9. Documentação

E aplica 5 eixos de validação por mudança:

- **Eixo 1** — Valor e necessidade (resolve problema real ou é over-engineering?)
- **Eixo 2** — Impacto cross-stack (mapeamento das 9 dimensões acima)
- **Eixo 3** — Duplicação e coerência (já existe? segue padrão do projeto?)
- **Eixo 4** — Gambiarra e dívida (causa raiz ou só esconde sintoma?)
- **Eixo 5** — Delegação especializada (toca segurança? performance?)

### Como invocar

```
Use o impact_validator para revisar PLANO.md antes de eu aplicar.
```

ou colando o plano direto:

```
Spawn impact_validator para validar este plano: [colar conteúdo]
```

---

## Validação cruzada — orquestração dos três agentes

O `impact_validator` é o **orquestrador**. Quando ele detecta que uma mudança toca
superfície específica, recomenda acionar os validadores especializados:

```
                    ┌─────────────────────────────┐
                    │   impact_validator          │
                    │   (mapeia impacto geral)    │
                    └──────┬──────────────────────┘
                           │
                  detecta superfície?
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
   ┌──────────────────────┐   ┌──────────────────────┐
   │ security_validator   │   │ performance_validator│
   │ (vulnerabilidade,    │   │ (gargalo, ganho ×    │
   │  PII, auth)          │   │  custo, regressão)   │
   └──────────────────────┘   └──────────────────────┘
```

### Quando cada um é acionado

| Agente | Acionado quando |
|---|---|
| `impact_validator` | **SEMPRE** — primeiro passo de qualquer plano de implementação |
| `security_validator` | Plano toca auth, PII, upload, render de input externo, dado regulado, gestão de segredos, headers de segurança |
| `performance_validator` | Plano toca cache, índice, query em hot path, paralelização, infra nova de performance (Redis, fila), lazy/eager loading |

### Fluxo recomendado

1. **Sempre** comece pelo `impact_validator`. Ele faz o mapeamento geral e identifica
   se há superfícies sensíveis.
2. Se ele recomendar delegação para `security_validator`, rode esse antes de prosseguir
   (correção sempre vence).
3. Se ele recomendar delegação para `performance_validator`, rode também quando for o caso.
4. Implemente apenas o que **todos os validadores aplicáveis** aprovaram.

### Regras de bloqueio

- ❌ **REJEITADO** em qualquer um dos três = bloqueio rígido. Não implementar.
- 🟡 **APROVADO COM RESSALVA** = liberado, mas as ressalvas são pré-requisito do patch.
- ❓ **QUESTIONAR** = aguarde resposta humana ou outro validador antes de prosseguir.
- ✅ **APROVADO** em todos os aplicáveis = liberado para o worker do Codex implementar.

### Exemplo de orquestração completa

> Plano: "Adicionar cache Redis no endpoint GET /api/users/:id por 5 minutos para reduzir
> carga no banco."

1. **`impact_validator`** mapeia: toca BACKEND, INFRA (Redis novo), CONTRATO. Detecta
   no Eixo 5 que toca cache de dado per-user (segurança) e cache em hot path (performance).
   Veredito: ❓ QUESTIONAR — delegar para os dois validadores especializados.

2. **`security_validator`** valida: chave de cache inclui user_id? Há vazamento entre
   usuários? Dado é sensível (LGPD)? TTL adequado? Veredito: 🟡 APROVADO COM RESSALVA
   (chave precisa incluir user_id e role; cache deve ser invalidado em update).

3. **`performance_validator`** valida: existe medição mostrando que /users/:id é gargalo?
   5 minutos é TTL adequado? Há padrão de cache equivalente já no projeto? Veredito:
   ✅ APROVADO ou ❌ REJEITADO conforme evidência de medição.

4. Implementação só avança se **os três** aprovarem (com ou sem ressalva).
