# MOBILE_OFFLINE - [NOME DO APP]

## Estrategia Offline

**Nivel:** leitura | escrita pendente | offline-first completo
**Entidades sincronizaveis:** [lista]
**Conflito:** server wins | client wins | merge | revisao humana

## Fila Local de Mutacoes

Toda mutacao offline deve conter:

- `clientMutationId`
- `operation`
- `payload`
- `createdAt`
- `attempts`
- `status`: pending | syncing | failed | synced
- `lastError`

## Regras

- Reenvio precisa ser idempotente no backend.
- Retry precisa de exponential backoff e limite.
- Usuario deve ver estado pendente/falhou/sincronizado.
- Acao critica pendente nao pode ser apresentada como confirmada.

## Casos de Teste

- [ ] Criar item offline e sincronizar.
- [ ] Fechar app com item pendente e reabrir.
- [ ] Rede cair no meio do sync.
- [ ] Backend receber duplicata do mesmo `clientMutationId`.
- [ ] Conflito entre alteracao local e remota.

