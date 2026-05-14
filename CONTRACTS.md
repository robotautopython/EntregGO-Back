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
- `PATCH /api/admin/users/:id/approve`
- `PATCH /api/admin/users/:id/block`
- `PATCH /api/admin/users/:id/unblock`

Listagens sao paginadas com limite maximo de `100`. Acoes admin alteram somente dados de dominio; nao removem usuarios do Supabase Auth.

## Variaveis privadas permitidas somente no backend

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `VAPID_PRIVATE_KEY`

Essas variaveis nunca devem aparecer no frontend.
