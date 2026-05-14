# STRUCTURE - EntregGO API

Estrutura planejada para o backend antes da instalacao de dependencias.

```txt
src/
  config/        # configuracoes server-side e clients internos
  controllers/   # handlers HTTP por dominio
  jobs/          # jobs e rotinas agendadas
  middlewares/   # autenticacao, autorizacao, validacao e erros
  routes/        # definicao das rotas /api/*
  services/      # regras de negocio e integracoes internas
  types/         # tipos compartilhados do backend
  utils/         # helpers reutilizaveis
  validators/    # schemas de validacao server-side
supabase/
  migrations/    # migrations versionadas do banco
tests/           # testes automatizados futuros
```

Pastas ainda vazias devem manter `.gitkeep` ate receberem arquivos reais.
