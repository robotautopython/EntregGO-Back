# CONTRACTS - EntregGO API

## Fronteira backend

O backend concentra regra de negocio, validacao server-side, autorizacao, uploads, push, jobs e acesso privilegiado ao Supabase.

## Padrao de sucesso

```json
{
  "success": true,
  "data": {},
  "message": "Operacao realizada com sucesso"
}
```

## Padrao de erro

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mensagem legivel para o usuario",
    "details": []
  }
}
```

## Status de dominio

- Usuario: `pendente`, `ativo`, `bloqueado`
- Role: `admin`, `logista`, `motoboy`
- Entrega: `aguardando`, `aceita`, `coletada`, `em_transito`, `entregue`, `expirada`, `cancelada`

## Realtime M-10A - Broadcast privado como gatilho REST

A M-10A usa Supabase Realtime Broadcast apenas como invalidacao leve. A API REST continua sendo a fonte da verdade; ao receber evento, o frontend deve chamar o endpoint REST autorizado existente.

Eventos e canais:

- `delivery.created` em `delivery:available`; consumidor: motoboys ativos e online; acao esperada: `GET /api/deliveries/available`.
- `delivery.accepted` em `delivery:<deliveryId>`; consumidor: loja dona da entrega; acao esperada: `GET /api/deliveries/:id`.
- `delivery.status_changed` em `delivery:<deliveryId>`; consumidor: loja dona da entrega; acao esperada: `GET /api/deliveries/:id`.

Payload permitido:

```json
{
  "deliveryId": "uuid",
  "status": "aguardando|aceita|coletada|em_transito|entregue",
  "updatedAt": "iso"
}
```

Regras backend:

- Broadcast e emitido somente server-side pelo backend, apos sucesso real de `POST /api/deliveries`, `POST /api/deliveries/:id/accept` ou `PATCH /api/deliveries/:id/status`.
- Emissao e best-effort, com timeout curto; falha de Realtime nunca quebra a resposta REST.
- Nao ha emissao em erro de negocio, validacao invalida, usuario sem permissao, entrega inexistente, entrega ja aceita por outro courier, entrega expirada, transicao invalida ou retry idempotente sem mudanca de estado.
- Payload e montado por whitelist e nunca inclui endereco, observacao, nome, email, telefone, `store_id`, `courier_id`, `user_id`, `auth_id`, token, header, service role, PII ou dado interno de autorizacao.
- Logs de broadcast usam apenas `event`, `delivery_id` e `result`, sem payload completo.

Policies em `realtime.messages`:

- Canais privados obrigatorios; cliente deve assinar com `config: { private: true }` e JWT atual.
- Realtime publico deve estar desabilitado no Supabase antes do deploy/smoke da M-10A.
- Nao existe policy de insert para `authenticated`; cliente autenticado nao pode emitir broadcast.
- `delivery:available` permite `select` apenas para usuario autenticado, usuario de dominio `role=motoboy`, `status=ativo`, courier proprio com `is_online=true` e `realtime.messages.extension='broadcast'`.
- `delivery:<uuid>` permite `select` apenas para usuario autenticado, usuario de dominio `role=logista`, `status=ativo` e loja dona da entrega.
- Topic `delivery:<uuid>` deve casar regex de UUID antes de qualquer cast; topic malformado falha fechado.

Fora da M-10A: Web Push/VAPID, Service Worker/PWA real, polling automatico, cron/expiracao automatica, cancelamento, GPS/mapa/raio, dados pessoais do motoboy para loja, assinatura realtime do motoboy aceito em `delivery:<deliveryId>`, leitura direta de tabelas de dominio pelo frontend e payload realtime com dados operacionais completos.

## Auth e cadastro M-02A

### `POST /api/auth/register/store`

Cria usuario Supabase Auth, `public.users` com role `logista` e status `pendente`, e perfil em `stores`.

Body:

```json
{
  "email": "loja@example.com",
  "password": "minimo-8-caracteres",
  "store": {
    "name": "Nome da loja",
    "ownerName": "Nome do responsavel",
    "address": "Endereco operacional",
    "description": "Opcional"
  }
}
```

### `POST /api/auth/register/courier`

Cria usuario Supabase Auth, `public.users` com role `motoboy` e status `pendente`, e perfil em `couriers`.

Body:

```json
{
  "email": "motoboy@example.com",
  "password": "minimo-8-caracteres",
  "courier": {
    "fullName": "Nome do motoboy"
  }
}
```

### `GET /api/auth/me`

Exige `Authorization: Bearer <access_token>` e retorna o contexto autenticado de dominio. Nao recebe service role no cliente.

## Admin M-02A

Todas as rotas admin exigem Bearer token de usuario autenticado, role `admin` e status `ativo`.

- `GET /api/admin/users?page=1&limit=20&role=logista&status=pendente&search=email`
- `GET /api/admin/users/:id`
- `GET /api/admin/insights`
- `GET /api/admin/deliveries`
- `GET /api/admin/deliveries/:id`
- `GET /api/admin/users/:id/deliveries`
- `GET /api/admin/users/:id/payments`
- `GET /api/admin/payments`
- `PATCH /api/admin/payments/:id/mark-paid`
- `PATCH /api/admin/users/:id/approve`
- `PATCH /api/admin/users/:id/block`
- `PATCH /api/admin/users/:id/unblock`

Listagens sao paginadas com limite maximo de `100`. Acoes admin alteram somente dados de dominio; nao removem usuarios do Supabase Auth.

`GET /api/admin/users` retorna, por item, os campos de `DomainUser` mais `store_name: string | null`. `store_name` vem de um embed 1:1 (`stores.user_id` unico -> `users.id`) na mesma query (sem N+1) e so e preenchido para `role=logista`; `admin`/`motoboy` recebem `null`. Nenhum campo de Storage/PII novo (`logo_url`, documentos) entra neste contrato. O detalhe `GET /api/admin/users/:id` permanece inalterado.

### `GET /api/admin/insights`

Retorna um dashboard administrativo minimo, sem parametros no v1. O endpoint consulta `public.users`, `public.delivery_requests` e `public.payments` apenas para agregados fixos com `count`/`head:true`; nao acessa perfis, listas de entregas, listas de pagamentos, Storage, Realtime, cache, cron ou dados mockados.

`active_accounts.stores` e `active_accounts.couriers` sao derivados de usuarios ativos por role (`logista/ativo` e `motoboy/ativo`). `latest_pending_users.items` e limitado a 5 apos merge de consultas limitadas por role. `delivery_counts_by_status` retorna todas as chaves do enum de entrega com default `0`. `payment_counts` retorna somente `{ paid, pending }`, onde `pending` e a contagem de registros com `paid=false`.

Resposta:

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-05-15T14:00:00.000Z",
    "user_counts": {
      "admin": {
        "pendente": 0,
        "ativo": 1,
        "bloqueado": 0
      },
      "logista": {
        "pendente": 2,
        "ativo": 10,
        "bloqueado": 1
      },
      "motoboy": {
        "pendente": 3,
        "ativo": 8,
        "bloqueado": 0
      }
    },
    "active_accounts": {
      "stores": 10,
      "couriers": 8
    },
    "delivery_counts_by_status": {
      "aguardando": 4,
      "aceita": 3,
      "coletada": 2,
      "em_transito": 1,
      "entregue": 9,
      "expirada": 5,
      "cancelada": 6
    },
    "payment_counts": {
      "paid": 7,
      "pending": 11
    },
    "latest_pending_users": {
      "limit": 5,
      "items": [
        {
          "id": "uuid",
          "role": "logista",
          "status": "pendente",
          "created_at": "2026-05-15T13:00:00.000Z"
        }
      ]
    }
  },
  "message": "Insights administrativos gerados"
}
```

Campos de PII como `email`, `auth_id`, nomes, endereco, perfis, documentos e URLs de Storage nao fazem parte deste contrato. IDs de entregas/pagamentos, `store_id`, `courier_id`, `user_id`, mes de referencia, vencimento, auditoria de pagamento, valor financeiro, metodo, PIX, cartao, boleto, comprovante, gateway e dados bancarios tambem ficam fora do payload de insights.

### `GET /api/admin/deliveries`

Lista administrativa global de entregas da rede, somente leitura. Exige `Authorization: Bearer <access_token>`, usuario de dominio com `role=admin` e `status=ativo`.

Query params (schema strict):

- `page`: inteiro, minimo 1, default 1.
- `limit`: inteiro, minimo 1, maximo 50, default 20.
- `status`: opcional, um de `aguardando|aceita|coletada|em_transito|entregue|expirada|cancelada`.
- Qualquer outro parametro, incluindo `store_id`, `courier_id`, `user_id`, busca textual ou filtro de data, gera `VALIDATION_ERROR`.

Regras:

- O endpoint usa service role apenas no backend e retorna uma whitelist fixa.
- Ordem fixa: `created_at` descendente e `id` descendente como desempate estavel.
- A migration M-07 adiciona indice global `(created_at desc, id desc)` para sustentar a listagem sem filtro de `status`; com `status`, o indice existente `(status, created_at desc)` segue util.
- A consulta usa embed `stores(name,address)` na mesma query, sem N+1.
- `destination_address`, `notes` e `store.address` sao dados operacionais permitidos somente para admin ativo nesta tela; nao devem ser logados.
- A resposta nunca inclui `store_id`, `courier_id`, `user_id`, `auth_id`, `email`, `owner_name`, `logo_url`, `description`, `full_name`, documentos, Storage URLs, tokens, cookies, headers ou service role.
- Dados de motoboy ficam totalmente fora do v1, inclusive nome, documento, status online e objeto `courier`.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `VALIDATION_ERROR`, `ADMIN_DELIVERIES_LIST_FAILED`.

Resposta:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "destination_address": "Endereco de destino",
        "notes": "Observacao opcional",
        "status": "em_transito",
        "created_at": "2026-05-17T12:00:00.000Z",
        "expires_at": "2026-05-17T12:01:00.000Z",
        "accepted_at": "2026-05-17T12:00:20.000Z",
        "collected_at": "2026-05-17T12:02:00.000Z",
        "in_transit_at": "2026-05-17T12:04:00.000Z",
        "delivered_at": null,
        "updated_at": "2026-05-17T12:04:00.000Z",
        "store": {
          "name": "Nome da loja",
          "address": "Endereco operacional da loja"
        }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  },
  "message": "Entregas administrativas encontradas"
}
```

Fora deste contrato de listagem: cancelamento, pagamento externo, alteracao de status, dados de motoboy, busca textual, filtro por data, polling, realtime, push, cron e drawer por usuario.

### `GET /api/admin/deliveries/:id`

Retorna o detalhe administrativo somente leitura de uma entrega da rede. Exige `Authorization: Bearer <access_token>`, usuario de dominio com `role=admin` e `status=ativo`.

Params:

- `id`: UUID da entrega.

Query params: nenhum. Qualquer parametro, incluindo `store_id`, `courier_id`, `user_id`, `auth_id`, `status`, `page`, busca textual ou filtro de data, gera `VALIDATION_ERROR`.

Regras:

- O endpoint usa service role apenas no backend e retorna a mesma whitelist sanitizada da listagem M-07.
- A consulta filtra por `delivery_requests.id=<id>` e usa embed `stores(name,address)` na mesma query, sem N+1, sem `count`, sem `range` e sem `order`.
- Entrega inexistente retorna `DELIVERY_NOT_FOUND`.
- A resposta nunca inclui `store_id`, `courier_id`, `user_id`, `auth_id`, `email`, `owner_name`, `logo_url`, `description`, `full_name`, documentos, Storage URLs, tokens, cookies, headers ou service role.
- Dados de motoboy ficam totalmente fora do v1, inclusive nome, documento, status online e objeto `courier`.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `VALIDATION_ERROR`, `DELIVERY_NOT_FOUND`, `ADMIN_DELIVERY_GET_FAILED`.

Resposta:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "destination_address": "Endereco de destino",
    "notes": "Observacao opcional",
    "status": "em_transito",
    "created_at": "2026-05-17T12:00:00.000Z",
    "expires_at": "2026-05-17T12:01:00.000Z",
    "accepted_at": "2026-05-17T12:00:20.000Z",
    "collected_at": "2026-05-17T12:02:00.000Z",
    "in_transit_at": "2026-05-17T12:04:00.000Z",
    "delivered_at": null,
    "updated_at": "2026-05-17T12:04:00.000Z",
    "store": {
      "name": "Nome da loja",
      "address": "Endereco operacional da loja"
    }
  },
  "message": "Entrega administrativa encontrada"
}
```

Fora deste contrato: cancelamento, alteracao de status, dados pessoais do motoboy, `courier_id`, `store_id`, `user_id`, `auth_id`, email, `owner_name`, `full_name`, documentos, Storage URLs, busca textual, filtro por data, dashboard, realtime, push, polling automatico, cron, gateway, checkout, PIX, cartao, boleto, cobranca integrada, comprovante/upload, valor financeiro, repasse/split, nota fiscal, tela para loja/motoboy, criacao/geracao mensal de registros e desmarcar pago.

### `GET /api/admin/users/:id/deliveries`

Lista entregas relacionadas a um usuario de dominio em modo administrativo somente leitura. Exige `Authorization: Bearer <access_token>`, usuario autenticado com `role=admin` e `status=ativo`.

Params:

- `id`: UUID do usuario de dominio.

Query params (schema strict):

- `page`: inteiro, minimo 1, default 1.
- `limit`: inteiro, minimo 1, maximo 50, default 20.
- `status`: opcional, um de `aguardando|aceita|coletada|em_transito|entregue|expirada|cancelada`.
- Qualquer outro parametro, incluindo `store_id`, `courier_id`, `user_id`, `auth_id`, `email`, busca textual ou filtro de data, gera `VALIDATION_ERROR`.

Regras:

- O endpoint usa service role apenas no backend e retorna a mesma whitelist sanitizada da M-07/M-09A.
- O usuario alvo e buscado por `users.id` com select minimo (`id,role`).
- Para `role=logista`, o backend resolve `stores.id` por `stores.user_id=<id>` e filtra `delivery_requests.store_id` server-side.
- Para `role=motoboy`, o backend resolve `couriers.id` por `couriers.user_id=<id>` e filtra `delivery_requests.courier_id` server-side.
- Para `role=admin`, retorna lista vazia honesta com `pagination.total=0`, sem consultar `stores`, `couriers` ou `delivery_requests`.
- Se o perfil operacional de logista/motoboy nao existir, retorna `ADMIN_USER_DELIVERIES_PROFILE_FAILED` sem consultar entregas.
- A consulta de entregas usa embed `stores(name,address)` na mesma query, sem N+1, com `count: exact`, `range`, ordem `created_at desc, id desc` e filtro opcional por `status`.
- Nao ha SQL/migration na M-09B local; PerformanceValidator aprovou o MVP com indices existentes e ressalva para reavaliar se usuarios acumularem milhares de entregas.
- A resposta nunca inclui `store_id`, `courier_id`, `user_id`, `auth_id`, email, `owner_name`, `logo_url`, `description`, `full_name`, documentos, Storage URLs, tokens, cookies, headers ou service role.
- Dados de motoboy ficam totalmente fora do v1, inclusive nome, documento, status online e objeto `courier`.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `VALIDATION_ERROR`, `USER_NOT_FOUND`, `ADMIN_USER_DELIVERIES_PROFILE_FAILED`, `ADMIN_USER_DELIVERIES_LIST_FAILED`.

Resposta para logista/motoboy:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "destination_address": "Endereco de destino",
        "notes": "Observacao opcional",
        "status": "entregue",
        "created_at": "2026-05-17T12:00:00.000Z",
        "expires_at": "2026-05-17T12:01:00.000Z",
        "accepted_at": "2026-05-17T12:00:20.000Z",
        "collected_at": "2026-05-17T12:02:00.000Z",
        "in_transit_at": "2026-05-17T12:04:00.000Z",
        "delivered_at": "2026-05-17T12:12:00.000Z",
        "updated_at": "2026-05-17T12:12:00.000Z",
        "store": {
          "name": "Nome da loja",
          "address": "Endereco operacional da loja"
        }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  },
  "message": "Entregas administrativas do usuario encontradas"
}
```

Resposta para usuario alvo `role=admin`:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": { "page": 1, "limit": 20, "total": 0 }
  },
  "message": "Entregas administrativas do usuario encontradas"
}
```

Fora deste contrato: cancelamento, alteracao de status, dados pessoais do motoboy, `courier_id`, `store_id`, `user_id`, `auth_id`, email, `owner_name`, `full_name`, documentos, Storage URLs, busca textual, filtro por data, dashboard, realtime, push, polling automatico, cron, gateway, checkout, PIX, cartao, boleto, cobranca integrada, comprovante/upload, valor financeiro, repasse/split, nota fiscal, tela para loja/motoboy, criacao/geracao mensal de registros e desmarcar pago.

### `GET /api/admin/users/:id/payments`

Lista controles internos de pagamento externo relacionados a um usuario de dominio em modo administrativo somente leitura. Exige `Authorization: Bearer <access_token>`, usuario autenticado com `role=admin` e `status=ativo`.

Params:

- `id`: UUID do usuario de dominio.

Query params (schema strict):

- `page`: inteiro, minimo 1, default 1.
- `limit`: inteiro, minimo 1, maximo 50, default 10.
- `paid`: opcional, `true|false`. Quando omitido, retorna todos.
- Qualquer outro parametro, incluindo `user_id`, `referenceMonth`, `role`, `userStatus`, `status`, `email`, `amount`, `paymentMethod`, `pix`, `card`, `receipt` ou `marked_by`, gera `VALIDATION_ERROR`.

Regras:

- O endpoint usa service role apenas no backend e retorna uma whitelist fixa.
- O usuario alvo e buscado por `users.id` com select minimo (`id,role`).
- Para `role=admin`, retorna lista vazia honesta com `pagination.total=0`, sem consultar `payments`.
- Para `role=logista` ou `role=motoboy`, o backend filtra `payments.user_id=<id>` server-side.
- A lista e paginada com `count: exact` no MVP e limite maximo 50.
- Ordem fixa: `reference_month desc`, `due_date asc`, `id asc`.
- Nao ha SQL/migration nesta fatia; a tabela `payments`, a constraint unica `(user_id, reference_month)` e o indice M-08 ja existem.
- A resposta nunca inclui `user_id`, objeto `user`, `auth_id`, email, `owner_name`, `full_name`, `marked_by`, `approved_by`, documentos, Storage URLs, tokens, cookies, headers, service role, valor financeiro, metodo de pagamento, gateway id, PIX, cartao, boleto, comprovante, dados bancarios, repasse ou nota fiscal.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `VALIDATION_ERROR`, `USER_NOT_FOUND`, `ADMIN_USER_PAYMENTS_LIST_FAILED`.

Resposta para logista/motoboy:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "reference_month": "2026-05",
        "due_date": "2026-05-31",
        "paid": false,
        "paid_at": null,
        "created_at": "2026-05-17T12:00:00.000Z",
        "updated_at": "2026-05-17T12:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 1 }
  },
  "message": "Pagamentos administrativos do usuario encontrados"
}
```

Resposta para usuario alvo `role=admin`:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": { "page": 1, "limit": 10, "total": 0 }
  },
  "message": "Pagamentos administrativos do usuario encontrados"
}
```

Fora deste contrato: gateway, checkout, PIX, cartao, boleto, cobranca integrada, comprovante/upload, valor financeiro, dados bancarios, repasse/split, nota fiscal, tela para loja/motoboy, criacao/geracao mensal de registros, desmarcar pago, busca textual, filtro por mes de referencia, dashboard, realtime, push, polling automatico e cron.

### `GET /api/admin/payments`

Lista controles internos de pagamento externo para admin ativo. O EntregGO nao processa pagamento; este contrato apenas mostra registros ja existentes em `public.payments`, criados fora desta fatia.

Query params (schema strict):

- `page`: inteiro, minimo 1, default 1.
- `limit`: inteiro, minimo 1, maximo 50, default 20.
- `paid`: `true|false`, default `false`.
- `referenceMonth`: opcional no formato `YYYY-MM`.
- `role`: opcional, `logista|motoboy`.
- `userStatus`: opcional, `pendente|ativo|bloqueado`.
- Qualquer outro parametro, incluindo `status`, `user_id`, `email`, `amount`, `paymentMethod`, `gatewayId`, `pix`, `card` ou `receipt`, gera `VALIDATION_ERROR`.

Regras:

- O endpoint usa service role apenas no backend, exige admin ativo e retorna whitelist fixa.
- A lista e paginada com `count: exact` no MVP e limite maximo 50.
- Ordem fixa: `reference_month desc`, `due_date asc`, `id asc`.
- A migration M-08 adiciona indice `(paid, reference_month desc, due_date asc, id asc)`.
- A consulta nao pode fazer N+1 para montar usuario/loja.
- A resposta nunca inclui `user_id`, `auth_id`, email, `owner_name`, `full_name`, `marked_by`, `approved_by`, documentos, Storage URLs, tokens, cookies, headers, service role, valor financeiro, metodo de pagamento, gateway id, PIX, cartao, boleto, comprovante, dados bancarios, repasse ou nota fiscal.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `VALIDATION_ERROR`, `ADMIN_PAYMENTS_LIST_FAILED`.

Resposta:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "reference_month": "2026-05",
        "due_date": "2026-05-31",
        "paid": false,
        "paid_at": null,
        "created_at": "2026-05-17T12:00:00.000Z",
        "updated_at": "2026-05-17T12:00:00.000Z",
        "user": {
          "role": "logista",
          "status": "ativo",
          "store_name": "Nome da loja"
        }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  },
  "message": "Pagamentos administrativos encontrados"
}
```

### `PATCH /api/admin/payments/:id/mark-paid`

Marca como pago um controle administrativo de pagamento externo ja realizado fora da plataforma.

Parametros e body:

- `id`: UUID do registro em `public.payments`.
- Query vazia strict.
- Body vazio strict.
- Qualquer campo no body, incluindo `amount`, `value`, `paymentMethod`, `pix`, `card`, `receipt`, `bankData`, `paid_at`, `marked_by` ou `user_id`, gera `VALIDATION_ERROR`.

Regras:

- Exige admin ativo.
- Faz update condicional apenas quando `paid=false`.
- Na primeira marcacao, grava `paid=true`, `paid_at=now` e `marked_by=<admin domain user id>`.
- E idempotente: se ja estiver `paid=true`, retorna 200 com o registro sanitizado sem sobrescrever `paid_at` nem `marked_by`.
- Logs operacionais usam apenas `event`, `payment_id` e `result`; nao incluem payload, usuario, email, nome, valor, metodo, token, header ou dados financeiros.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `VALIDATION_ERROR`, `PAYMENT_NOT_FOUND`, `ADMIN_PAYMENT_MARK_PAID_FAILED`.

Fora deste contrato: gateway, checkout, PIX, cartao, boleto, comprovante, upload, dados bancarios, valor financeiro, estorno, repasse, split, nota fiscal, geracao mensal automatica de registros, desmarcar pago e tela para loja/motoboy.

### `GET /api/admin/users/:id`

Retorna o usuario de dominio e o perfil expandido permitido para administracao.

Resposta:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "auth_id": "supabase-auth-id",
      "email": "usuario@example.com",
      "role": "logista",
      "status": "ativo",
      "approved_at": "2026-05-14T00:00:00.000Z",
      "approved_by": "uuid",
      "created_at": "2026-05-14T00:00:00.000Z",
      "updated_at": "2026-05-14T00:00:00.000Z"
    },
    "profile": {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Nome da loja",
      "owner_name": "Nome do responsavel",
      "address": "Endereco operacional",
      "description": "Opcional",
      "created_at": "2026-05-14T00:00:00.000Z",
      "updated_at": "2026-05-14T00:00:00.000Z"
    }
  },
  "message": "Usuario encontrado"
}
```

Para `role=motoboy`, `profile` contem apenas `id`, `user_id`, `full_name`, `is_online`, `created_at` e `updated_at`. Para `role=admin`, `profile` retorna `null`.

Campos de Storage e documentos (`logo_url`, `bike_photo_url`, `license_photo_url`) nao fazem parte deste contrato.

## Motoboy Fatia 3 - Status operacional

### `GET /api/couriers/me/status`

Retorna o status operacional do motoboy autenticado. Exige `Authorization: Bearer <access_token>`, usuario de dominio com `role=motoboy` e `status=ativo`.

Query params: nenhum. Qualquer parametro gera `VALIDATION_ERROR`.

Regras:

- O backend resolve o perfil por `couriers.user_id = domainUser.id`; o client nunca envia `courier_id`.
- A resposta e sanitizada e nao inclui `id`, `user_id`, nome, documentos, Storage, entregas ou dados de loja.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `COURIER_PROFILE_REQUIRED`, `VALIDATION_ERROR`.

Resposta:

```json
{
  "success": true,
  "data": {
    "is_online": false,
    "updated_at": "2026-05-16T12:00:00.000Z"
  },
  "message": "Status operacional encontrado"
}
```

### `PATCH /api/couriers/me/status`

Atualiza o status operacional do motoboy autenticado. Exige os mesmos guards de `GET /api/couriers/me/status`.

Body strict:

```json
{
  "isOnline": true
}
```

Regras:

- Apenas `isOnline: boolean` e aceito; `is_online`, `courier_id`, `user_id` ou qualquer outro campo geram `VALIDATION_ERROR`.
- O backend deriva o perfil por `couriers.user_id = domainUser.id`, atualiza somente `couriers.is_online` e retorna o status sanitizado.
- Nao ha SQL, migration, RLS, grant ou policy novos nesta fatia.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `COURIER_PROFILE_REQUIRED`, `VALIDATION_ERROR`, `COURIER_STATUS_UPDATE_FAILED`.

Resposta:

```json
{
  "success": true,
  "data": {
    "is_online": true,
    "updated_at": "2026-05-16T12:01:00.000Z"
  },
  "message": "Status operacional atualizado"
}
```

Fora desta fatia: localizacao/GPS, disponibilidade por raio, realtime, push, cron, historico de presenca, transicoes de entrega, cancelamento, confirmacao de pagamento externo, Storage e documentos.

## Entregas M-04A

### `POST /api/deliveries`

Cria uma solicitacao de entrega para a loja vinculada ao usuario autenticado. Exige `Authorization: Bearer <access_token>`, usuario de dominio com `role=logista` e `status=ativo`.

Body:

```json
{
  "notes": "Observacao opcional"
}
```

Regras:

- `store_id` sempre e derivado do perfil `stores` do usuario autenticado; nunca vem do body.
- O body aceita somente `destinationAddress` e `notes`; campos derivados ou desconhecidos geram `VALIDATION_ERROR`.
- `destinationAddress` e opcional; quando ausente, vazio ou somente whitespace, e gravado como `null`.
- `destinationAddress` nao vazio recebe trim e limite de tamanho.
- `notes` e opcional; quando ausente, vazio ou somente whitespace, e gravado como `null`.
- A entrega nasce com `status=aguardando`, `courier_id=null` e `expires_at` definido pelo default do banco.
- Escritas client-side em `delivery_requests` seguem negadas por RLS/grants; o backend usa service role.
- A resposta inclui apenas o resumo sanitizado da loja dona (`store.name` e `store.address`), derivado do perfil autenticado.
- A resposta e sanitizada e nunca inclui `store_id`, `courier_id`, `user_id`, `auth_id`, email, `owner_name`, `logo_url`, `description`, telefone, dados de motoboy, documentos, Storage, tokens, Authorization, Bearer, service role ou headers.

Resposta:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "destination_address": null,
    "notes": "Observacao opcional",
    "status": "aguardando",
    "created_at": "2026-05-15T20:00:00.000Z",
    "expires_at": "2026-05-15T20:01:00.000Z",
    "accepted_at": null,
    "collected_at": null,
    "in_transit_at": null,
    "delivered_at": null,
    "updated_at": "2026-05-15T20:00:00.000Z",
    "store": {
      "name": "Nome da loja",
      "address": "Endereco operacional da loja"
    }
  },
  "message": "Solicitacao de entrega criada"
}
```

Fora deste contrato: pool de motoboys, aceite concorrente, `accept`, mudanca de status, realtime, push, cron de expiracao, dashboards, confirmacao de pagamento externo e frontend.

## Entregas M-05

### `GET /api/deliveries`

Lista as solicitacoes de entrega da loja vinculada ao usuario autenticado. Exige `Authorization: Bearer <access_token>`, usuario de dominio com `role=logista` e `status=ativo`.

Query params (schema strict):

- `page`: inteiro, minimo 1, default 1.
- `limit`: inteiro, minimo 1, maximo 50, default 20.
- `status`: opcional, um de `aguardando|aceita|coletada|em_transito|entregue|expirada|cancelada`.
- Qualquer outro parametro (incluindo `store_id`, `courier_id`, `user_id`) gera `VALIDATION_ERROR`.

Regras:

- `store_id` e sempre derivado do perfil `stores` do usuario autenticado; nunca vem do request.
- Como o backend usa service role (RLS nao se aplica server-side), o isolamento multi-tenant e garantido pelo filtro server-side `store_id = <loja da sessao>`.
- Ordem fixa: `created_at` descendente.
- A resposta nunca inclui `store_id` nem `courier_id`.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `STORE_PROFILE_REQUIRED`, `VALIDATION_ERROR`, `DELIVERY_LIST_FAILED`.

Resposta:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "destination_address": null,
        "notes": "Observacao opcional",
        "status": "aguardando",
        "created_at": "2026-05-15T20:00:00.000Z",
        "expires_at": "2026-05-15T20:01:00.000Z",
        "accepted_at": null,
        "collected_at": null,
        "in_transit_at": null,
        "delivered_at": null,
        "updated_at": "2026-05-15T20:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  },
  "message": "Entregas encontradas"
}
```

Fora deste contrato de lista da loja: mudanca de status, historico admin, busca textual, filtros por data, agregados reais, dados de motoboy, realtime, push, cron, dashboards e confirmacao de pagamento externo.

## Entregas M-06 - Detalhe da loja

### `GET /api/deliveries/:id`

Retorna uma solicitacao de entrega especifica da loja vinculada ao usuario autenticado. Exige `Authorization: Bearer <access_token>`, usuario de dominio com `role=logista` e `status=ativo`.

Params:

- `id`: UUID da entrega.

Query params: nenhum. Qualquer parametro, incluindo `store_id`, `courier_id` ou `user_id`, gera `VALIDATION_ERROR`.

Regras:

- `store_id` e sempre derivado do perfil `stores` do usuario autenticado; nunca vem do request.
- Como o backend usa service role (RLS nao se aplica server-side), o isolamento multi-tenant e garantido pelo filtro server-side `id=<id>` e `store_id=<loja da sessao>`.
- Entrega inexistente ou pertencente a outra loja retorna `DELIVERY_NOT_FOUND`.
- A resposta inclui apenas o resumo sanitizado da loja dona (`store.name` e `store.address`), vindo do embed `stores(name,address)` apos o filtro `store_id=<loja da sessao>`.
- A resposta nunca inclui `store_id`, `courier_id`, `user_id`, `auth_id`, email, `owner_name`, `logo_url`, `description`, telefone, dados pessoais do motoboy, documentos, Storage, tokens, Authorization, Bearer, service role ou headers.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `STORE_PROFILE_REQUIRED`, `VALIDATION_ERROR`, `DELIVERY_NOT_FOUND`, `DELIVERY_GET_FAILED`.

Resposta:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "destination_address": "Endereco de destino",
    "notes": "Observacao opcional",
    "status": "em_transito",
    "created_at": "2026-05-17T12:00:00.000Z",
    "expires_at": "2026-05-17T12:01:00.000Z",
    "accepted_at": "2026-05-17T12:00:20.000Z",
    "collected_at": "2026-05-17T12:02:00.000Z",
    "in_transit_at": "2026-05-17T12:04:00.000Z",
    "delivered_at": null,
    "updated_at": "2026-05-17T12:04:00.000Z",
    "store": {
      "name": "Nome da loja",
      "address": "Endereco operacional da loja"
    }
  },
  "message": "Entrega encontrada"
}
```

Fora desta fatia: realtime, push, polling automatico, cancelamento, expiracao automatica por cron, historico admin, pagamento externo, documentos/Storage, GPS/mapa/raio e dados pessoais do motoboy.

## Entregas Fatia 1 - Motoboy

### `GET /api/deliveries/available`

Lista entregas disponiveis para aceite por motoboy. Exige `Authorization: Bearer <access_token>`, usuario de dominio com `role=motoboy`, `status=ativo`, perfil em `couriers` e `is_online=true`.

Query params (schema strict):

- `page`: inteiro, minimo 1, default 1.
- `limit`: inteiro, minimo 1, maximo 50, default 20.
- Qualquer outro parametro gera `VALIDATION_ERROR`.

Regras:

- Como o backend usa service role (RLS nao se aplica server-side), a descoberta filtra explicitamente no servidor: `status='aguardando'`, `courier_id is null` e `expires_at > now()`.
- O select usa embed PostgREST `stores(name,address)` na mesma consulta, sem N+1.
- Ordem fixa: `created_at` descendente.
- A resposta nunca inclui `store_id`, `courier_id`, `destination_address`, `notes`, `owner_name`, `logo_url`, `description` ou qualquer PII fora de `store.name` e `store.address`.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `COURIER_PROFILE_REQUIRED`, `COURIER_OFFLINE`, `VALIDATION_ERROR`, `DELIVERY_AVAILABLE_LIST_FAILED`.

Resposta:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "status": "aguardando",
        "created_at": "2026-05-16T12:00:00.000Z",
        "expires_at": "2026-05-16T12:01:00.000Z",
        "store": {
          "name": "Nome da loja",
          "address": "Endereco operacional da loja"
        }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  },
  "message": "Entregas disponiveis encontradas"
}
```

### `POST /api/deliveries/:id/accept`

Aceita uma entrega disponivel de forma atomica e idempotente para o mesmo motoboy. Exige os mesmos guards de `GET /api/deliveries/available`.

Regras:

- O backend resolve `couriers.id` por `couriers.user_id = domainUser.id`; sem perfil retorna `COURIER_PROFILE_REQUIRED`, offline retorna `COURIER_OFFLINE`.
- O aceite usa update condicional em uma unica operacao via service role: `status='aguardando'`, `courier_id is null`, `expires_at > now()`, setando `status='aceita'`, `courier_id=<courier.id>` e `accepted_at=now()`.
- Uma linha atualizada retorna `200` com estado sanitizado.
- Zero linhas atualizadas faz uma unica releitura leve por `id` para desambiguar: inexistente `DELIVERY_NOT_FOUND`, mesmo courier `200` idempotente, outro courier/status indisponivel `ALREADY_ACCEPTED`, ou aguardando expirada `DELIVERY_EXPIRED`.
- O log operacional e uma linha JSON via `console.log` com apenas `event`, `delivery_id` e `result`; nao inclui `courier_id`, nome, endereco, email, token, header, destination_address ou notes.
- A resposta nunca inclui `courier_id`, `destination_address`, `notes`, `owner_name`, `logo_url`, `description` ou PII fora de `store.name` e `store.address`.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `COURIER_PROFILE_REQUIRED`, `COURIER_OFFLINE`, `VALIDATION_ERROR`, `DELIVERY_NOT_FOUND`, `ALREADY_ACCEPTED`, `DELIVERY_EXPIRED`, `DELIVERY_ACCEPT_FAILED`.

Resposta:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "aceita",
    "accepted_at": "2026-05-16T12:00:20.000Z",
    "created_at": "2026-05-16T12:00:00.000Z",
    "expires_at": "2026-05-16T12:01:00.000Z",
    "store": {
      "name": "Nome da loja",
      "address": "Endereco operacional da loja"
    }
  },
  "message": "Entrega aceita"
}
```

Fora desta fatia: Realtime, push/Web Push/VAPID, cron de expiracao automatica, cancelamento, transicoes pos-aceite (`coletada`, `em_transito`, `entregue`), confirmacao de pagamento externo, Storage, historico admin, busca textual, SQL/migration/RLS/grants/policies novos e detalhe pos-aceite.

## Entregas Fatia 2 - Motoboy

### `GET /api/deliveries/active`

Retorna a corrida ativa atual do motoboy autenticado. Exige `Authorization: Bearer <access_token>`, usuario de dominio com `role=motoboy`, `status=ativo`, perfil em `couriers` e `is_online=true`.

Query params: nenhum. Qualquer parametro gera `VALIDATION_ERROR`.

Regras:

- Como o backend usa service role (RLS nao se aplica server-side), o isolamento e garantido por filtro explicito `courier_id=<courier.id>` derivado de `couriers.user_id = domainUser.id`.
- A rota retorna somente entregas com `status in ('aceita','coletada','em_transito')`; `entregue` nao aparece como corrida ativa.
- A consulta usa `order('created_at', desc)` e `limit(1)` para uma unica corrida ativa.
- Se nao houver corrida ativa, retorna `200` com `data: null` e mensagem honesta.
- Pre-aceite continua expondo somente `store.name`/`store.address` no endpoint de descoberta. Pos-aceite, este endpoint pode expor `destination_address` e `notes` apenas ao motoboy ja atribuido a entrega.
- A resposta nunca inclui `store_id`, `courier_id`, `owner_name`, `logo_url`, `description`, campos de documento/Storage ou campos de transicao (`collected_at`, `in_transit_at`, `delivered_at`).
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `COURIER_PROFILE_REQUIRED`, `COURIER_OFFLINE`, `VALIDATION_ERROR`, `DELIVERY_ACTIVE_GET_FAILED`.

Resposta com corrida ativa:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "destination_address": "Endereco de destino",
    "notes": "Observacao opcional",
    "status": "aceita",
    "accepted_at": "2026-05-16T12:00:20.000Z",
    "created_at": "2026-05-16T12:00:00.000Z",
    "expires_at": "2026-05-16T12:01:00.000Z",
    "store": {
      "name": "Nome da loja",
      "address": "Endereco operacional da loja"
    }
  },
  "message": "Corrida ativa encontrada"
}
```

Resposta sem corrida ativa:

```json
{
  "success": true,
  "data": null,
  "message": "Nenhuma corrida ativa encontrada"
}
```

### M-06.1 - Loja e endereco no fluxo real do motoboy

Auditoria cross-stack sem rota nova, sem SQL/migration/RLS/grants/policies e sem mudanca de realtime/push/polling/cron/cancelamento.

Regras confirmadas:

- Pre-aceite (`GET /api/deliveries/available`): retorna somente `store.name` e `store.address` como dados operacionais da loja, alem de `id`, `status`, `created_at` e `expires_at` da entrega.
- Pre-aceite: nao retorna `destination_address`, `notes`, `store_id`, `courier_id`, `owner_name`, `logo_url`, `description`, documentos, Storage, token, header ou payload sensivel.
- Aceite (`POST /api/deliveries/:id/accept`): mantem resposta reduzida com `store.name` e `store.address`, sem `destination_address`/`notes`; o detalhe pos-aceite vem do contrato de corrida ativa.
- Pos-aceite (`GET /api/deliveries/active` e `PATCH /api/deliveries/:id/status`): retorna `store.name`, `store.address`, `destination_address` e `notes` somente para o courier autenticado e atribuido, com `courier_id` derivado da sessao no servidor.
- Logs operacionais de aceite/status continuam whitelisted: `event`, `delivery_id`, `result`, `from_status` e `to_status`, sem `courier_id`, endereco, observacao, payload, token, cookie ou header.

## Entregas Fatia 4A - Motoboy

### `PATCH /api/deliveries/:id/status`

Atualiza a etapa da corrida atribuida ao motoboy autenticado. Exige `Authorization: Bearer <access_token>`, usuario de dominio com `role=motoboy`, `status=ativo`, perfil em `couriers` e `is_online=true`.

Params:

- `id`: UUID da entrega.

Body strict:

```json
{
  "status": "coletada"
}
```

Valores aceitos para `status`: `coletada`, `em_transito`, `entregue`. Qualquer outro campo, incluindo `courier_id`, `store_id`, `user_id`, `is_online`, `accepted_at`, `collected_at`, `in_transit_at` ou `delivered_at`, gera `VALIDATION_ERROR`.

Regras:

- O backend resolve `couriers.id` por `couriers.user_id = domainUser.id`; o client nunca envia identificador de courier, loja ou usuario.
- A entrega precisa estar atribuida ao proprio courier. Entrega inexistente ou de outro courier retorna `DELIVERY_NOT_FOUND`.
- Transicoes permitidas:
  - `aceita -> coletada`, setando `collected_at=now`;
  - `coletada -> em_transito`, setando `in_transit_at=now`;
  - `em_transito -> entregue`, setando `delivered_at=now`.
- O update e condicional por `id`, `courier_id` derivado e status anterior esperado. Transicoes pos-aceite nao usam `expires_at > now()`.
- Retry do mesmo status e idempotente e retorna o estado atual sem sobrescrever timestamp.
- A resposta e sanitizada e nunca inclui `store_id`, `courier_id`, `owner_name`, `logo_url`, `description`, documentos/Storage, email, tokens, secrets ou timestamps de transicao.
- Logs operacionais usam apenas `event`, `delivery_id`, `from_status`, `to_status` e `result`; nao incluem `courier_id`, payload, endereco, observacao, token, header ou email.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `COURIER_PROFILE_REQUIRED`, `COURIER_OFFLINE`, `VALIDATION_ERROR`, `DELIVERY_NOT_FOUND`, `INVALID_DELIVERY_TRANSITION`, `DELIVERY_STATUS_UPDATE_FAILED`.

Resposta:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "destination_address": "Endereco de destino",
    "notes": "Observacao opcional",
    "status": "coletada",
    "accepted_at": "2026-05-16T12:00:20.000Z",
    "created_at": "2026-05-16T12:00:00.000Z",
    "expires_at": "2026-05-16T12:01:00.000Z",
    "store": {
      "name": "Nome da loja",
      "address": "Endereco operacional da loja"
    }
  },
  "message": "Status da entrega atualizado"
}
```

Fora desta fatia: cancelamento, realtime, push/Web Push/VAPID, cron/expiracao automatica, historico do motoboy, historico admin, confirmacao de pagamento externo, Storage, geolocalizacao/GPS, disponibilidade por raio, SQL/migration/RLS/grants/policies novos.

## Entregas Fatia 4B - Historico do motoboy

### `GET /api/deliveries/history`

Lista o historico paginado de entregas atribuidas ao motoboy autenticado. Exige `Authorization: Bearer <access_token>`, usuario de dominio com `role=motoboy`, `status=ativo` e perfil em `couriers`. Nao exige `is_online=true`, porque historico nao representa disponibilidade operacional.

Estado em 2026-05-17: contrato auditado contra o backend real; a rota esta implementada sem mudanca funcional nova nesta rodada.

Query strict:

- `page`: inteiro >= 1, default `1`.
- `limit`: inteiro entre 1 e 50, default `20`.
- `status`: opcional, um dos valores de `delivery_status`.

Regras:

- O backend resolve `couriers.id` por `couriers.user_id = domainUser.id`; o client nunca envia identificador de courier, loja ou usuario.
- A consulta filtra sempre `delivery_requests.courier_id=<courier.id>` derivado da sessao.
- A ordenacao e fixa por `created_at desc`.
- A resposta inclui `destination_address`, `notes`, `status`, timestamps operacionais e `store` sanitizado (`name`, `address`).
- A resposta nunca inclui `store_id`, `courier_id`, `owner_name`, `logo_url`, `description`, documentos/Storage, email, tokens ou secrets.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `COURIER_PROFILE_REQUIRED`, `VALIDATION_ERROR`, `DELIVERY_HISTORY_LIST_FAILED`.

Resposta:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "destination_address": "Endereco de destino",
        "notes": "Observacao opcional",
        "status": "entregue",
        "created_at": "2026-05-16T12:00:00.000Z",
        "expires_at": "2026-05-16T12:01:00.000Z",
        "accepted_at": "2026-05-16T12:00:20.000Z",
        "collected_at": "2026-05-16T12:02:00.000Z",
        "in_transit_at": "2026-05-16T12:04:00.000Z",
        "delivered_at": "2026-05-16T12:12:00.000Z",
        "updated_at": "2026-05-16T12:12:00.000Z",
        "store": {
          "name": "Nome da loja",
          "address": "Endereco operacional da loja"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  },
  "message": "Historico de entregas encontrado"
}
```

### `GET /api/deliveries/history/:id`

Retorna o detalhe de uma entrega do historico atribuida ao motoboy autenticado. Exige `Authorization: Bearer <access_token>`, usuario de dominio com `role=motoboy`, `status=ativo` e perfil em `couriers`. Nao exige `is_online=true`, porque historico nao representa disponibilidade operacional.

Params:

- `id`: UUID da entrega.

Query params: nenhum. Qualquer parametro gera `VALIDATION_ERROR`.

Regras:

- O backend resolve `couriers.id` por `couriers.user_id = domainUser.id`; o client nunca envia `courier_id`.
- Como o backend usa service role (RLS nao se aplica server-side), o isolamento multi-tenant e garantido pelo filtro server-side `id=<id>` e `courier_id=<courier da sessao>`.
- Entrega inexistente ou atribuida a outro courier retorna `DELIVERY_NOT_FOUND`.
- A resposta reutiliza o shape sanitizado do historico paginado e nunca inclui `store_id`, `courier_id`, `owner_name`, `logo_url`, `description`, documentos, Storage, email, `auth_id`, tokens ou headers.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `COURIER_PROFILE_REQUIRED`, `VALIDATION_ERROR`, `DELIVERY_NOT_FOUND`, `DELIVERY_HISTORY_GET_FAILED`.

Resposta:

```json
{
  "success": true,
  "data": {
    "id": "66666666-6666-4666-8666-666666666666",
    "destination_address": "Rua Destino, 456",
    "notes": "Entregar na portaria",
    "status": "entregue",
    "created_at": "2026-05-16T12:00:00.000Z",
    "expires_at": "2026-05-16T12:10:00.000Z",
    "accepted_at": "2026-05-16T12:01:00.000Z",
    "collected_at": "2026-05-16T12:03:00.000Z",
    "in_transit_at": "2026-05-16T12:05:00.000Z",
    "delivered_at": "2026-05-16T12:12:00.000Z",
    "updated_at": "2026-05-16T12:12:00.000Z",
    "store": {
      "name": "Loja Centro",
      "address": "Rua Origem, 123"
    }
  },
  "message": "Entrega do historico encontrada"
}
```

Fora desta fatia: busca textual, filtro por data, cancelamento, realtime, push/Web Push/VAPID, cron/expiracao automatica, historico admin, confirmacao de pagamento externo, Storage, geolocalizacao/GPS, disponibilidade por raio, SQL/migration/RLS/grants/policies novos.

## Fluxo principal loja -> motoboy -> loja

A M-06 fecha a fatia minima de acompanhamento da loja com `GET /api/deliveries/:id`, permitindo que a loja veja a propria entrega criada por ela apos aceite e transicoes do motoboy, sem realtime, push, polling automatico, cancelamento ou dados pessoais do motoboy.

## Admin ainda ausente ou futuro no backend

O frontend admin ja possui telas reais para usuarios, insights, entregas e confirmacao administrativa simples de pagamento externo. Pagamentos M-08 ja contam com contrato backend publicado e UI admin `/admin/pagamentos` validada em producao.

Ainda nao existem no backend:

- signed URLs para documentos em Storage
- tabela/endpoint de `admin_notes`

### Escopo de pagamento externo

Nao havera pagamento integrado no EntregGO. A plataforma nao deve processar gateway, checkout, PIX, cartao, boleto, split, carteira, saldo, repasse ou conciliacao financeira. O escopo permitido e apenas um controle administrativo simples para o admin confirmar se um logista ou motoboy pagou fora da plataforma.

A tabela `public.payments` criada na M-01 deve ser tratada como controle interno por usuario e mes (`user_id`, `reference_month`, `due_date`, `paid`, `paid_at`, `marked_by`). O frontend de loja/motoboy nao acessa nem visualiza esse controle. Escritas client-side continuam proibidas; somente backend com service role pode listar ou marcar.

Contrato M-08 publicado:

- `GET /api/admin/payments?page=1&limit=20&role=logista&userStatus=ativo&referenceMonth=YYYY-MM&paid=false`
  - lista registros de controle de pagamento externo, paginados;
  - traz apenas resumo sanitizado do usuario (`role`, `status`, `store_name`);
  - nao retorna dado financeiro sensivel porque nao existe transacao financeira na plataforma.
- `PATCH /api/admin/payments/:id/mark-paid`
  - marca o controle como pago;
  - idempotente quando ja estiver pago;
  - seta `paid=true`, `paid_at=now` e `marked_by=<admin.id>` internamente;
  - nao aceita valor, metodo de pagamento, comprovante, gateway id ou dados bancarios.

Fora de escopo: gateway, checkout, PIX, cartao, boleto, cobranca integrada, comprovante/upload, valor financeiro, criacao/geracao mensal de registros, cobranca automatica, upload de comprovante, integracao financeira, notificacao de cobranca, historico contabil, estorno, repasse/split, nota fiscal, tela para loja/motoboy e desmarcar pago.

Qualquer contrato com documentos, CNH, fotos, auditoria administrativa ou PII exige Security Validator. O controle de pagamento externo nao e gateway financeiro, mas ainda exige auditoria de quem marcou e protecao contra acesso indevido. Qualquer contrato com agregacoes, historico grande, indices ou listas volumosas exige Performance Validator.

## Variaveis privadas permitidas somente no backend

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `VAPID_PRIVATE_KEY`

Essas variaveis nunca devem aparecer no frontend.
