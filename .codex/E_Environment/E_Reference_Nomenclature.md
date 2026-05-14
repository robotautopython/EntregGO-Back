# Nomenclatura de Variáveis de Ambiente
## Arquitetura: Frontend (Next.js) + Backend (Express — Vercel Serverless)

---

## Regras Gerais de Nomenclatura

| Regra | Descrição | Exemplo |
|---|---|---|
| UPPER_SNAKE_CASE | Sempre maiúsculo com underscore | `DATABASE_URL` |
| NEXT_PUBLIC_ prefix | Obrigatório para vars expostas ao browser (apenas frontend) | `NEXT_PUBLIC_API_URL` |
| Sem espaços ou hífens | Use underscore como separador | `MY_VAR` |
| Sem números no início | Não iniciar com dígito | `API_V2_KEY` |

### Regra crítica para sistemas desacoplados

`NEXT_PUBLIC_` expõe a variável no bundle JavaScript enviado ao browser.
No backend Express, esse prefixo não existe e não faz sentido.
Qualquer secret no frontend com `NEXT_PUBLIC_` é uma vulnerabilidade.

```
Frontend → usa NEXT_PUBLIC_ para tudo que o browser precisa ler
Backend  → não usa NEXT_PUBLIC_ em nenhuma variável
```

---

## FRONTEND — Next.js (Vercel Project A)

### Comunicação com o Backend

```
NEXT_PUBLIC_API_URL          → URL base do backend Express na Vercel
                               ex: https://api.meuapp.com ou https://meuapp-api.vercel.app
                               tipo: plain
                               NUNCA colocar trailing slash
```

### Identidade do Frontend

```
NEXT_PUBLIC_APP_URL          → URL pública do frontend
                               ex: https://meuapp.com
                               tipo: plain
```

### Supabase (se usado)

```
NEXT_PUBLIC_SUPABASE_URL     → URL do projeto Supabase (público)
                               tipo: plain
NEXT_PUBLIC_SUPABASE_ANON_KEY → Chave anônima (pública, mas não expor desnecessariamente)
                               tipo: plain
```

> SERVICE_ROLE_KEY nunca deve aparecer no frontend. Apenas no backend.

### Autenticação — Clerk (se usado)

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY → Chave pública do Clerk
                                    tipo: plain
NEXT_PUBLIC_CLERK_SIGN_IN_URL     → ex: /sign-in
                                    tipo: plain
NEXT_PUBLIC_CLERK_SIGN_UP_URL     → ex: /sign-up
                                    tipo: plain
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL → ex: /dashboard
                                    tipo: plain
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL → ex: /onboarding
                                    tipo: plain
```

> CLERK_SECRET_KEY nunca deve aparecer no frontend. Apenas no backend.

### Autenticação — NextAuth (se usado)

```
NEXTAUTH_URL                 → URL base do frontend (obrigatório em produção)
                               ex: https://meuapp.com
                               tipo: plain
NEXTAUTH_SECRET              → Secret para assinar JWTs (min 32 chars)
                               tipo: encrypted
```

> Se usar NextAuth com o backend Express como provider customizado,
> o frontend precisa saber o endpoint do provider via NEXT_PUBLIC_API_URL.

### Pagamentos — Stripe (se usado)

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → Chave pública do Stripe (pk_live_ ou pk_test_)
                                     tipo: plain
```

> STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET nunca no frontend. Apenas no backend.

### Analytics e Monitoramento (se usado)

```
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID  → ID do GA4 (G-XXXXXXXXXX)
                                   tipo: plain
NEXT_PUBLIC_SENTRY_DSN           → DSN público do Sentry para o frontend
                                   tipo: plain
```

---

## BACKEND — Express (Vercel Serverless Functions — Vercel Project B)

### Comunicação com o Frontend (CORS)

```
CORS_ORIGIN                  → URL do frontend para liberar CORS
                               ex: https://meuapp.com
                               tipo: plain
                               Em desenvolvimento: http://localhost:3000
                               DEVE coincidir com NEXT_PUBLIC_APP_URL do frontend
```

> Múltiplas origens: separar por vírgula ou usar JSON array dependendo da implementação.
> Ex: https://meuapp.com,https://preview.meuapp.com

### Identidade do Backend

```
NODE_ENV                     → production | development
                               tipo: plain
                               (a Vercel injeta VERCEL_ENV automaticamente, mas
                               NODE_ENV pode precisar ser definido explicitamente)
PORT                         → Não necessário na Vercel (gerenciado automaticamente)
API_VERSION                  → ex: v1 (opcional, para versionamento de rotas)
                               tipo: plain
```

### Banco de Dados — Prisma + Supabase/PostgreSQL

```
DATABASE_URL                 → Connection string com pooling (pgBouncer)
                               ex: postgresql://postgres.[ref]:[pass]@pooler.supabase.com:6543/postgres?pgbouncer=true
                               tipo: encrypted

DIRECT_URL                   → Connection string direta (sem pooling, para migrations)
                               ex: postgresql://postgres.[ref]:[pass]@db.supabase.com:5432/postgres
                               tipo: encrypted
```

> DATABASE_URL nunca deve aparecer no frontend.

### Supabase Admin (se usado)

```
SUPABASE_URL                 → URL do projeto (mesmo valor do NEXT_PUBLIC_SUPABASE_URL)
                               tipo: plain
SUPABASE_SERVICE_ROLE_KEY    → Chave de admin com acesso total — nunca expor
                               tipo: encrypted
SUPABASE_JWT_SECRET          → Secret JWT do Supabase (Settings > API)
                               tipo: encrypted
```

### Autenticação — JWT próprio (se usado)

```
JWT_SECRET                   → Secret para assinar tokens JWT
                               tipo: encrypted
                               Mínimo 32 chars, idealmente 64+
JWT_EXPIRES_IN               → ex: 7d, 24h, 3600
                               tipo: plain
REFRESH_TOKEN_SECRET         → Secret para refresh tokens (se implementado)
                               tipo: encrypted
```

### Autenticação — Clerk (backend, se usado)

```
CLERK_SECRET_KEY             → Chave secreta para verificar tokens no backend
                               tipo: encrypted
CLERK_WEBHOOK_SECRET         → Secret para verificar webhooks do Clerk
                               tipo: encrypted
```

### Pagamentos — Stripe (se usado)

```
STRIPE_SECRET_KEY            → Chave secreta (sk_live_ ou sk_test_)
                               tipo: encrypted
STRIPE_WEBHOOK_SECRET        → Secret do webhook (whsec_...)
                               tipo: encrypted
```

### E-mail — Resend (se usado)

```
RESEND_API_KEY               → Chave da API do Resend (re_...)
                               tipo: encrypted
RESEND_FROM_EMAIL            → Email remetente verificado
                               tipo: plain
```

### Armazenamento — AWS S3 (se usado)

```
AWS_ACCESS_KEY_ID            → tipo: encrypted
AWS_SECRET_ACCESS_KEY        → tipo: encrypted
AWS_REGION                   → ex: us-east-1 — tipo: plain
AWS_S3_BUCKET_NAME           → tipo: plain
```

### Monitoramento — Sentry (se usado)

```
SENTRY_DSN                   → DSN do Sentry para o backend
                               tipo: plain
SENTRY_AUTH_TOKEN            → Token para upload de source maps no build
                               tipo: encrypted
```

### IA — OpenAI (se usado)

```
OPENAI_API_KEY               → Chave da API OpenAI (sk-...)
                               tipo: encrypted
```

---

## Mapa de Responsabilidades

Referência rápida: qual lado é dono de cada categoria de variável.

| Categoria | Frontend | Backend |
|---|---|---|
| URL do backend | NEXT_PUBLIC_API_URL | — |
| URL do frontend | NEXT_PUBLIC_APP_URL | CORS_ORIGIN |
| Banco de dados | ❌ Nunca | DATABASE_URL, DIRECT_URL |
| Supabase (público) | NEXT_PUBLIC_SUPABASE_URL, ANON_KEY | — |
| Supabase (admin) | ❌ Nunca | SERVICE_ROLE_KEY, JWT_SECRET |
| Auth pública (Clerk) | PUBLISHABLE_KEY, URLs | — |
| Auth privada (Clerk) | ❌ Nunca | SECRET_KEY, WEBHOOK_SECRET |
| JWT próprio | ❌ Nunca | JWT_SECRET, REFRESH_TOKEN_SECRET |
| NextAuth | NEXTAUTH_URL, NEXTAUTH_SECRET | — |
| Stripe (público) | PUBLISHABLE_KEY | — |
| Stripe (privado) | ❌ Nunca | SECRET_KEY, WEBHOOK_SECRET |
| E-mail | ❌ Nunca | API_KEY, FROM_EMAIL |
| OpenAI | ❌ Nunca | OPENAI_API_KEY |
| S3 / Storage | ❌ Nunca | ACCESS_KEY, SECRET, BUCKET |

---

## Checklist de Nomenclatura

Ao auditar variáveis existentes, verificar:

- [ ] Variáveis client-side no frontend têm `NEXT_PUBLIC_` ?
- [ ] Secrets do frontend NÃO têm `NEXT_PUBLIC_` ?
- [ ] Secrets do backend existem SOMENTE no projeto backend?
- [ ] `CORS_ORIGIN` no backend bate com a URL real do frontend?
- [ ] `NEXT_PUBLIC_API_URL` no frontend bate com a URL real do backend?
- [ ] DATABASE_URL não está presente no projeto frontend?
- [ ] Chaves Stripe: `pk_test_` / `sk_test_` em preview, `pk_live_` / `sk_live_` em production?
- [ ] Nenhuma variável automática da Vercel está sendo redefinida manualmente?
- [ ] Todos os nomes estão em UPPER_SNAKE_CASE sem hífens?
