# Referência da API Vercel — Environment Variables

Base URL: `https://api.vercel.com`
Auth Header: `Authorization: Bearer {VERCEL_TOKEN}`

---

## Autenticação e Validação de Token

### Verificar usuário autenticado
```http
GET /v2/user
```
**Uso:** Validar token antes de qualquer operação.

**Resposta de sucesso (200):**
```json
{
  "user": {
    "id": "usr_xxx",
    "name": "Israel",
    "email": "israel@email.com",
    "username": "israel"
  }
}
```

**Erros comuns:**
- `401` → Token inválido ou expirado
- `403` → Token sem permissão

---

## Projetos

### Listar projetos do usuário/time
```http
GET /v9/projects
```
Parâmetros: `?teamId={TEAM_ID}&limit=20`

### Buscar projeto por nome
```http
GET /v9/projects/{projectNameOrId}
```
Retorna `id`, `name`, `framework`, `rootDirectory`.

---

## Environment Variables

### Listar variáveis do projeto
```http
GET /v9/projects/{projectId}/env
```
Parâmetros opcionais:
- `?teamId={TEAM_ID}` → para projetos em equipe
- `?decrypt=true` → retorna valores descriptografados (requer permissão especial)

**Resposta:**
```json
{
  "envs": [
    {
      "id": "env_abc123",
      "key": "DATABASE_URL",
      "value": "",
      "type": "encrypted",
      "target": ["production", "preview"],
      "gitBranch": null,
      "configurationId": null,
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000
    }
  ],
  "pagination": {
    "count": 10,
    "next": null
  }
}
```

---

### Adicionar variável
```http
POST /v9/projects/{projectId}/env
Content-Type: application/json
```

**Body (variável única):**
```json
{
  "key": "MINHA_VARIAVEL",
  "value": "meu_valor_secreto",
  "type": "encrypted",
  "target": ["production", "preview", "development"]
}
```

**Body (múltiplas variáveis de uma vez):**
```json
[
  {
    "key": "DATABASE_URL",
    "value": "postgresql://...",
    "type": "encrypted",
    "target": ["production", "preview", "development"]
  },
  {
    "key": "NEXT_PUBLIC_APP_URL",
    "value": "https://meuapp.com",
    "type": "plain",
    "target": ["production"]
  }
]
```

**Tipos (`type`):**
| Tipo | Uso | Visibilidade |
|------|-----|--------------|
| `encrypted` | Secrets, tokens, senhas | Criptografado, exibível |
| `plain` | Configs públicas | Texto puro |
| `sensitive` | Ultra-secreto | Write-only, NUNCA exibido |

**Targets disponíveis:**
- `production` → ambiente de produção
- `preview` → pull requests e branches
- `development` → `vercel dev` local

**Resposta de sucesso (201):**
```json
{
  "created": {
    "id": "env_xyz789",
    "key": "MINHA_VARIAVEL",
    "type": "encrypted",
    "target": ["production", "preview", "development"]
  }
}
```

**Erros comuns:**
- `400` → Variável já existe (use PATCH para atualizar)
- `401` → Token inválido
- `403` → Sem permissão para este projeto

---

### Atualizar variável existente
```http
PATCH /v9/projects/{projectId}/env/{envId}
Content-Type: application/json
```

**Body:**
```json
{
  "value": "novo_valor",
  "type": "encrypted",
  "target": ["production", "preview", "development"]
}
```

**Nota:** O `envId` vem do campo `id` retornado no GET /env.

---

### Deletar variável
```http
DELETE /v9/projects/{projectId}/env/{envId}
```

**Resposta de sucesso (200):**
```json
{
  "id": "env_abc123",
  "key": "VARIAVEL_DELETADA"
}
```

⚠️ **IRREVERSÍVEL** — Confirmar com o usuário antes de executar.

---

## Times (Teams)

### Listar times do usuário
```http
GET /v2/teams
```

### Obter ID do time por slug
```http
GET /v2/teams?slug={team-slug}
```

---

## Deployments

### Forçar redeploy após mudanças de env
Após adicionar/editar variáveis, alertar o usuário:
> "⚠️ Mudanças em variáveis de ambiente só entram em vigor após um novo deploy.
> Acesse o Dashboard da Vercel > Deployments > Redeploy, ou faça um novo push."

### Listar deployments recentes
```http
GET /v6/deployments?projectId={projectId}&limit=5
```

---

## Códigos de Erro da API

| Código | Significado | Ação |
|--------|------------|------|
| 400 | Requisição inválida / var já existe | Verificar body ou usar PATCH |
| 401 | Token inválido ou expirado | Solicitar novo token ao usuário |
| 402 | Limite do plano atingido | Informar ao usuário |
| 403 | Sem permissão | Verificar escopos do token |
| 404 | Projeto ou variável não encontrada | Verificar IDs |
| 409 | Conflito (duplicata) | Usar PATCH em vez de POST |
| 429 | Rate limit atingido | Aguardar e tentar novamente |
| 500 | Erro interno da Vercel | Tentar novamente ou contatar suporte |

---

## Criação de Token na Vercel

Orientar o usuário a criar um token em:
`https://vercel.com/account/tokens`

**Configurações recomendadas:**
- **Nome:** `env-manager-[projeto]` (identificável)
- **Escopo:** Específico para o time/projeto se possível
- **Expiração:** Definir prazo (não deixar "No expiration" em produção)

---

## Rate Limits da API

- Geral: 60 requisições/minuto por token
- Environment variables: Sem limite específico documentado
- Em caso de 429: aguardar 60 segundos antes de tentar novamente
