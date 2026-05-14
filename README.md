# EntregGO API

Backend do EntregGO, responsavel pela API REST, regras de negocio, autorizacao, validacao server-side, uploads, envio de push e acesso server-side ao Supabase.

## Estado atual

Fase de fundacao tecnica. Este repositorio possui manifest, dependencias, TypeScript, Express minimo e healthcheck. Ainda nao possui regras de negocio, auth real, uploads, push real, migrations finais ou testes de dominio.

## Responsabilidades

- Expor API REST JSON sob `/api/*`.
- Manter regras de negocio e autorizacao no servidor.
- Proteger secrets e chaves privadas.
- Validar entradas no backend antes de qualquer operacao sensivel.
- Concentrar acesso com service role ao Supabase.

## Fora da fundacao atual

- Implementar auth, uploads, push, realtime, migrations finais ou endpoints reais.
- Inserir secrets reais.

## Comandos

- `npm run dev`
- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run lint`

## Proximo passo

Criar migrations iniciais do Supabase e iniciar o ciclo de banco com validacao de seguranca antes de RLS, auth, PII ou uploads.
