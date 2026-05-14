# Cross-Validation: Frontend ↔ Backend
## Checklist de Consistência entre Projetos Vercel

Este arquivo define todas as validações que o agente deve executar para garantir
que as variáveis dos dois projetos são consistentes entre si. Erros de
cross-validation são a principal causa de falhas em sistemas desacoplados.

---

## Validação 1 — Comunicação Frontend → Backend

**Objetivo:** garantir que o frontend aponta para o backend correto.

### O que verificar

O valor de `NEXT_PUBLIC_API_URL` no projeto frontend deve corresponder ao domínio
real do projeto backend na Vercel.

### Como verificar

1. Ler `NEXT_PUBLIC_API_URL` do projeto frontend via `GET /env`
   (o valor não é retornado pela API — perguntar ao usuário ou pedir para confirmar)
2. Buscar o domínio do projeto backend:
   ```http
   GET https://api.vercel.com/v9/projects/{BACKEND_PROJECT_ID}
   ```
   O campo `alias` ou `targets` retorna os domínios ativos.
3. Confirmar que o valor de `NEXT_PUBLIC_API_URL` bate com um dos domínios do backend.

### Erros comuns

```
NEXT_PUBLIC_API_URL = https://meuapp-api-git-main.vercel.app   ← URL de preview, não production
NEXT_PUBLIC_API_URL = https://meuapp-api.vercel.app/           ← trailing slash pode quebrar rotas
NEXT_PUBLIC_API_URL = http://localhost:3001                    ← valor de dev em production
NEXT_PUBLIC_API_URL não existe                                 ← todas as chamadas à API vão falhar
```

### Status no relatório

```
[OK]    NEXT_PUBLIC_API_URL aponta para o domínio correto do backend
[ERRO]  NEXT_PUBLIC_API_URL aponta para URL de preview em production
[ERRO]  NEXT_PUBLIC_API_URL não encontrada no projeto frontend
[AVISO] NEXT_PUBLIC_API_URL contém trailing slash — pode causar rotas duplicadas
```

---

## Validação 2 — CORS Backend → Frontend

**Objetivo:** garantir que o backend aceita requisições do frontend correto.

### O que verificar

O valor de `CORS_ORIGIN` no backend deve corresponder ao domínio real do frontend.

### Como verificar

1. Confirmar `CORS_ORIGIN` no projeto backend (perguntar ao usuário)
2. Buscar domínio do projeto frontend:
   ```http
   GET https://api.vercel.com/v9/projects/{FRONTEND_PROJECT_ID}
   ```
3. Confirmar que `CORS_ORIGIN` bate com o domínio de production do frontend.

### Erros comuns

```
CORS_ORIGIN não existe                    ← CORS bloqueado para todas as origens
CORS_ORIGIN = *                           ← abre para qualquer origem (inseguro em produção)
CORS_ORIGIN = http://localhost:3000       ← valor de dev em production
CORS_ORIGIN = https://meuapp.vercel.app  ← domínio Vercel, mas o domínio real é meuapp.com
```

### Status no relatório

```
[OK]    CORS_ORIGIN bate com o domínio production do frontend
[ERRO]  CORS_ORIGIN não encontrada — backend bloqueará todas as requisições do frontend
[ERRO]  CORS_ORIGIN aponta para localhost em production
[AVISO] CORS_ORIGIN usa domínio .vercel.app — confirmar se o domínio customizado está correto
[AVISO] CORS_ORIGIN = * — inseguro para production, considerar restringir
```

---

## Validação 3 — Secrets no Projeto Errado

**Objetivo:** garantir que chaves privadas estão apenas no backend.

### O que verificar

As seguintes variáveis NÃO devem existir no projeto frontend:

```
DATABASE_URL
DIRECT_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
JWT_SECRET
REFRESH_TOKEN_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
OPENAI_API_KEY
AWS_SECRET_ACCESS_KEY
SENTRY_AUTH_TOKEN
```

### Como verificar

Comparar a lista de variáveis do projeto frontend com a lista acima.
Qualquer match é uma vulnerabilidade de segurança — alertar imediatamente.

### Status no relatório

```
[OK]    Nenhum secret encontrado no projeto frontend
[CRÍTICO] DATABASE_URL encontrada no projeto frontend — remover imediatamente
[CRÍTICO] STRIPE_SECRET_KEY encontrada no projeto frontend — remover imediatamente
```

---

## Validação 4 — Variáveis Supabase Corretas por Lado

**Objetivo:** garantir que cada lado usa as chaves Supabase corretas.

### O que verificar

| Variável | Frontend | Backend |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Deve existir | Não necessária |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Deve existir | Não necessária |
| `SUPABASE_URL` | Não necessária | Deve existir |
| `SUPABASE_SERVICE_ROLE_KEY` | NUNCA | Deve existir |
| `SUPABASE_JWT_SECRET` | NUNCA | Se necessário |

### Status no relatório

```
[OK]    Supabase configurado corretamente em ambos os projetos
[CRÍTICO] SUPABASE_SERVICE_ROLE_KEY encontrada no frontend — remover
[AVISO] SUPABASE_URL ausente no backend — backend pode não conseguir acessar o banco server-side
```

---

## Validação 5 — Consistência de Environments

**Objetivo:** garantir que valores de test/dev não aparecem em production.

### O que verificar

| Padrão | Environment correto |
|---|---|
| `pk_test_...` `sk_test_...` | preview, development |
| `pk_live_...` `sk_live_...` | production |
| `http://localhost:...` | development apenas |
| `.vercel.app` URLs | preview (não production com domínio customizado) |
| `re_test_...` (Resend) | development |

> A API da Vercel não retorna valores, então perguntar ao usuário sobre os valores
> configurados por environment, ou orientar a verificar manualmente no dashboard.

### Status no relatório

```
[OK]    Stripe em modo live em production e test em preview/development
[ERRO]  Chave Stripe test detectada em production
[AVISO] URL localhost detectada em preview ou production
```

---

## Validação 6 — Redefinição de Variáveis Automáticas

**Objetivo:** garantir que variáveis injetadas pela Vercel não foram redefinidas.

### Variáveis automáticas da Vercel

```
VERCEL
VERCEL_ENV
VERCEL_URL
VERCEL_BRANCH_URL
VERCEL_GIT_COMMIT_SHA
VERCEL_GIT_COMMIT_REF
VERCEL_GIT_REPO_SLUG
VERCEL_GIT_PROVIDER
VERCEL_GIT_REPO_OWNER
```

Verificar em **ambos os projetos**. Se encontradas, orientar remoção.

### Status no relatório

```
[OK]    Nenhuma variável automática redefinida manualmente
[AVISO] VERCEL_ENV redefinida manualmente — pode causar comportamento inesperado
```

---

## Relatório Final Consolidado

Ao final da etapa de cross-check, apresentar:

```
=== CROSS-CHECK FRONTEND ↔ BACKEND ===

Comunicação (Frontend → Backend)
  [STATUS] NEXT_PUBLIC_API_URL → [resultado]

CORS (Backend → Frontend)
  [STATUS] CORS_ORIGIN → [resultado]

Segurança (Secrets no projeto correto)
  [STATUS] Projeto frontend: [resultado]
  [STATUS] Projeto backend: [resultado]

Supabase (distribuição correta)
  [STATUS] Frontend: [resultado]
  [STATUS] Backend: [resultado]

Environments (valores coerentes)
  [STATUS] [resultado]

Variáveis automáticas
  [STATUS] [resultado]

RESULTADO GERAL: [OK / ATENÇÃO: N problemas encontrados]
```

---

## Ordem de Redeploy

Quando ambos os projetos são alterados, a ordem de redeploy importa:

```
1. Backend primeiro  → garante que as novas rotas e configs estão disponíveis
2. Frontend depois   → só então o frontend aponta para o backend já atualizado
```

Se apenas um lado foi alterado, fazer redeploy apenas nele.
