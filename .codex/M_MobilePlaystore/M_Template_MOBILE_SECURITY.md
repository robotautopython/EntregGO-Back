# MOBILE_SECURITY - [NOME DO APP]

## Politica de Dados Locais

| Categoria | Permitido no device? | Storage permitido |
|---|---|---|
| Token de sessao | sim, protegido | SecureStore |
| Dados publicos | sim | SQLite/FileSystem |
| PII minima necessaria | com justificativa | SQLite com controles |
| Senhas/API keys privadas | nunca | nenhum |
| Dados de pagamento sensiveis | nunca | nenhum |

## Permissoes

| Permissao | Motivo | Obrigatoria? | Fallback se negada |
|---|---|---|---|
| Camera | [motivo] | sim/nao | [fallback] |

## Logs

Nunca logar tokens, senhas, emails completos, documentos, payloads privados ou chaves.

## Checklist

- [ ] Secrets privados nao estao no app.
- [ ] Tokens usam SecureStore.
- [ ] `.env.example` nao contem valores reais.
- [ ] Permissoes tem justificativa.
- [ ] Erros exibidos ao usuario nao vazam detalhes internos.

