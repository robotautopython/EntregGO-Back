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
