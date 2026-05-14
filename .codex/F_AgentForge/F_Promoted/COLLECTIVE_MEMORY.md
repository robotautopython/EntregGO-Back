# COLLECTIVE_MEMORY — Memoria Coletiva dos Agentes Promovidos

> Este arquivo e a inteligencia acumulada de todos os agentes que passaram
> pela fabrica, executaram em campo, e aprenderam com a experiencia.
>
> Quando a fabrica cria um novo agente, o **F_ContextScanner** le este
> arquivo para injetar aprendizados relevantes no novo agente. Isso
> significa que cada agente novo ja nasce mais inteligente que o anterior.
>
> Atualizado pelo **F_WorkAuditor** ao final de cada auditoria e pelo
> **F_Agent_Foreman** ao promover ou evoluir um agente.

---

## Como Funciona

```
Agente executa → WorkAuditor audita → detecta padrao
                                          │
                    ┌─────────────────────┼──────────────────┐
                    │                     │                  │
              ERRO REPETIVEL      TECNICA EFICAZ      ARMADILHA EVITADA
                    │                     │                  │
                    ▼                     ▼                  ▼
             Registrar em          Registrar em        Registrar em
             "Erros Conhecidos"    "Padroes que        "Armadilhas"
                                    Funcionam"
```

Cada entrada tem:
- **Data** de quando foi aprendido
- **Agente** que gerou o aprendizado
- **Contexto** em que aconteceu
- **Aprendizado** em 1-2 frases
- **Acao** que a fabrica deve tomar quando relevante

---

## Erros Conhecidos

Erros que agentes cometeram e que novos agentes devem evitar.

| # | Data | Agente | Erro | Acao para novos agentes |
|---|---|---|---|---|
| _exemplo_ | _2026-05-14_ | _PaymentFlow_ | _Nao verificou idempotencia no webhook_ | _Todo agente que toca webhook deve incluir verificacao de idempotencia_ |

<!-- Novas entradas acima desta linha -->

---

## Padroes que Funcionam

Abordagens que deram certo e devem ser replicadas.

| # | Data | Agente | Padrao | Quando aplicar |
|---|---|---|---|---|
| _exemplo_ | _2026-05-14_ | _MigrationPlanner_ | _Sempre criar migration de rollback junto com a principal_ | _Todo agente que toca banco/migrations_ |

<!-- Novas entradas acima desta linha -->

---

## Armadilhas Evitadas

Situacoes em que o agente quase errou mas o protocolo salvou.

| # | Data | Agente | Armadilha | O que salvou |
|---|---|---|---|---|
| _exemplo_ | _2026-05-14_ | _AuthRefactor_ | _Ia remover middleware sem checar consumidores_ | _Protocolo anti-alucinacao passo 4 (rastrear dependencias)_ |

<!-- Novas entradas acima desta linha -->

---

## Lacunas Detectadas no Ecossistema

Coisas que nenhum agente (existente ou promovido) cobre bem.

| # | Data | Detectado por | Lacuna | Sugestao |
|---|---|---|---|---|
| _exemplo_ | _2026-05-14_ | _WorkAuditor_ | _Nenhum agente valida i18n/l10n_ | _Criar agente de internacionalizacao_ |

<!-- Novas entradas acima desta linha -->

---

## Estatisticas (atualizar periodicamente)

```
Total de agentes promovidos: 0
Total de evolucoes aplicadas: 0
Total de agentes aposentados: 0
Total de erros registrados: 0
Total de padroes registrados: 0
Total de armadilhas registradas: 0
```

---

## Regras de Manutencao

1. **Toda entrada precisa de data e agente.** Sem rastreabilidade, nao e memoria — e ruido.
2. **Entradas duplicadas devem ser consolidadas.** Se dois agentes cometeram o mesmo erro, vira uma entrada com referencia a ambos.
3. **Entradas obsoletas devem ser marcadas.** Se o projeto mudou e o aprendizado nao se aplica mais, marcar como `[OBSOLETO - motivo]`, nao deletar.
4. **O ContextScanner le este arquivo na Camada 2.** Ele busca entradas relevantes para a area do novo agente e as injeta no relatorio de contexto.
5. **Maximo de 50 entradas ativas por secao.** Se passar, consolidar as mais antigas em resumos.
