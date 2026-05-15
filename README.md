# EntregGO API

Backend do EntregGO, responsavel pela API REST, regras de negocio, autorizacao, validacao server-side, uploads, envio de push e acesso server-side ao Supabase.

## Estado atual

Fase de fundacao/auth-operacao. Este repositorio possui Express/TypeScript, Supabase service role server-side, auth por Bearer token, cadastro loja/motoboy, listagem admin paginada, detalhe admin expandido sanitizado, insights administrativos minimos e acoes admin de aprovar, bloquear e desbloquear usuarios. A migration M-01 e o smoke Auth/RLS real ja foram validados com dados ficticios e limpeza.

## Responsabilidades

- Expor API REST JSON sob `/api/*`.
- Manter regras de negocio e autorizacao no servidor.
- Proteger secrets e chaves privadas.
- Validar entradas no backend antes de qualquer operacao sensivel.
- Concentrar acesso com service role ao Supabase.

## Fora do estado atual

- Implementar uploads, push, realtime, dashboards complexos, pagamentos administrativos ou historico de entregas.
- Inserir secrets reais.

## Comandos

- `npm run dev`
- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run lint`

## Proximo passo

Pagamentos, documentos e historico de entregas dependem de contratos proprios e validadores especializados. Dashboards mais ricos devem passar por Performance Validator antes de novas agregacoes, cache, polling ou listas grandes.
