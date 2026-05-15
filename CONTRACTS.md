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
