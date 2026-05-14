# DIARY TEMPLATE — [NOME_DO_AGENTE]

> Diario de execucoes deste agente. Cada vez que ele e acionado,
> o resultado e registrado aqui. Isso permite que o agente aprenda
> com suas proprias experiencias e que a fabrica identifique padroes
> de falha ou sucesso.
>
> Criado automaticamente pelo Foreman no momento da promocao.
> Atualizado pelo WorkAuditor ao final de cada auditoria.

---

## Ficha do Agente

- **Nome:** [nome]
- **Prefixo:** [prefixo]
- **Area:** [areas cobertas]
- **Criado em:** [data]
- **Versao atual:** 1.0
- **Total de execucoes:** 0
- **Taxa de aprovacao:** —

---

## Historico de Versoes

| Versao | Data | O que mudou | Motivo | Aprovado por |
|---|---|---|---|---|
| 1.0 | [data] | Criacao e promocao | Fabrica + usuario | WorkAuditor |

---

## Registro de Execucoes

### Execucao #N — [DATA]

```
Tarefa: [o que foi pedido]
Contexto: [fase do projeto, arquivos envolvidos]
Veredito WorkAuditor: [APROVADO | RESSALVA | REPROVADO]
Ressalvas: [se houver]
Aprendizado: [o que este agente aprendeu com esta execucao]
Contribuiu para COLLECTIVE_MEMORY: SIM | NAO
```

<!-- Copiar o bloco acima para cada nova execucao -->

---

## Padroes Observados

Apos 3+ execucoes, o WorkAuditor pode identificar padroes:

```
Ponto forte: [o que este agente faz consistentemente bem]
Ponto fraco: [onde ele tende a falhar ou ser parcial]
Sugestao de evolucao: [o que melhoraria o agente]
```
