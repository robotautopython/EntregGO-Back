# DASHBOARD_SPEC - [NOME DO DASHBOARD]

## Objetivo

**Usuario principal:** [perfil]
**Decisao que o dashboard suporta:** [decisao]
**Frequencia de uso:** diario | semanal | mensal | sob demanda

## Fontes de Dados

| Fonte | Tipo | Dono | Atualizacao | Observacao |
|---|---|---|---|---|
| [tabela/view/endpoint] | banco/API/job | [time] | realtime/cache/job | [nota] |

## Filtros

### Periodo

- Campo de data principal: `[created_at/paid_at/etc]`
- Timezone: `[America/Sao_Paulo/etc]`
- Data inicial: obrigatoria
- Data final: obrigatoria
- Presets: hoje, ontem, 7d, 30d, mes atual, trimestre atual, ano atual

### Outros filtros

- [ ] Status
- [ ] Cliente/tenant
- [ ] Produto/plano
- [ ] Canal/origem
- [ ] Regiao
- [ ] Responsavel/time

## Metricas

| Metrica | Formula | Fonte | Unidade | Permissao | Observacao |
|---|---|---|---|---|---|
| [KPI] | [formula] | [fonte] | BRL/%/unidade | [role] | [nota] |

## Layout

1. KPIs principais:
2. Tendencia temporal:
3. Composicao:
4. Ranking:
5. Tabela de detalhe:

## Estados

- Loading:
- Vazio:
- Erro:
- Sem permissao:
- Dados parciais:

## Performance

- Indices necessarios:
- Agregacao/cache:
- Limite de range:
- Paginacao:

## Seguranca

- Controle de acesso:
- Multi-tenant:
- PII:
- Exportacao:

