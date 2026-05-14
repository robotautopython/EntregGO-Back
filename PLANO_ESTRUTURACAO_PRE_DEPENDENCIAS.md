# PLANO - Estruturacao Pre-Dependencias EntregGO

**Data:** 2026-05-14
**Fase:** fundacao
**Objetivo:** organizar a base dos dois repositorios antes de instalar dependencias ou escrever funcionalidades.

## Proximo Passo Natural

O proximo passo natural e executar o ciclo **M-00A - Estrutura antes das dependencias**.

Isso significa criar a planta baixa dos dois ambientes, documentar contratos e preparar os arquivos que vao guiar a instalacao futura de dependencias. Ainda nao vamos implementar regra de negocio, auth, banco, push, dashboard ou telas completas.

## Por Que Antes das Dependencias

- Evita instalar pacotes sem saber exatamente onde cada responsabilidade vai viver.
- Garante que front e back continuem desacoplados.
- Evita secrets no frontend.
- Deixa claro quais arquivos podem ser criados agora e quais dependem de validadores.
- Cria um rastro de decisao para o projeto ser retomavel sem depender de memoria do chat.

## Escopo do M-00A

### 1. Governanca dos dois repositorios

Criar ou espelhar nos dois diretorios:

- `PROJECT.md`
- `STATUS.md`
- `LOG.md`
- `DECISIONS.md`
- `LEARNINGS.md`
- `AGENTS.md`

Regra: cada repositorio deve conseguir explicar seu proprio contexto sem depender do outro estar aberto.

### 2. Estrutura de pastas sem dependencias

Backend esperado:

```txt
src/
  config/
  controllers/
  jobs/
  middlewares/
  routes/
  services/
  types/
  utils/
  validators/
supabase/
  migrations/
tests/
```

Frontend esperado:

```txt
public/
  icons/
  sounds/
src/
  app/
    admin/
    aguardando-aprovacao/
    login/
    loja/
    motoboy/
    registro/
  components/
    admin/
    delivery/
    landing/
    layout/
    shared/
    ui/
  hooks/
  lib/
  styles/
  types/
tests/
```

### 3. Arquivos placeholder permitidos

Permitido criar:

- `.gitkeep` em pastas vazias
- `.env.example`
- `README.md` com instrucoes do repositorio
- `CONTRACTS.md` com padrao de resposta da API e fronteiras front/back
- `STRUCTURE.md` com a estrutura de pastas e responsabilidades

Nao criar ainda:

- `package.json`
- `node_modules`
- `package-lock.json`
- codigo de auth real
- codigo de push real
- migrations finais sem revisao de seguranca
- chamadas reais ao Supabase

### 4. Contratos minimos a documentar antes do codigo

Padrao de sucesso:

```json
{
  "success": true,
  "data": {},
  "message": "Operacao realizada com sucesso"
}
```

Padrao de erro:

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

Status de dominio:

- Usuario: `pendente`, `ativo`, `bloqueado`
- Role: `admin`, `logista`, `motoboy`
- Entrega: `aguardando`, `aceita`, `coletada`, `em_transito`, `entregue`, `expirada`, `cancelada`

### 5. Variaveis de ambiente a documentar

Frontend:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

Backend:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
FRONTEND_URL=
NODE_ENV=
```

Regra: variaveis privadas nunca aparecem no frontend.

## Criterios de Aceite do M-00A

- Back e front possuem arquivos de governanca.
- Estrutura de pastas existe sem dependencias instaladas.
- `.env.example` existe nos dois repositorios, sem secrets reais.
- `README.md`, `STRUCTURE.md` e `CONTRACTS.md` existem onde fizer sentido.
- `STATUS.md` e `LOG.md` foram atualizados.
- Nenhum `package.json` ou dependencia foi criado nesta etapa.

## Brief para o Cetico

**Tarefa:** Estruturar os repositorios EntregGO-Back e EntregGO-Front antes de instalar dependencias.
**Fase atual:** fundacao
**Arquivos envolvidos:** governanca, README, STRUCTURE, CONTRACTS, `.env.example`, pastas vazias com `.gitkeep`
**Dependencias:** nenhuma dependencia deve ser instalada nesta etapa.
**Evidencias ja levantadas:** documentacoes funcional/tecnica, PROJECT, STATUS, LOG, agentes Camisa10 e PromptRefiner.
**Lacunas conhecidas:** ainda nao ha codigo, package manifests, migrations, Supabase real, Vercel real ou logo final.
**Plano de implementacao:**
  1. Espelhar governanca minima no front.
  2. Criar estrutura de pastas do back e front sem instalar dependencias.
  3. Criar `.env.example` seguro para cada repo.
  4. Criar README/STRUCTURE/CONTRACTS documentando responsabilidades e contratos.
  5. Atualizar STATUS e LOG.
**Riscos que ja identifiquei:** criar estrutura demais antes do codigo; confundir env publica e privada; documentar contrato que depois sera esquecido na implementacao.

## Veredito Inicial

**Cetico:** APROVADO COM RESSALVAS, porque a etapa e documental/estrutural e nao altera codigo funcional. Revalidar quando houver arquivos reais de runtime.

**ImpactValidator:** APROVADO COM RESSALVAS. Impacto baixo se nao houver dependencias nem regra de negocio. Exigir Security Validator antes de auth, RLS, uploads, push e secrets reais.

