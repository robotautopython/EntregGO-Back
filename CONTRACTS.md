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
- `PATCH /api/admin/users/:id/approve`
- `PATCH /api/admin/users/:id/block`
- `PATCH /api/admin/users/:id/unblock`

Listagens sao paginadas com limite maximo de `100`. Acoes admin alteram somente dados de dominio; nao removem usuarios do Supabase Auth.

`GET /api/admin/users` retorna, por item, os campos de `DomainUser` mais `store_name: string | null`. `store_name` vem de um embed 1:1 (`stores.user_id` unico -> `users.id`) na mesma query (sem N+1) e so e preenchido para `role=logista`; `admin`/`motoboy` recebem `null`. Nenhum campo de Storage/PII novo (`logo_url`, documentos) entra neste contrato. O detalhe `GET /api/admin/users/:id` permanece inalterado.

### `GET /api/admin/insights`

Retorna um dashboard administrativo minimo, sem parametros no v1. O endpoint consulta apenas `public.users`, nao acessa perfis, entregas, pagamentos, Storage, Realtime, cache, cron ou dados mockados.

`active_accounts.stores` e `active_accounts.couriers` sao derivados de usuarios ativos por role (`logista/ativo` e `motoboy/ativo`). `latest_pending_users.items` e limitado a 5 apos merge de consultas limitadas por role.

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

Campos de PII como `email`, `auth_id`, nomes, endereco, perfis, documentos e URLs de Storage nao fazem parte deste contrato.

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

Fora desta fatia: localizacao/GPS, disponibilidade por raio, realtime, push, cron, historico de presenca, transicoes de entrega, cancelamento, pagamentos, Storage e documentos.

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

Resposta:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "store_id": "uuid",
    "destination_address": null,
    "notes": "Observacao opcional",
    "status": "aguardando",
    "courier_id": null,
    "created_at": "2026-05-15T20:00:00.000Z",
    "expires_at": "2026-05-15T20:01:00.000Z",
    "accepted_at": null,
    "collected_at": null,
    "in_transit_at": null,
    "delivered_at": null,
    "updated_at": "2026-05-15T20:00:00.000Z"
  },
  "message": "Solicitacao de entrega criada"
}
```

Fora deste contrato: pool de motoboys, aceite concorrente, `accept`, mudanca de status, realtime, push, cron de expiracao, dashboards, pagamentos e frontend.

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

Fora deste contrato de loja: mudanca de status, detalhe unico, historico admin, busca textual, filtros por data, agregados reais, dados de motoboy, realtime, push, cron, dashboards, pagamentos e frontend.

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
- O log operacional e uma linha JSON via `console.log` com apenas `event`, `delivery_id`, `courier_id` e `result`; nao inclui nome, endereco, email, token, header, destination_address ou notes.
- A resposta nunca inclui `destination_address`, `notes`, `owner_name`, `logo_url`, `description` ou PII fora de `store.name` e `store.address`.
- Erros possiveis: `AUTH_REQUIRED`, `INVALID_TOKEN`, `DOMAIN_USER_NOT_FOUND`, `USER_PENDING`, `USER_BLOCKED`, `FORBIDDEN_ROLE`, `COURIER_PROFILE_REQUIRED`, `COURIER_OFFLINE`, `VALIDATION_ERROR`, `DELIVERY_NOT_FOUND`, `ALREADY_ACCEPTED`, `DELIVERY_EXPIRED`, `DELIVERY_ACCEPT_FAILED`.

Resposta:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "aceita",
    "courier_id": "uuid",
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

Fora desta fatia: Realtime, push/Web Push/VAPID, cron de expiracao automatica, cancelamento, transicoes pos-aceite (`coletada`, `em_transito`, `entregue`), pagamentos, Storage, historico admin, busca textual, SQL/migration/RLS/grants/policies novos e detalhe pos-aceite.

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
- Logs operacionais usam apenas `event`, `delivery_id`, `courier_id`, `from_status`, `to_status` e `result`; nao incluem payload, endereco, observacao, token, header ou email.
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

Fora desta fatia: cancelamento, realtime, push/Web Push/VAPID, cron/expiracao automatica, historico do motoboy, historico admin, pagamentos, Storage, geolocalizacao/GPS, disponibilidade por raio, SQL/migration/RLS/grants/policies novos.

## Entregas Fatia 4B - Historico do motoboy

### `GET /api/deliveries/history`

Lista o historico paginado de entregas atribuidas ao motoboy autenticado. Exige `Authorization: Bearer <access_token>`, usuario de dominio com `role=motoboy`, `status=ativo` e perfil em `couriers`. Nao exige `is_online=true`, porque historico nao representa disponibilidade operacional.

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

Fora desta fatia: busca textual, filtro por data, detalhe unico, cancelamento, realtime, push/Web Push/VAPID, cron/expiracao automatica, historico admin, pagamentos, Storage, geolocalizacao/GPS, disponibilidade por raio, SQL/migration/RLS/grants/policies novos.

## Admin ainda ausente no backend

O frontend admin F7 Track A ja possui estrutura visual para detalhes, documentos, entregas, pagamentos e notas, mas estes contratos ainda nao existem no backend:

- `GET /api/admin/users/:id/deliveries?page=1`
- `GET /api/admin/payments`
- `PATCH /api/admin/payments/:id/mark-paid`
- signed URLs para documentos em Storage
- tabela/endpoint de `admin_notes`

Qualquer contrato com documentos, CNH, fotos, pagamentos, auditoria ou PII exige Security Validator. Qualquer contrato com agregacoes, historico grande, indices ou listas volumosas exige Performance Validator.

## Variaveis privadas permitidas somente no backend

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `VAPID_PRIVATE_KEY`

Essas variaveis nunca devem aparecer no frontend.
