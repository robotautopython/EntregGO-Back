# EntregGO API

Backend do EntregGO, responsavel pela API REST, regras de negocio, autorizacao, validacao server-side, uploads, envio de push e acesso server-side ao Supabase.

## Estado atual

Fase de fundacao/auth-operacao. Este repositorio possui Express/TypeScript, Supabase service role server-side, auth por Bearer token, cadastro loja/motoboy, listagem admin paginada, detalhe admin expandido sanitizado, insights administrativos minimos, acoes admin de aprovar/bloquear/desbloquear usuarios e criacao backend de solicitacao de entrega para loja ativa com endereco de destino opcional. A migration M-01 e o smoke Auth/RLS real ja foram validados com dados ficticios e limpeza. A migration M-04A de hardening RLS foi aplicada manualmente no Supabase alvo e validada por smoke real com cleanup completo. A migration M-04C tornou `delivery_requests.destination_address` nullable, foi aplicada no Supabase alvo e validada por smoke real, sem liberar aceite, pool, realtime, push, cron ou historico. O M-05 adicionou `GET /api/deliveries`, listagem paginada somente da loja autenticada (`store_id` derivado da sessao, sem `store_id`/`courier_id` na resposta, sem migration/RLS), sem liberar aceite, detalhe unico, busca textual, agregados, realtime, push ou cron.

## Responsabilidades

- Expor API REST JSON sob `/api/*`.
- Manter regras de negocio e autorizacao no servidor.
- Proteger secrets e chaves privadas.
- Validar entradas no backend antes de qualquer operacao sensivel.
- Concentrar acesso com service role ao Supabase.

## Fora do estado atual

- Implementar uploads, push, realtime, aceite concorrente, cron, dashboards complexos, confirmacao administrativa de pagamento externo ou historico admin de entregas.
- Inserir secrets reais.

## Comandos

- `npm run dev`
- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run lint`

## Proximo passo

O proximo passo deve fechar o fluxo principal antes de modulos secundarios: a loja precisa acompanhar uma entrega real em detalhe apos criacao, aceite e transicoes do motoboy. A fatia sugerida e criar um contrato de detalhe/acompanhamento da entrega para a loja, sem realtime, push, cron, cancelamento ou historico admin. O controle de pagamento fica documentado como simples e administrativo para etapa futura: apenas confirmar se logista/motoboy pagou fora da plataforma, sem gateway, checkout, PIX, cartao ou repasse.
