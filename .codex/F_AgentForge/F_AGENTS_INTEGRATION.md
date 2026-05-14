# Snippet de Integracao — AgentForge no AGENTS.md

> Cole este trecho no AGENTS.md existente, na tabela de prefixos
> e no pipeline recomendado.

---

## Adicionar na tabela de prefixos:

```
| `F_` | Fabrica de agentes sob demanda (AgentForge) | `F_AgentForge/F_Agent_Foreman.md` |
```

## Adicionar no pipeline recomendado (como passo 0, antes do C10):

```
0. `F_AgentForge`: quando nenhum agente existente cobre a tarefa,
   a fabrica cria um agente sob medida. Acionar com @F.
   Supervisores: Foreman → ContextScanner → AgentArchitect → AgentComposer.
   Pos-execucao: WorkAuditor valida o trabalho do agente criado.
```

## Adicionar na secao "Como Mencionar":

```
- `@F` para criar agente sob demanda (AgentForge).
```

## Regra global adicional:

```
- Quando nenhum agente existente cobrir perfeitamente uma tarefa,
  o Camisa10 pode acionar @F para criar um agente contextualizado.
  Preferir reutilizar agentes existentes antes de criar novos.
```
