# EntregGO — Documentação Técnica

---

## 1. Arquitetura Geral

O EntregGO é composto por **duas aplicações completamente independentes**, cada uma com seu próprio repositório GitHub, deploy na Vercel e domínio.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APLICAÇÕES SEPARADAS                        │
│                                                                     │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐    │
│  │  FRONTEND               │    │  BACKEND (API)              │    │
│  │                         │    │                             │    │
│  │  Repo: entreggo-front   │    │  Repo: entreggo-api         │    │
│  │  Stack: Next.js (React) │    │  Stack: Node.js + Express   │    │
│  │  Deploy: Vercel          │    │  Deploy: Vercel (Serverless)│    │
│  │                         │    │                             │    │
│  │  Responsabilidade:      │    │  Responsabilidade:          │    │
│  │  - Landing page         │    │  - API REST                 │    │
│  │  - Painel Admin         │    │  - Regras de negócio        │    │
│  │  - Painel Loja          │    │  - Autenticação             │    │
│  │  - Painel Motoboy       │    │  - Push notifications       │    │
│  │  - Service Worker (PWA) │    │  - Upload de arquivos       │    │
│  │                         │    │  - Cron jobs (expiração)    │    │
│  └────────────┬────────────┘    └──────────────┬──────────────┘    │
│               │                                │                    │
│               │         HTTPS / JSON           │                    │
│               └───────────────┬────────────────┘                    │
│                               │                                     │
│                    ┌──────────▼──────────┐                          │
│                    │  SUPABASE           │                          │
│                    │                     │                          │
│                    │  - PostgreSQL (DB)  │                          │
│                    │  - Auth             │                          │
│                    │  - Storage (S3)     │                          │
│                    │  - Realtime (WSS)   │                          │
│                    └─────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.1 Comunicação entre Front e Back

- O frontend **nunca** acessa o Supabase diretamente (exceto Supabase Auth para login/registro)
- Toda lógica de negócio passa pela API
- A API é o único ponto que lê e escreve no banco de dados
- Comunicação via **REST (JSON)** sobre HTTPS
- Para notificações em tempo real (solicitações de entrega), o frontend usa **Supabase Realtime** (WebSocket) para escutar mudanças na tabela `delivery_requests`

### 1.2 Por que separar?

- **Escalabilidade**: front e back escalam independentemente
- **Segurança**: regras de negócio ficam no servidor, nunca expostas ao cliente
- **Manutenção**: equipes podem trabalhar em paralelo
- **Deploy**: um deploy no back não quebra o front e vice-versa

---

## 2. Stack Tecnológica

### 2.1 Frontend — `entreggo-front`

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Next.js** | 14+ (App Router) | Framework React com SSR/SSG |
| **React** | 18+ | Biblioteca de UI |
| **TypeScript** | 5+ | Tipagem estática |
| **Tailwind CSS** | 3+ | Estilização utility-first |
| **shadcn/ui** | latest | Componentes de UI (baseados em Radix) |
| **Lucide React** | latest | Ícones |
| **React Hook Form** | latest | Gerenciamento de formulários |
| **Zod** | latest | Validação de schemas |
| **Axios** | latest | Requisições HTTP para a API |
| **Supabase JS Client** | latest | Auth no client-side + Realtime |
| **next-pwa** | latest | Configuração de PWA e Service Worker |
| **Sonner** | latest | Toast notifications |
| **date-fns** | latest | Manipulação de datas |
| **Recharts** | latest | Gráficos nos dashboards |

### 2.2 Backend — `entreggo-api`

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | 20+ LTS | Runtime |
| **Express.js** | 4+ | Framework HTTP |
| **TypeScript** | 5+ | Tipagem estática |
| **Supabase JS Client** | latest | Acesso ao banco, storage e auth (server-side) |
| **web-push** | latest | Envio de notificações push (VAPID) |
| **Zod** | latest | Validação de input na API |
| **jsonwebtoken** | latest | Verificação de JWT do Supabase Auth |
| **multer** | latest | Upload de arquivos (multipart/form-data) |
| **cors** | latest | Configuração de CORS |
| **helmet** | latest | Headers de segurança HTTP |
| **express-rate-limit** | latest | Rate limiting |
| **dotenv** | latest | Variáveis de ambiente |
| **node-cron** | latest | Jobs agendados (expirar solicitações) |

### 2.3 Infraestrutura

| Serviço | Uso |
|---------|-----|
| **Supabase** | Banco PostgreSQL, Auth, Storage, Realtime |
| **Vercel** | Hospedagem (front e back como projetos separados) |
| **GitHub** | Versionamento (2 repositórios) |
| **VAPID Keys** | Par de chaves para Web Push |

---

## 3. Ambientes e Deploy

### 3.1 Dois ambientes isolados

| | Desenvolvimento | Produção |
|--|----------------|----------|
| **Branch** | `dev` | `main` |
| **Supabase** | Projeto `entreggo-dev` | Projeto `entreggo-prod` |
| **Vercel Front** | `entreggo-front-dev.vercel.app` | `app.entreggo.com.br` (domínio customizado) |
| **Vercel Back** | `entreggo-api-dev.vercel.app` | `api.entreggo.com.br` (domínio customizado) |

### 3.2 Variáveis de Ambiente

#### Frontend (`entreggo-front`)
```env
NEXT_PUBLIC_API_URL=https://api.entreggo.com.br       # URL da API
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                   # Supabase anon key (público)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BJ...                     # Chave pública VAPID para push
```

#### Backend (`entreggo-api`)
```env
SUPABASE_URL=https://xxx.supabase.co                   # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...                       # Service role (acesso total, NUNCA expor)
SUPABASE_JWT_SECRET=xxx                                # Para verificar tokens
VAPID_PUBLIC_KEY=BJ...                                 # Chave pública VAPID
VAPID_PRIVATE_KEY=xxx                                  # Chave privada VAPID
VAPID_SUBJECT=mailto:contato@entreggo.com.br           # Identificação VAPID
FRONTEND_URL=https://app.entreggo.com.br               # Para CORS
NODE_ENV=production                                    # Ambiente
```

### 3.3 Fluxo de Deploy

```
Developer → push para `dev` → Vercel auto-deploy DEV → testa
         → PR de `dev` para `main` → Code review → Merge
         → Vercel auto-deploy PROD
```

---

## 4. Design System

### 4.1 Identidade Visual

| Elemento | Valor |
|----------|-------|
| **Nome** | EntregGO |
| **Logo** | A ser fornecida pelo cliente |
| **Fonte principal** | Inter (Google Fonts) |
| **Fonte alternativa** | system-ui, sans-serif |
| **Bordas** | Border radius de 8px (padrão), 12px (cards), 16px (modais) |
| **Sombras** | Sutis, estilo `shadow-sm` e `shadow-md` do Tailwind |

### 4.2 Paleta de Cores

```
Cores primárias (a confirmar com logo do cliente):
┌─────────────────────────────────────────────┐
│  Primary 500     #22C55E  (verde vibrante)  │  ← Cor principal, botões de ação
│  Primary 600     #16A34A  (verde escuro)    │  ← Hover dos botões
│  Primary 50      #F0FDF4  (verde claro)     │  ← Backgrounds sutis
│  Primary 100     #DCFCE7  (verde suave)     │  ← Badges, tags
└─────────────────────────────────────────────┘

Cores de suporte:
┌─────────────────────────────────────────────┐
│  Gray 50         #F9FAFB                    │  ← Background geral
│  Gray 100        #F3F4F6                    │  ← Cards, sidebar
│  Gray 200        #E5E7EB                    │  ← Bordas
│  Gray 500        #6B7280                    │  ← Texto secundário
│  Gray 900        #111827                    │  ← Texto principal
│  White           #FFFFFF                    │  ← Cards, containers
└─────────────────────────────────────────────┘

Status:
┌─────────────────────────────────────────────┐
│  Success         #22C55E                    │  ← Entregue, ativo, pago
│  Warning         #F59E0B                    │  ← Pendente, em trânsito
│  Danger          #EF4444                    │  ← Bloqueado, expirado, atrasado
│  Info            #3B82F6                    │  ← Coletou, informativo
└─────────────────────────────────────────────┘
```

> **Nota**: A paleta primária será ajustada após recebimento da logo para manter coerência visual.

### 4.3 Tipografia

| Elemento | Tamanho | Peso | Cor |
|----------|---------|------|-----|
| H1 (título de página) | 30px / `text-3xl` | Bold (700) | Gray 900 |
| H2 (seção) | 24px / `text-2xl` | Semibold (600) | Gray 900 |
| H3 (subtítulo) | 20px / `text-xl` | Semibold (600) | Gray 900 |
| Body | 16px / `text-base` | Regular (400) | Gray 900 |
| Body small | 14px / `text-sm` | Regular (400) | Gray 500 |
| Caption | 12px / `text-xs` | Regular (400) | Gray 500 |
| Botão | 14px / `text-sm` | Medium (500) | White (sobre primary) |

### 4.4 Componentes UI (shadcn/ui)

Todos os componentes utilizam **shadcn/ui** como base, customizados com as cores do EntregGO:

| Componente | Uso |
|-----------|-----|
| `Button` | Ações primárias (verde), secundárias (outline), danger (vermelho) |
| `Card` | Containers de conteúdo, cards de solicitação |
| `Badge` | Status (ativo, pendente, bloqueado, pago, atrasado) |
| `Table` | Listagens de lojas, motoboys, entregas |
| `Dialog/Modal` | Confirmações, detalhes, formulários |
| `Input` | Campos de texto |
| `Select` | Dropdowns |
| `Tabs` | Navegação dentro de painéis |
| `Avatar` | Logo da loja, foto do motoboy |
| `Toast` (Sonner) | Feedbacks de sucesso/erro |
| `Skeleton` | Loading states |
| `DropdownMenu` | Menus de ação (bloquear, editar, etc.) |
| `Sheet` | Sidebar mobile |

### 4.5 Layout dos Painéis

```
┌──────────────────────────────────────────────────┐
│  Topbar (logo, nome do painel, avatar, logout)   │
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  Sidebar   │         Conteúdo Principal          │
│            │                                     │
│  - Menu    │   ┌─────────────────────────────┐   │
│  - Links   │   │  Cards / Insights / Tabelas │   │
│  - Status  │   │                             │   │
│            │   └─────────────────────────────┘   │
│            │                                     │
├────────────┴─────────────────────────────────────┤
│  (Mobile: sidebar vira sheet/drawer)             │
└──────────────────────────────────────────────────┘
```

- **Desktop**: sidebar fixa à esquerda (240px) + conteúdo à direita
- **Tablet**: sidebar colapsável (ícones apenas, 64px)
- **Mobile**: sidebar vira drawer (Sheet), topbar com hamburger menu

### 4.6 Responsividade

| Breakpoint | Largura | Comportamento |
|-----------|---------|---------------|
| Mobile | < 640px (`sm`) | Sidebar drawer, cards empilhados, tabelas horizontais com scroll |
| Tablet | 640px–1024px (`md`) | Sidebar colapsada, grid 2 colunas |
| Desktop | > 1024px (`lg`) | Sidebar expandida, grid 3-4 colunas |

### 4.7 Design da Notificação Push (Motoboy)

A notificação no painel do motoboy deve ser impactante:

```
┌──────────────────────────────────────────┐
│  🔔  NOVA SOLICITAÇÃO DE ENTREGA!        │
│                                          │
│  ┌──────┐  Loja do João                  │
│  │ LOGO │  Rua das Flores, 123           │
│  └──────┘                                │
│                                          │
│  📍 Destino: Av. Brasil, 456 - Centro    │
│                                          │
│  ⏱️ Expira em: 00:47                     │
│                                          │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │   RECUSAR    │  │    ✓ ACEITAR     │  │
│  │   (outline)  │  │  (verde, grande) │  │
│  └──────────────┘  └──────────────────┘  │
└──────────────────────────────────────────┘
```

- Card com animação de pulse/glow para chamar atenção
- Timer countdown regressivo e visível
- Botão Aceitar grande e verde (destaque)
- Som de notificação ao aparecer
- Vibração no mobile (Vibration API)

### 4.8 Timer de Solicitação (Painel da Loja)

```
┌──────────────────────────────────────┐
│                                      │
│       Aguardando motoboy...          │
│                                      │
│           ┌─────────┐               │
│           │  00:42   │               │
│           │  ╭───╮   │               │
│           │  │ ● │   │  ← circular   │
│           │  ╰───╯   │    progress   │
│           └─────────┘               │
│                                      │
│       Solicitação enviada para       │
│       todos os motoboys online       │
│                                      │
│       [ Cancelar solicitação ]       │
└──────────────────────────────────────┘
```

- Progresso circular animado de 60 → 0 segundos
- Transição de cor: verde → amarelo → vermelho
- Ao expirar: mensagem "Nenhum motoboy aceitou" + botão "Solicitar novamente"

---

## 5. Estrutura de Pastas

### 5.1 Frontend (`entreggo-front`)

```
entreggo-front/
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service Worker
│   ├── icons/                     # Ícones do PWA (192x192, 512x512)
│   └── sounds/
│       └── notification.mp3       # Som da notificação
├── src/
│   ├── app/                       # App Router (Next.js 14+)
│   │   ├── layout.tsx             # Layout raiz
│   │   ├── page.tsx               # Landing page
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── registro/
│   │   │   ├── loja/
│   │   │   │   └── page.tsx
│   │   │   └── motoboy/
│   │   │       └── page.tsx
│   │   ├── admin/                 # Painel Admin
│   │   │   ├── layout.tsx         # Layout com sidebar
│   │   │   ├── page.tsx           # Dashboard
│   │   │   ├── lojas/
│   │   │   │   ├── page.tsx       # Lista de lojas
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Detalhe da loja
│   │   │   ├── motoboys/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── pagamentos/
│   │   │       └── page.tsx
│   │   ├── loja/                  # Painel da Loja
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # Dashboard + insights
│   │   │   ├── solicitar/
│   │   │   │   └── page.tsx       # Solicitar entrega
│   │   │   ├── entregas/
│   │   │   │   └── page.tsx       # Histórico
│   │   │   └── perfil/
│   │   │       └── page.tsx
│   │   ├── motoboy/               # Painel do Motoboy
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # Solicitações disponíveis
│   │   │   ├── corrida/
│   │   │   │   └── page.tsx       # Corrida em andamento
│   │   │   ├── historico/
│   │   │   │   └── page.tsx
│   │   │   └── perfil/
│   │   │       └── page.tsx
│   │   └── aguardando-aprovacao/
│   │       └── page.tsx           # Tela de bloqueio
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── MobileDrawer.tsx
│   │   ├── landing/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── StoreSection.tsx
│   │   │   └── CourierSection.tsx
│   │   ├── delivery/
│   │   │   ├── DeliveryRequestCard.tsx
│   │   │   ├── DeliveryTimerCircle.tsx
│   │   │   ├── DeliveryStatusBadge.tsx
│   │   │   └── DeliveryStatusFlow.tsx
│   │   ├── admin/
│   │   │   ├── InsightsGrid.tsx
│   │   │   ├── PaymentControl.tsx
│   │   │   └── ApprovalCard.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── StatsCard.tsx
│   │       ├── FileUpload.tsx
│   │       └── EmptyState.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePushNotifications.ts
│   │   ├── useRealtimeDeliveries.ts
│   │   └── useApi.ts
│   ├── lib/
│   │   ├── api.ts                 # Axios instance configurada
│   │   ├── supabase.ts            # Supabase client (auth + realtime)
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts               # Tipos TypeScript compartilhados
│   └── styles/
│       └── globals.css            # Tailwind + customizações
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── package.json
└── .env.local
```

### 5.2 Backend (`entreggo-api`)

```
entreggo-api/
├── src/
│   ├── index.ts                   # Entry point (Express app)
│   ├── routes/
│   │   ├── auth.routes.ts         # /api/auth/*
│   │   ├── admin.routes.ts        # /api/admin/*
│   │   ├── store.routes.ts        # /api/stores/*
│   │   ├── courier.routes.ts      # /api/couriers/*
│   │   ├── delivery.routes.ts     # /api/deliveries/*
│   │   └── push.routes.ts         # /api/push/*
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── admin.controller.ts
│   │   ├── store.controller.ts
│   │   ├── courier.controller.ts
│   │   ├── delivery.controller.ts
│   │   └── push.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── store.service.ts
│   │   ├── courier.service.ts
│   │   ├── delivery.service.ts
│   │   ├── payment.service.ts
│   │   └── push.service.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # Verifica JWT
│   │   ├── role.middleware.ts     # Verifica role (admin, logista, motoboy)
│   │   ├── status.middleware.ts   # Verifica se usuário está ativo
│   │   ├── validate.middleware.ts # Validação com Zod
│   │   └── upload.middleware.ts   # Multer config
│   ├── validators/
│   │   ├── auth.schema.ts
│   │   ├── store.schema.ts
│   │   ├── courier.schema.ts
│   │   └── delivery.schema.ts
│   ├── jobs/
│   │   └── expireDeliveries.ts    # Cron: expirar solicitações após 1 min
│   ├── config/
│   │   ├── supabase.ts            # Supabase client (service role)
│   │   ├── push.ts                # VAPID keys config
│   │   └── cors.ts                # CORS config
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── response.ts            # Padronização de respostas
│       └── errors.ts              # Classes de erro customizadas
├── tsconfig.json
├── package.json
├── vercel.json                    # Config de deploy Vercel
└── .env
```

---

## 6. Segurança

### 6.1 Autenticação

```
┌──────────┐     ┌──────────────┐     ┌───────────┐
│ Frontend │────►│ Supabase Auth│────►│ JWT Token │
│          │◄────│              │◄────│           │
└──────┬───┘     └──────────────┘     └─────┬─────┘
       │                                     │
       │  Authorization: Bearer <JWT>        │
       │                                     │
       ▼                                     ▼
┌──────────┐     Verifica JWT          ┌───────────┐
│ API Call │────────────────────────►  │  Backend  │
│          │◄────────────────────────  │           │
└──────────┘     Resposta JSON         └───────────┘
```

| Aspecto | Implementação |
|---------|---------------|
| **Provedor** | Supabase Auth (email + senha) |
| **Token** | JWT gerado pelo Supabase, enviado como `Authorization: Bearer <token>` |
| **Verificação** | Backend verifica JWT com `SUPABASE_JWT_SECRET` em cada request |
| **Sessão** | Gerenciada pelo Supabase client no frontend (refresh automático) |
| **Expiração** | Token expira em 1h, refresh token em 7 dias (configurável no Supabase) |

### 6.2 Autorização (RBAC)

O sistema possui 3 roles com permissões distintas:

```
                    ┌───────────────┐
                    │     ADMIN     │
                    │               │
                    │ Acesso total  │
                    │ a tudo        │
                    └───────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │     LOGISTA     │         │    MOTOBOY       │
    │                 │         │                  │
    │ - Solicitar     │         │ - Ver/aceitar    │
    │   entregas      │         │   solicitações   │
    │ - Ver insights  │         │ - Atualizar      │
    │   próprios      │         │   status corrida │
    │ - Editar perfil │         │ - Ver histórico  │
    └─────────────────┘         └──────────────────┘
```

#### Middleware de autorização (backend)
```typescript
// Cada rota define quais roles têm acesso
router.get('/admin/users', auth, role(['admin']), controller.list);
router.post('/deliveries', auth, role(['logista']), status('ativo'), controller.create);
router.patch('/deliveries/:id/accept', auth, role(['motoboy']), status('ativo'), controller.accept);
```

### 6.3 Row Level Security (RLS) — Supabase

Mesmo que alguém consiga acesso direto ao Supabase, as RLS policies garantem isolamento:

| Tabela | Policy |
|--------|--------|
| `stores` | Logista vê/edita apenas a própria loja |
| `couriers` | Motoboy vê/edita apenas o próprio perfil |
| `delivery_requests` | Logista vê apenas suas solicitações; Motoboy vê solicitações com status "aguardando" |
| `payments` | Nenhum acesso via client — somente service role (backend) |
| `push_subscriptions` | Usuário vê apenas as próprias subscriptions |

### 6.4 Proteção de Rotas (Frontend)

```typescript
// Middleware no Next.js (middleware.ts)
// Redireciona com base no role e status do usuário

/admin/*       → Requer role 'admin'
/loja/*        → Requer role 'logista' + status 'ativo'
/motoboy/*     → Requer role 'motoboy' + status 'ativo'
/aguardando-*  → Usuários com status 'pendente' ou 'bloqueado'
/login         → Redireciona para painel se já autenticado
/              → Landing page (pública)
```

### 6.5 Segurança da API

| Camada | Implementação |
|--------|---------------|
| **CORS** | Permite apenas o domínio do frontend (`FRONTEND_URL`) |
| **Helmet** | Headers de segurança (X-Frame-Options, CSP, HSTS, etc.) |
| **Rate Limiting** | 100 req/min por IP geral; 10 req/min em login/registro |
| **Validação de input** | Zod em todas as rotas (sanitiza e valida antes de processar) |
| **Upload** | Limite de 5MB por arquivo; apenas imagens (JPEG, PNG, WebP) |
| **SQL Injection** | Prevenido pelo Supabase client (queries parametrizadas) |
| **XSS** | Sanitização de inputs; React já escapa outputs por padrão |

### 6.6 Variáveis Sensíveis

| Variável | Onde fica | Exposta ao client? |
|----------|-----------|-------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Backend `.env` | **NUNCA** |
| `VAPID_PRIVATE_KEY` | Backend `.env` | **NUNCA** |
| `SUPABASE_JWT_SECRET` | Backend `.env` | **NUNCA** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend `.env` | Sim (anon key é segura com RLS) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Frontend `.env` | Sim (chave pública) |

### 6.7 Proteção contra Race Condition (Aceite de entrega)

Quando múltiplos motoboys tentam aceitar a mesma entrega simultaneamente:

```sql
-- Usar UPDATE condicional no Supabase (locking otimista)
UPDATE delivery_requests
SET courier_id = $courier_id,
    status = 'aceita',
    accepted_at = NOW()
WHERE id = $delivery_id
  AND status = 'aguardando'     -- Só aceita se ainda estiver aguardando
  AND courier_id IS NULL;       -- Só aceita se ninguém pegou antes

-- Se rows affected = 0, outro motoboy já aceitou
```

---

## 7. Notificações Push — Detalhamento Técnico

### 7.1 Fluxo Completo

```
1. Motoboy faz login
   └──► Frontend pede permissão de notificação ao navegador
        └──► Se aceito, gera PushSubscription via Service Worker
             └──► Frontend envia subscription para API
                  └──► API salva no banco (push_subscriptions)

2. Loja solicita entrega
   └──► API cria delivery_request com status 'aguardando'
        └──► API busca todos os motoboys online + ativos
             └──► API envia Web Push para cada subscription
                  └──► Service Worker do motoboy recebe
                       └──► Exibe notificação do sistema
                       └──► Supabase Realtime atualiza o painel
```

### 7.2 Service Worker

```javascript
// sw.js — roda em background no navegador do motoboy
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [300, 100, 300, 100, 300],  // Padrão de vibração chamativo
    tag: data.deliveryId,                 // Evita duplicatas
    requireInteraction: true,             // Não fecha automaticamente
    data: { url: `/motoboy?delivery=${data.deliveryId}` }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  clients.openWindow(event.notification.data.url);
});
```

### 7.3 Realtime (Supabase)

Além do push, o frontend do motoboy escuta mudanças em tempo real:

```typescript
// useRealtimeDeliveries.ts
supabase
  .channel('delivery_requests')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'delivery_requests',
    filter: 'status=eq.aguardando'
  }, (payload) => {
    // Nova solicitação aparece no painel + som de notificação
    playNotificationSound();
    addDeliveryRequest(payload.new);
  })
  .subscribe();
```

---

## 8. API — Contrato Detalhado

### 8.1 Padrão de Resposta

```typescript
// Sucesso
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}

// Erro
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Endereço de destino é obrigatório",
    "details": [...]
  }
}
```

### 8.2 Códigos de Erro

| Código HTTP | Código interno | Descrição |
|-------------|---------------|-----------|
| 400 | `VALIDATION_ERROR` | Input inválido |
| 401 | `UNAUTHORIZED` | Token ausente ou inválido |
| 403 | `FORBIDDEN` | Sem permissão para esta ação |
| 403 | `ACCOUNT_BLOCKED` | Conta bloqueada ou pendente |
| 404 | `NOT_FOUND` | Recurso não encontrado |
| 409 | `ALREADY_ACCEPTED` | Entrega já foi aceita por outro motoboy |
| 429 | `RATE_LIMIT` | Muitas requisições |
| 500 | `INTERNAL_ERROR` | Erro interno do servidor |

---

## 9. Banco de Dados — SQL Completo

```sql
-- Enum types
CREATE TYPE user_role AS ENUM ('admin', 'logista', 'motoboy');
CREATE TYPE user_status AS ENUM ('pendente', 'ativo', 'bloqueado');
CREATE TYPE delivery_status AS ENUM ('aguardando', 'aceita', 'coletada', 'em_transito', 'entregue', 'expirada', 'cancelada');

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,           -- ID do Supabase Auth
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id)
);

-- Stores
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  address TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Couriers
CREATE TABLE couriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  bike_photo_url TEXT,
  license_photo_url TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments (controle interno)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference_month TEXT NOT NULL,           -- '2026-05'
  due_date DATE NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  marked_by UUID REFERENCES users(id),    -- Admin que marcou como pago
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, reference_month)
);

-- Delivery Requests
CREATE TABLE delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  destination_address TEXT NOT NULL,
  notes TEXT,
  status delivery_status NOT NULL DEFAULT 'aguardando',
  courier_id UUID REFERENCES couriers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 minute'),
  accepted_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ,
  in_transit_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Push Subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  subscription_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_delivery_requests_status ON delivery_requests(status);
CREATE INDEX idx_delivery_requests_store ON delivery_requests(store_id);
CREATE INDEX idx_delivery_requests_courier ON delivery_requests(courier_id);
CREATE INDEX idx_delivery_requests_expires ON delivery_requests(expires_at) WHERE status = 'aguardando';
CREATE INDEX idx_couriers_online ON couriers(is_online) WHERE is_online = true;
CREATE INDEX idx_payments_user_month ON payments(user_id, reference_month);
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
```

---

## 10. Performance e Escalabilidade

| Aspecto | Estratégia |
|---------|-----------|
| **Imagens** | Supabase Storage com CDN; thumbnails gerados para logos |
| **Queries** | Índices nas colunas mais consultadas (ver SQL acima) |
| **Notificações** | Envio assíncrono em paralelo (Promise.allSettled) |
| **Expiração** | Cron job a cada 30s marca como expiradas solicitações com `expires_at < NOW()` |
| **Caching** | Cache de dados estáticos no frontend (SWR ou React Query no futuro) |
| **Bundle** | Next.js code splitting automático por rota |

---

## 11. Monitoramento e Logs

| Ferramenta | Uso |
|-----------|-----|
| **Vercel Analytics** | Performance do frontend |
| **Vercel Logs** | Logs das API routes / serverless functions |
| **Supabase Dashboard** | Monitoramento do banco, auth, storage |
| **Console do navegador** | Debug de Service Worker e Push |

---

## 12. Resumo Executivo para o Codex

> **EntregGO** é composto por **2 aplicações separadas** (front e back), cada uma com seu próprio repositório no GitHub e deploy independente na Vercel. O banco de dados é Supabase (PostgreSQL), com um projeto para dev e outro para prod. O frontend é **Next.js 14+ com TypeScript, Tailwind CSS e shadcn/ui**. O backend é **Node.js com Express e TypeScript**. A comunicação é via **REST/JSON sobre HTTPS**. Notificações push via **Web Push API + Service Worker**. Atualizações em tempo real via **Supabase Realtime**. Segurança com **JWT (Supabase Auth), RBAC, RLS, CORS, Helmet, Rate Limiting e Zod**. Nenhum pagamento integrado, nenhum chat, nenhuma avaliação, nenhum rastreamento em tempo real.
