# EntregGO — Documentação Funcional do Sistema

---

## 1. Visão Geral

**EntregGO** é uma plataforma web de intermediação de entregas sob demanda. Lojas solicitam motoboys para realizar entregas, e motoboys disponíveis recebem notificações push para aceitar ou recusar a corrida. Não há pagamento integrado, rastreamento em tempo real ou chat entre as partes.

### 1.1 O que o sistema FAZ

- Cadastro e gestão de lojas e motoboys
- Solicitação de entrega por parte da loja (com endereço de destino)
- Notificação push para todos os motoboys online
- Fluxo de entrega com status: **Coletou → Em trânsito → Entregue**
- Painel Admin com controle total (cadastros, bloqueios, insights, controle de pagamento interno)
- Painel da Loja com solicitação de entregas e insights
- Painel do Motoboy com recebimento e gestão de corridas
- Landing page com cadastro para lojas e motoboys
- Sistema de aprovação de cadastros pelo admin

### 1.2 O que o sistema NÃO FAZ

- Pagamento integrado (cobrança, gateway, PIX, etc.)
- Rastreamento em tempo real (GPS usado apenas para localização estática)
- Chat ou comunicação entre loja e motoboy
- Avaliação ou sistema de reputação
- App nativo (é 100% web com notificação push)
- Cálculo de preço ou precificação de corrida

---

## 2. Arquitetura

### 2.1 Sistema Desacoplado (Front e Back Independentes)

O EntregGO é composto por **duas aplicações completamente separadas e independentes**. O frontend e o backend são projetos distintos, com repositórios, deploys e domínios próprios. Eles se comunicam exclusivamente via API REST (JSON sobre HTTPS). Um não depende do outro para fazer deploy — podem ser atualizados, escalados e mantidos de forma isolada.

| Aplicação | Repositório | Deploy | Responsabilidade |
|-----------|------------|--------|-----------------|
| **Frontend** (`entreggo-front`) | Repo GitHub próprio | Vercel (projeto separado) | Interface web: landing page, painéis (admin, loja, motoboy), PWA, Service Worker |
| **Backend / API** (`entreggo-api`) | Repo GitHub próprio | Vercel (projeto separado) | API REST, regras de negócio, autenticação, envio de push notifications, cron jobs |

**Regra fundamental**: o frontend **nunca** acessa o banco de dados diretamente. Toda leitura e escrita de dados passa pela API do backend. A única exceção é o Supabase Auth (login/registro) e o Supabase Realtime (WebSocket para receber solicitações em tempo real no painel do motoboy).

### 2.2 Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14+ (React, TypeScript, Tailwind CSS, shadcn/ui) |
| Backend/API | Node.js + Express (TypeScript) |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth (JWT) |
| Armazenamento de arquivos | Supabase Storage (fotos de moto, CNH, logos) |
| Notificações | Web Push API (VAPID + Service Workers) |
| Tempo real | Supabase Realtime (WebSocket) |
| Hospedagem | Vercel (dois projetos separados: front e back) |

### 2.3 Ambientes

Cada ambiente possui seu próprio projeto Supabase (banco, auth, storage isolados):

| Ambiente | Banco Supabase | Branch GitHub | Deploy Vercel |
|----------|---------------|---------------|---------------|
| Desenvolvimento | Projeto Supabase DEV | `dev` | `*-dev.vercel.app` |
| Produção | Projeto Supabase PROD | `main` | Domínio customizado |

### 2.4 Repositórios GitHub

- `entreggo-front` — Aplicação frontend (Next.js)
- `entreggo-api` — Aplicação backend (Node.js + Express)

São dois repositórios independentes. Cada um tem seu próprio `package.json`, suas dependências, seu pipeline de deploy na Vercel e suas variáveis de ambiente.

---

## 3. Tipos de Usuário

| Tipo     | Acesso                          |
|----------|----------------------------------|
| Admin    | Painel administrativo completo    |
| Logista  | Painel da loja                    |
| Motoboy  | Painel do motoboy                 |

---

## 4. Fluxo de Cadastro e Aprovação

### 4.1 Cadastro (Landing Page ou Painel Admin)

O cadastro pode ser feito de duas formas:
1. **Pelo próprio usuário** na landing page (auto-cadastro)
2. **Pelo admin** no painel administrativo

#### Dados do Motoboy
- Nome completo
- Foto da moto (upload de imagem)
- Foto da habilitação/CNH (upload de imagem)
- Email
- Senha (criada no momento do cadastro)

#### Dados do Logista (Loja)
- Nome da loja
- Nome do dono
- Endereço da loja (completo, com CEP)
- Logo da loja (upload de imagem)
- Descrição da loja
- Email
- Senha (criada no momento do cadastro)

### 4.2 Fluxo de Aprovação

1. Usuário se cadastra → conta é criada com **status bloqueado**
2. Usuário consegue fazer login, mas vê uma tela de bloqueio informando que está aguardando aprovação
3. Admin acessa o painel, vê o cadastro pendente com os dados/documentos enviados
4. Admin aprova ou rejeita o cadastro
5. Se aprovado → bloqueio é retirado, usuário acessa normalmente
6. Se rejeitado → usuário continua bloqueado (admin pode informar motivo)

### 4.3 Datas registradas no perfil (visíveis apenas para o admin)

- **Data de cadastro** — quando o usuário se registrou
- **Data de aprovação** — quando o admin aprovou

---

## 5. Controle de Pagamento Interno (Apenas Admin)

O sistema possui um controle de pagamento mensal **interno**, visível apenas no painel admin. Não há cobrança automática nem integração financeira.

### 5.1 Campos por usuário (loja e motoboy)

- **Status de pagamento**: Pago / Pendente
- **Data de vencimento**: definida internamente pelo admin
- **Botão "Marcar como pago"**: o admin clica para registrar que o usuário pagou aquele mês
- **Histórico de pagamentos**: registro de meses pagos

### 5.2 Regras

- O controle de pagamento se aplica tanto a lojas quanto a motoboys (mesmo fluxo)
- Nenhuma informação de pagamento é visível para o logista ou motoboy
- O admin pode filtrar usuários por status de pagamento (em dia / atrasado)

---

## 6. Fluxo de Entrega

### 6.1 Solicitação (Loja)

1. Logista acessa o painel da loja
2. Clica em "Solicitar Entrega" (ou equivalente)
3. Preenche:
   - Endereço de destino (para onde a entrega vai)
   - Descrição/observação (opcional)
4. O sistema gera uma solicitação com os dados da loja (nome, logo, endereço da loja) + endereço de destino

### 6.2 Notificação (Motoboys)

1. A solicitação é enviada como **notificação push** para **todos os motoboys online**
2. A notificação deve ser chamativa e urgente (estilo Uber/99), com som e vibração
3. O motoboy vê na notificação e/ou no painel:
   - "Solicitação de serviço"
   - Nome e logo da loja
   - Endereço da loja (ponto de coleta)
   - Endereço de destino
4. O motoboy pode **Aceitar** ou **Recusar**

### 6.3 Aceite e Corrida

1. O primeiro motoboy que aceitar recebe a corrida
2. A solicitação é removida para os demais motoboys
3. Fluxo de status (atualizado pelo motoboy):
   - **Aceito** → motoboy aceitou, indo até a loja
   - **Coletou** → motoboy chegou na loja e coletou o pacote
   - **Em trânsito** → motoboy saiu da loja em direção ao destino
   - **Entregue** → motoboy confirmou a entrega

### 6.4 Expiração

- Se **nenhum motoboy aceitar em 1 minuto**, a solicitação expira
- Durante esse 1 minuto, exibir um indicador visual animado/interativo na tela da loja (ex: timer circular girando)
- Após expirar, exibir mensagem informando que nenhum motoboy aceitou
- Botão para "Solicitar novamente"

---

## 7. Painéis

### 7.1 Painel Admin

#### Dashboard / Insights
- Total de lojas cadastradas (ativas / bloqueadas)
- Total de motoboys cadastrados (ativos / bloqueados)
- Total de entregas realizadas (hoje, semana, mês)
- Entregas por loja (ranking)
- Entregas por motoboy (ranking)
- Cadastros pendentes de aprovação
- Gráficos de evolução (entregas ao longo do tempo)

#### Gestão de Lojas
- Lista de todas as lojas com busca e filtros
- Ver perfil completo (nome, dono, endereço, logo, descrição)
- Data de cadastro e data de aprovação
- Status: Ativo / Bloqueado / Pendente de aprovação
- Botão de Bloquear/Desbloquear
- Botão de Aprovar (para cadastros pendentes)
- Controle de pagamento: status, vencimento, botão "Marcar como pago"

#### Gestão de Motoboys
- Lista de todos os motoboys com busca e filtros
- Ver perfil completo (nome, foto da moto, foto da CNH)
- Data de cadastro e data de aprovação
- Status: Ativo / Bloqueado / Pendente de aprovação
- Botão de Bloquear/Desbloquear
- Botão de Aprovar (com visualização das fotos enviadas)
- Controle de pagamento: status, vencimento, botão "Marcar como pago"

#### Cadastro manual
- Formulário para cadastrar loja manualmente
- Formulário para cadastrar motoboy manualmente

### 7.2 Painel da Loja

#### Dashboard / Insights
- Total de entregas realizadas (hoje, semana, mês)
- Entregas em andamento (com status atual)
- Histórico de entregas (com detalhes: motoboy, horário, destino, status)

#### Solicitar Entrega
- Formulário com endereço de destino + observação
- Timer animado de 1 minuto aguardando aceite
- Feedback visual de aceite ou expiração

#### Perfil da Loja
- Visualizar e editar dados (nome, endereço, logo, descrição)

### 7.3 Painel do Motoboy

#### Tela Principal
- Solicitações de entrega em aberto (cards com info da loja + destino)
- Notificação push chamativa ao receber nova solicitação
- Botões Aceitar / Recusar em cada solicitação

#### Corrida em andamento
- Detalhes da corrida atual (loja, endereço coleta, endereço destino)
- Botões para atualizar status: Coletou → Em trânsito → Entregue

#### Histórico
- Lista de corridas realizadas (data, loja, destino, status)

#### Perfil
- Visualizar e editar dados básicos

---

## 8. Landing Page

### 8.1 Estrutura

Uma página única com duas seções principais:

#### Seção Loja
- Headline chamativa para lojistas (ex: "Suas entregas mais rápidas com o EntregGO")
- Breve descrição do benefício
- Formulário de cadastro:
  - Nome da loja
  - Nome do dono
  - Endereço da loja
  - Logo da loja (upload)
  - Descrição da loja
  - Email
  - Senha

#### Seção Motoboy
- Headline chamativa para motoboys (ex: "Ganhe mais fazendo entregas com o EntregGO")
- Breve descrição do benefício
- Formulário de cadastro:
  - Nome completo
  - Foto da moto (upload)
  - Foto da CNH (upload)
  - Email
  - Senha

### 8.2 Observações
- Design responsivo e chamativo
- Logo EntregGO no topo (a logo será enviada separadamente)
- Após cadastro, redirecionar para tela de bloqueio/aguardando aprovação

---

## 9. Notificações Push (Web)

### 9.1 Implementação
- Usar a **Web Push API** com **Service Workers**
- Ao logar, o motoboy autoriza notificações no navegador
- As push subscriptions são salvas no banco (Supabase)

### 9.2 Comportamento da notificação
- **Título**: "Nova solicitação de entrega!"
- **Corpo**: Nome da loja + endereço de destino resumido
- **Som/vibração**: ativados para chamar atenção (estilo Uber)
- **Ação ao clicar**: abre o painel do motoboy na solicitação correspondente

### 9.3 Considerações
- Motoboy precisa manter o navegador aberto ou ter o PWA instalado para receber push
- Considerar implementar como **PWA (Progressive Web App)** para melhor experiência em mobile
- Fallback: polling a cada poucos segundos no painel do motoboy para garantir que solicitações apareçam mesmo sem push

---

## 10. Banco de Dados (Supabase / PostgreSQL)

### 10.1 Tabelas Principais

#### `users`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| email | TEXT | Único |
| password_hash | TEXT | Hash da senha |
| role | ENUM | 'admin', 'logista', 'motoboy' |
| status | ENUM | 'pendente', 'ativo', 'bloqueado' |
| created_at | TIMESTAMP | Data de cadastro |
| approved_at | TIMESTAMP | Data de aprovação pelo admin (nullable) |

#### `stores` (lojas)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| name | TEXT | Nome da loja |
| owner_name | TEXT | Nome do dono |
| address | TEXT | Endereço completo |
| logo_url | TEXT | URL da logo no Supabase Storage |
| description | TEXT | Descrição da loja |

#### `couriers` (motoboys)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| full_name | TEXT | Nome completo |
| bike_photo_url | TEXT | URL da foto da moto |
| license_photo_url | TEXT | URL da foto da CNH |
| is_online | BOOLEAN | Se está disponível para receber solicitações |

#### `payments` (controle interno)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| due_date | DATE | Data de vencimento |
| paid | BOOLEAN | Se pagou aquele mês |
| paid_at | TIMESTAMP | Quando o admin marcou como pago (nullable) |
| reference_month | TEXT | Mês de referência (ex: '2026-05') |

#### `delivery_requests` (solicitações)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| store_id | UUID | FK → stores |
| destination_address | TEXT | Endereço de destino |
| notes | TEXT | Observações (nullable) |
| status | ENUM | 'aguardando', 'aceita', 'coletada', 'em_transito', 'entregue', 'expirada' |
| created_at | TIMESTAMP | Quando a solicitação foi criada |
| expires_at | TIMESTAMP | created_at + 1 minuto |
| courier_id | UUID | FK → couriers (nullable, preenchido ao aceitar) |
| accepted_at | TIMESTAMP | Quando o motoboy aceitou (nullable) |
| collected_at | TIMESTAMP | Quando o motoboy coletou (nullable) |
| delivered_at | TIMESTAMP | Quando o motoboy entregou (nullable) |

#### `push_subscriptions`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| subscription_json | JSONB | Objeto da push subscription do navegador |
| created_at | TIMESTAMP | Quando a subscription foi registrada |

---

## 11. API — Endpoints Principais

### Autenticação
- `POST /api/auth/register` — Cadastro (loja ou motoboy)
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout

### Admin
- `GET /api/admin/users` — Listar todos os usuários (com filtros)
- `PATCH /api/admin/users/:id/approve` — Aprovar cadastro
- `PATCH /api/admin/users/:id/block` — Bloquear/desbloquear
- `GET /api/admin/insights` — Dados do dashboard
- `POST /api/admin/users` — Cadastro manual (loja ou motoboy)
- `GET /api/admin/payments` — Listar controle de pagamentos
- `PATCH /api/admin/payments/:id/mark-paid` — Marcar como pago

### Lojas
- `GET /api/stores/me` — Dados da loja logada
- `PATCH /api/stores/me` — Editar dados
- `POST /api/deliveries` — Solicitar entrega
- `GET /api/deliveries/mine` — Histórico de entregas da loja
- `GET /api/stores/insights` — Insights da loja

### Motoboys
- `GET /api/couriers/me` — Dados do motoboy logado
- `PATCH /api/couriers/me` — Editar dados
- `PATCH /api/couriers/me/online` — Ficar online/offline
- `GET /api/deliveries/available` — Solicitações em aberto
- `PATCH /api/deliveries/:id/accept` — Aceitar solicitação
- `PATCH /api/deliveries/:id/status` — Atualizar status (coletou, em_transito, entregue)
- `GET /api/deliveries/history` — Histórico de corridas

### Notificações
- `POST /api/push/subscribe` — Registrar subscription push
- `DELETE /api/push/unsubscribe` — Remover subscription

---

## 12. Regras de Negócio

1. **Somente motoboys com status "ativo" e "online"** recebem notificações de solicitação
2. **Somente lojas com status "ativo"** podem solicitar entregas
3. **A primeira aceitação ganha** — quando um motoboy aceita, a solicitação é bloqueada para os demais (usar locking otimista ou transação no Supabase)
4. **Solicitação expira em 1 minuto** — após 60 segundos sem aceite, o status muda para "expirada"
5. **Usuário bloqueado** vê tela de bloqueio ao logar, não acessa funcionalidades
6. **Usuário pendente** vê tela de "aguardando aprovação" ao logar
7. **Controle de pagamento** é invisível para loja e motoboy — somente admin acessa
8. **Admin pode cadastrar** lojas e motoboys diretamente, já com status "ativo"

---

## 13. Segurança

- Autenticação via Supabase Auth (email + senha)
- Proteção de rotas por role (admin, logista, motoboy)
- Row Level Security (RLS) no Supabase para cada tabela
- Upload de arquivos validado (tipo, tamanho máximo)
- HTTPS obrigatório
- Variáveis de ambiente separadas para dev e prod

---

## 14. Resumo da Arquitetura de Deploy

**IMPORTANTE: Frontend e Backend são duas aplicações 100% independentes.** Repositórios separados, deploys separados, domínios separados. O frontend consome a API do backend via HTTPS/JSON. Não compartilham código, dependências ou processo de build.

```
  ┌──────────────────────┐          ┌──────────────────────┐
  │  GitHub               │          │  GitHub               │
  │  Repo: entreggo-front │          │  Repo: entreggo-api   │
  │                        │          │                        │
  │  branch dev ──► DEV   │          │  branch dev ──► DEV   │
  │  branch main ─► PROD  │          │  branch main ─► PROD  │
  └──────────┬─────────────┘          └──────────┬─────────────┘
             │                                    │
             ▼                                    ▼
  ┌──────────────────────┐          ┌──────────────────────┐
  │  Vercel (Projeto 1)  │          │  Vercel (Projeto 2)  │
  │  Frontend DEV / PROD │  ◄────►  │  Backend DEV / PROD  │
  │  app.entreggo.com.br │ REST/JSON│  api.entreggo.com.br │
  └──────────────────────┘          └──────────┬─────────────┘
                                               │
                                               ▼
                                    ┌──────────────────────┐
                                    │  Supabase             │
                                    │  - DB DEV / DB PROD   │
                                    │  - Auth               │
                                    │  - Storage            │
                                    │  - Realtime           │
                                    └──────────────────────┘
```

---

## 15. Checklist de Implementação

### Fase 1 — Base
- [ ] Criar repositório GitHub `entreggo-front` (aplicação frontend)
- [ ] Criar repositório GitHub `entreggo-api` (aplicação backend — separada do front)
- [ ] Setup Supabase (projeto DEV + PROD)
- [ ] Criar tabelas no banco de dados
- [ ] Configurar Supabase Auth
- [ ] Configurar Supabase Storage (buckets para fotos e logos)
- [ ] Deploy inicial do frontend na Vercel (projeto 1)
- [ ] Deploy inicial do backend na Vercel (projeto 2 — separado do front)

### Fase 2 — Autenticação e Cadastro
- [ ] Landing page com formulários de cadastro (loja + motoboy)
- [ ] Registro de usuários via API
- [ ] Login/logout
- [ ] Tela de bloqueio (aguardando aprovação)
- [ ] Upload de fotos (moto, CNH, logo)

### Fase 3 — Painel Admin
- [ ] Dashboard com insights
- [ ] CRUD de lojas
- [ ] CRUD de motoboys
- [ ] Aprovação de cadastros pendentes
- [ ] Bloqueio/desbloqueio
- [ ] Controle de pagamento interno

### Fase 4 — Painel da Loja
- [ ] Dashboard com insights de entregas
- [ ] Solicitar entrega (formulário + timer de 1 min)
- [ ] Histórico de entregas
- [ ] Editar perfil

### Fase 5 — Painel do Motoboy
- [ ] Tela de solicitações disponíveis
- [ ] Aceitar/recusar solicitação
- [ ] Gerenciar corrida em andamento (atualizar status)
- [ ] Histórico de corridas
- [ ] Status online/offline
- [ ] Editar perfil

### Fase 6 — Notificações Push
- [ ] Configurar Service Worker
- [ ] Registrar push subscriptions
- [ ] Enviar notificações ao criar solicitação
- [ ] Notificação chamativa com som/vibração

### Fase 7 — Polimento
- [ ] PWA (instalar como app no celular)
- [ ] Responsividade completa
- [ ] Testes
- [ ] Migrar dados para produção
