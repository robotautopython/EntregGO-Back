# LEARNINGS - EntregGO

## 2026-05-14 - Validacao atual e documental

Como ainda nao existe codigo, manifests, migrations ou testes, qualquer aprovacao do Cetico/ImpactValidator nesta etapa vale apenas para a arquitetura e o plano de fundacao. Assim que o scaffolding existir, os planos devem ser revalidados contra arquivos reais.

## 2026-05-14 - Auditoria de dependencias frontend precisa de ciclo proprio

Ao instalar a fundacao Next/PWA, `npm audit` reportou vulnerabilidades transitivas cuja correcao automatica exige upgrades quebraveis de Next e next-pwa. Como o escopo desta etapa era scaffolding e nao hardening de dependencias, a correcao deve virar ciclo proprio com Security Validator antes de push/PWA real.

## 2026-05-14 - RLS base deve nascer conservadora

No M-01, as tabelas com PII e relacao de usuario foram criadas antes do auth real. O padrao adotado foi habilitar RLS em todas as tabelas, conceder apenas `select` onde necessario e deixar escritas para o backend com service role. Isso reduz exposicao acidental pela anon key, mas exige uma revisao dedicada no ciclo de auth/cadastro para transformar policies de fundacao em policies finais testadas contra fluxos reais.

## 2026-05-14 - Aplicacao manual de migration precisa de smoke remoto

A migration M-01 foi aplicada manualmente no Supabase pelo usuario. Como o Codex nao executou uma validacao remota contra o banco, o proximo ciclo deve incluir smoke tests controlados: confirmar tabelas/enums/policies, testar leitura negada sem sessao, leitura propria com usuario autenticado e ausencia de acesso client-side a `payments`.

## 2026-05-14 - Smoke remoto depende de credencial adequada ao tipo de validacao

O smoke REST da M-01 nao conseguiu autenticar porque a variavel local `SUPABASE_SERVICE_ROLE_KEY` nao foi aceita pelo Supabase REST e nao tinha formato JWT de service role. Para validar catalogo completo de enums, constraints, indices, RLS e policies, REST nao basta; o ciclo precisa de uma URL Postgres read-only ou ferramenta equivalente (`psql`, Supabase CLI ou pacote `pg` com connection string). Isso evita confundir falha de autenticacao com falha de schema.

## 2026-05-14 - Secrets colados no chat devem ser rotacionados

Uma chave Supabase service role foi colada no chat durante o desbloqueio do smoke remoto. Mesmo que a intencao seja ajudar o agente, chat nao e cofre de secrets. O padrao correto e: rotacionar a chave exposta, registrar somente o incidente sem valor sensivel, inserir a nova chave em `.env.local` ignorado pelo Git ou secret manager, e reexecutar o smoke sem imprimir credenciais.

## 2026-05-14 - RLS de usuario final precisa de sessao real

O catalogo SQL validou policies e grants da M-01, e o REST validou service role e negacao de anon. Porem tokens `authenticated` sinteticos retornaram `401`, entao o teste de visibilidade real por usuario deve usar uma sessao Supabase Auth criada pelo fluxo M-02. Isso evita confundir autenticacao invalida com policy RLS incorreta.

## 2026-05-14 - Cadastro backend com Auth e dominio exige compensacao

O M-02A cria primeiro o usuario no Supabase Auth e depois o usuario/perfil de dominio via service role. Como essa sequencia nao e uma transacao unica entre Auth e PostgREST, falhas parciais precisam de compensacao: se o dominio/perfil falhar apos Auth, o backend tenta remover o usuario Auth em best effort e retorna erro estavel sem vazar detalhe interno. Um ciclo futuro pode substituir isso por RPC transacional para a parte de dominio, mas Auth ainda segue fora da transacao SQL.

## 2026-05-14 - Gate RLS autenticado nao deve criar lixo remoto sem limpeza

O M-02B ja permite login com sessao real, mas validar RLS autenticado de ponta a ponta por automacao exigiria criar usuario Auth e linhas de dominio no Supabase remoto. Enquanto a rotacao da service role exposta nao estiver confirmada e nao houver ferramenta/endpoint de limpeza controlada, o caminho seguro e manter o smoke autenticado bloqueado e registrar apenas verificacoes read-only de anon e inferencias por migration/codigo.

## 2026-05-14 - Rotacao de service role nao e inferivel pelo repositorio

Presenca e formato local de `SUPABASE_SERVICE_ROLE_KEY` nao provam que uma chave exposta em chat foi rotacionada. Sem o valor antigo em um canal seguro para comparacao, evento auditavel no Supabase/secret manager ou confirmacao explicita do operador, o ciclo correto e parar antes de usar a credencial. Esse gate deve acontecer antes de scripts de smoke que criem usuario real ficticio, mesmo quando a limpeza ja estiver planejada.

## 2026-05-14 - Anon 401 sozinho nao prova RLS correta

O smoke autenticado real mostrou que uma negacao `401` para anon/read-only nas tabelas de dominio e uma evidencia operacional importante, mas nao basta para provar que as policies RLS estao corretas. No ciclo de hardening, a sessao real gerada pelo Supabase Auth foi aceita pelo backend, porem REST com chave publica anon e Bearer do usuario retornou `401` antes de validar a visibilidade propria em `users`. O proximo ciclo deve primeiro corrigir ou substituir a chave publica anon/configuracao de Auth/REST e so entao repetir os testes RLS. A leitura anon negada deve ser registrada como parcial ate existir tambem um caminho autenticado positivo pelo client.

## 2026-05-14 - Supabase keys modernas mudam a validacao de formato

Supabase agora diferencia publishable keys (`sb_publishable_...`) para componentes publicos e secret keys (`sb_secret_...`) para backend. A secret key moderna substitui a antiga `service_role` JWT em fluxos backend, mas nao tem formato JWT. Validadores e smokes nao devem exigir que `SUPABASE_SERVICE_ROLE_KEY` seja sempre `eyJ...`; devem aceitar `sb_secret_...` para backend e rejeitar qualquer `sb_secret_...` em variaveis `NEXT_PUBLIC_*`. No frontend, `NEXT_PUBLIC_SUPABASE_ANON_KEY` pode ser uma publishable key moderna ou a legacy anon JWT. O smoke so aprovou quando o backend usou `sb_secret_...` e o frontend usou `sb_publishable_...` no arquivo correto.

## 2026-05-15 - UI admin deve ser honesta quando o backend ainda nao existe

A Track A do admin frontend mostrou um bom padrao para avancar interface sem fingir funcionalidade: reutilizar endpoints reais ja validados (`GET /api/admin/users`, `PATCH approve/block/unblock`) e deixar abas futuras como placeholders explicitos com o endpoint faltante e o validador necessario. Isso evita dashboard mockado, exposicao prematura de PII e acoes de pagamento sem persistencia. O proximo backend deve priorizar o menor contrato real que destrava valor: detalhe expandido de usuario sem documentos sensiveis.

## 2026-05-15 - Detalhe admin expandido deve selecionar so campos permitidos

Ao criar `GET /api/admin/users/:id`, o risco principal era retornar perfis completos de `stores`/`couriers` e vazar `logo_url`, `bike_photo_url` ou `license_photo_url`. O padrao adotado foi criar tipos administrativos sanitizados e selects explicitos sem campos de Storage. Isso deixa a API util para o drawer sem antecipar pipeline de signed URLs, auditoria LGPD ou RLS de Storage.

## 2026-05-15 - Insights minimos nao autorizam dashboard complexo

`GET /api/admin/insights` destrava uma tela operacional enxuta porque retorna agregados pequenos e pendentes limitados sem PII. Qualquer evolucao para ranking, historico, graficos pesados, cache, polling, realtime ou consultas sobre entregas/pagamentos deve ser tratada como novo contrato e passar por Performance Validator antes da implementacao.

## 2026-05-15 - Smoke pos-deploy precisa validar front e back em separado

O ciclo de `/admin/insights` mostrou dois modos de deploy stale diferentes: primeiro o frontend publicado ainda servia o placeholder antigo, depois o frontend correto chamava uma rota backend ainda inexistente em producao e recebia `404`. O gate seguro ficou em tres sinais independentes: bundle do frontend contendo `/api/admin/insights`, backend sem token retornando `401 AUTH_REQUIRED`, e sessao admin ativa retornando `200` no navegador. Tambem ficou reforcado que headers `Authorization`, cookies e payloads sensiveis nao devem ser colados em relatorios de smoke; apos exposicao parcial de token, a higiene recomendada e renovar a sessao.

## 2026-05-15 - Corrigir asset estatico deve continuar pequeno

O `favicon.ico` faltante era uma correcao operacional de baixo risco. O aprendizado foi manter o escopo no arquivo estatico necessario, usando o asset oficial existente, sem abrir ciclo de PWA, manifest, redesign ou dependencia nova. Esse padrao reduz ruido de observabilidade sem deslocar o roadmap sensivel de auth, uploads, pagamentos e performance.

## 2026-05-15 - Fechamento de dependencia frontend precisa atualizar status cross-stack

A migracao do frontend para Next 15 nao altera contratos backend, mas muda o estado operacional do projeto inteiro: o bloqueio antigo de `next@14.2.35` deixa de ser verdadeiro e o risco real passa a ser o residual moderado de PostCSS embutido no Next 15. O padrao correto e atualizar tambem o STATUS/LOG do backend quando ele serve como painel cross-stack, deixando claro que nao houve mudanca funcional no backend.

## 2026-05-15 - Criacao de entrega nao deve liberar descoberta por RLS

Ao abrir `POST /api/deliveries`, a tentacao natural seria aproveitar a policy M-01 que deixava motoboys ativos/online verem entregas `aguardando`. Para a M-04A isso seria antecipar pool, realtime e aceite concorrente sem os validadores certos. O padrao correto e criar a entrega via backend/service role e endurecer RLS no mesmo patch: cliente autenticado e ativo le apenas entregas da propria loja ou ja atribuidas ao proprio motoboy.

## 2026-05-15 - Smoke com service role precisa isolar clientes de auth

**Tipo:** Armadilha
**Fase:** fundacao/auth-operacao
**Contexto:** Validacao pos-migration da M-04A com usuarios Auth reais ficticios e chamadas RLS autenticadas.

### O que aconteceu
O smoke usava o mesmo client Supabase criado com service role para gerar sessoes reais via `signInWithPassword`. Depois das sessoes, escritas diretas auxiliares em `delivery_requests` passaram a falhar com `42501 permission denied for table delivery_requests`. O cleanup tambem precisava validar `result.error`, nao apenas excecoes.

### Por que aconteceu
Clients Supabase que fazem login de usuario nao devem ser reutilizados como client administrativo no mesmo fluxo. Alem disso, chamadas Supabase podem retornar erro no objeto de resposta sem lancar excecao.

### Como foi resolvido
O smoke passou a criar um client anon/publishable novo para cada login temporario, preservando o client service-role para criacao e limpeza administrativa. O cleanup agora checa explicitamente `result.error` em cada grupo e a varredura residual confirmou zero recursos ficticios.

### O que fazer diferente da proxima vez
Em smokes com service role, separar client administrativo, client anon e clients autenticados por usuario. Todo cleanup deve validar erro retornado pela SDK e fazer uma varredura final por prefixo ficticio antes de marcar o ciclo como fechado.

### Impacto no projeto
A validacao M-04A ficou mais confiavel e o risco de deixar dados temporarios remotos foi reduzido. A correcao ficou restrita ao script de smoke e nao alterou contrato, migration ou regra de negocio.

## 2026-05-15 - Contrato opcional precisa passar pelo banco antes da UI

**Tipo:** Padrao
**Fase:** fundacao/auth-operacao
**Contexto:** Ajuste cross-stack para tornar `destinationAddress` opcional em `POST /api/deliveries`.

### O que aconteceu
O primeiro gate bloqueou a mudanca porque a migration M-01 definia `delivery_requests.destination_address` como `NOT NULL` e ainda tinha check de texto nao vazio. O ciclo so avancou depois de abrir uma migration propria para relaxar a coluna.

### Por que aconteceu
Validacao Zod e UI nao bastam quando o contrato desejado muda a nulabilidade real do dado persistido. Se o banco continuar `NOT NULL`, o backend pode aceitar o request mas falhar ao gravar.

### Como foi resolvido
A M-04C tornou a coluna nullable, trocou o check por `null` ou texto nao vazio, e o backend passou a normalizar valores ausentes/vazios para `null`.

### O que fazer diferente da proxima vez
Para qualquer opcionalidade nova em payload persistido, checar migration, tipo de dominio, validator, service, testes e consumidor frontend antes de editar a UI.

### Impacto no projeto
O contrato ficou coerente de ponta a ponta localmente sem liberar aceite, realtime, push, cron, historico, cancelamento ou expiracao.

---

## 2026-05-15 - Service role nao herda isolamento da RLS; filtrar tenant na query

**Tipo:** Armadilha
**Fase:** fundacao/auth-operacao
**Contexto:** Implementacao de `GET /api/deliveries` (M-05) para listar entregas da loja autenticada.

### O que aconteceu
A policy M-04A `delivery_requests_select_own_store_or_assigned_courier` ja restringe leitura por loja, mas o backend consulta `delivery_requests` via `getSupabaseAdminClient()` (service role). Service role ignora RLS, entao a policy nao protege a leitura server-side da listagem.

### Por que aconteceu
RLS so atua em conexoes client-side com chave anon/usuario. Confiar na RLS para um endpoint que usa service role criaria um vazamento multi-tenant silencioso (uma loja veria entregas de outra).

### Como foi resolvido
O isolamento foi garantido explicitamente no codigo: derivar `store_id` de `stores.user_id = domainUser.id` e aplicar `.eq('store_id', store.id)` na query. Testes assertam a chamada `eq('store_id', <loja da sessao>)` e a ausencia de `store_id`/`courier_id` no `select` e na resposta.

### O que fazer diferente da proxima vez
Para qualquer leitura/escrita server-side com service role, tratar a RLS apenas como defesa em profundidade do client-side e sempre filtrar o tenant explicitamente na query. Nao usar a existencia de uma policy como prova de isolamento de endpoint backend.

### Impacto no projeto
Listagem M-05 entregue com isolamento multi-tenant verificado por teste, sem migration/RLS, mantendo aceite, realtime, push, cron, historico e detalhe unico fora de escopo.

## 2026-05-16 - Smoke pos-deploy autenticado deve apontar explicitamente para producao

**Tipo:** Padrao
**Fase:** fundacao/auth-operacao
**Contexto:** Fechamento pos-deploy da M-05 com `GET /api/deliveries`.

### O que aconteceu
O smoke Auth/RLS validava corretamente dados reais e sessoes reais, mas por padrao subia a API buildada localmente. Isso provava o codigo local e o banco, mas nao fechava sozinho o deploy da Vercel.

### Por que aconteceu
Smokes que nasceram para pos-migration local tendem a acoplar criacao de dados reais com API local. Quando o objetivo vira pos-deploy, o mesmo fluxo precisa apontar para a URL publicada sem imprimir credenciais.

### Como foi resolvido
`scripts/smoke-auth-rls.mjs` passou a aceitar `SMOKE_API_BASE_URL`; quando a variavel existe, o script usa a API externa e nao sobe servidor local. Sem a variavel, o comportamento local continua igual.

### O que fazer diferente da proxima vez
Todo smoke reutilizavel deve declarar explicitamente o alvo validado: API local, ambiente de producao ou ambos. Fechamento pos-deploy so deve ser registrado depois de chamada autenticada contra a URL publicada.

### Impacto no projeto
A M-05 foi fechada contra producao sem expor tokens, cookies, headers ou secrets, e o script ficou reaproveitavel para proximos smokes pos-deploy.

## 2026-05-16 - "Nao aparece" pode ser ausencia no contrato, nao bug de UI

**Tipo:** Padrao
**Fase:** fundacao/auth-operacao
**Contexto:** Queixa de que o nome da loja nao aparece no painel admin nem na visao do motoboy.

### O que aconteceu
O suspeito obvio era o frontend, mas a investigacao read-only mostrou que o drawer admin (`UserDetailDrawer.tsx:355`) ja renderiza `profile.name` e o backend de detalhe (`getUserDetail`) ja seleciona `name`. A lacuna real do admin esta no contrato de listagem `GET /api/admin/users`, que so devolve `DomainUser`. No motoboy, o dado e mock e nao existe contrato backend de loja para esse ator.

### Por que aconteceu
"Campo nao aparece" tende a ser lido como bug de render. Quando a tela ja referencia o campo, a causa costuma estar a montante: o endpoint de listagem nao entrega o dado, ou o ator nao tem contrato para aquele dado.

### Como foi resolvido
Diagnostico registrado sem codigo. Admin virou tarefa cirurgica de contrato (incluir nome na listagem sem N+1, com ImpactValidator + PerformanceValidator). Motoboy virou backlog do ciclo de aceite com SecurityValidator (PII/contrato entre atores).

### O que fazer diferente da proxima vez
Antes de editar a tela, rastrear o contrato/endpoint que alimenta o campo. Incluir campo em endpoint de listagem e mudanca de contrato (risco N+1/payload), nao ajuste cosmetico. Expor dado de um ator a outro (loja -> motoboy) e sempre gate de SecurityValidator.

### Impacto no projeto
Evita editar UI que ja esta correta, separa correcao cirurgica (admin) de feature sensivel (motoboy) e mantem o roadmap de aceite/PII no padrao com validadores.

## 2026-05-16 - Enriquecer listagem com embed 1:1 evita N+1

**Tipo:** Padrao
**Fase:** fundacao/auth-operacao
**Contexto:** Incluir `store_name` em `GET /api/admin/users` sem multiplicar queries.

### O que aconteceu
A queixa do nome da loja na listagem admin foi resolvida com o embed PostgREST `stores(name)` no mesmo `select` paginado/contado, em vez de buscar o detalhe por linha no frontend.

### Por que funciona
`stores.user_id` e `unique` (relacao 1:1 com `users`), entao o embed resolve por FK numa unica ida ao banco, sem N+1 e sem novo indice. O campo exposto (`name`) ja era visivel ao mesmo ator (admin) no detalhe, entao nao ha PII nova.

### O que fazer diferente da proxima vez
Para enriquecer listagem com dado de tabela relacionada: preferir embed na query existente; normalizar o retorno (objeto ou array) e remover a chave de relacao da resposta; criar tipo dedicado de item de listagem em vez de inflar o tipo base compartilhado; confirmar que o campo ja e permitido ao ator e passar PerformanceValidator pelo risco de N+1/payload.

### Impacto no projeto
Listagem admin mostra a loja sem regressao de performance, sem migration/RLS e sem vazar campos de Storage; o tipo base `DomainUser` permaneceu intacto para os demais contratos.

## 2026-05-16 - Aceite com service role precisa de condicao completa no update

**Tipo:** Padrao
**Fase:** fundacao/auth-operacao
**Contexto:** Fatia 1 do ciclo de aceite do motoboy.

### O que aconteceu
O backend liberou descoberta de entregas disponiveis e aceite por motoboy sem reabrir RLS. Como o endpoint usa service role, a autorizacao do banco nao filtra automaticamente linhas visiveis para o usuario.

### Por que funciona
A descoberta aplica filtro server-side por `status='aguardando'`, `courier_id is null` e `expires_at > now()`. O aceite repete essas condicoes no proprio `UPDATE`, junto do `id`, e so entao seta `status='aceita'`, `courier_id` e `accepted_at`. Se zero linhas mudam, uma unica releitura por `id` decide entre inexistente, idempotente, aceito por outro ou expirado.

### O que fazer diferente da proxima vez
Em qualquer transicao concorrente, a regra de elegibilidade precisa estar no `UPDATE`, nao em um `SELECT` anterior. Releituras depois do update servem apenas para resposta/idempotencia, nunca para decidir antes de gravar.

### Impacto no projeto
A primeira fatia de aceite fica testavel sem banco real e sem migration/RLS nova. Realtime, push, cron, cancelamento e status pos-aceite continuam fora do caminho critico ate existirem contratos e validadores proprios.
