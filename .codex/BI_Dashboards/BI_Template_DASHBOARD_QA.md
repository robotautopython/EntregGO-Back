# DASHBOARD_QA - [NOME DO DASHBOARD]

## Validacao de Dados

- [ ] Metricas batem com query/fonte manual.
- [ ] Periodo aplicado corretamente.
- [ ] Timezone validado.
- [ ] Filtros combinados funcionam.
- [ ] Valores nulos nao quebram graficos.
- [ ] Duplicidades foram tratadas.

## Validacao Visual

- [ ] KPIs com titulo, valor, unidade e delta.
- [ ] Graficos com legenda, eixo, tooltip e unidade.
- [ ] Cores tem significado consistente.
- [ ] Layout funciona em desktop e mobile/tablet quando aplicavel.
- [ ] Estados loading/vazio/erro/sem permissao existem.

## Validacao de Seguranca

- [ ] Usuario sem permissao nao acessa dados.
- [ ] Tenant A nao ve dados do Tenant B.
- [ ] Exportacao respeita filtros/permissao.
- [ ] PII esta mascarada quando necessario.

## Validacao de Performance

- [ ] Query principal dentro do limite definido.
- [ ] Tabelas paginadas/virtualizadas.
- [ ] Range grande tem limite ou agregacao.
- [ ] Cache, se houver, inclui tenant/filtros/permissao na chave.

