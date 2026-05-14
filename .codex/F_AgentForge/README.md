# F_AgentForge — Fabrica de Agentes Perfeitos

> 5 supervisores que criam, calibram e validam agentes sob demanda.
> Nenhum deles implementa. Todos eles garantem que o agente certo
> nasca para cada tarefa.

---

## O Problema que Resolve

Agentes estaticos sao bons para tarefas recorrentes. Mas quando o projeto
precisa de algo que nenhum agente existente cobre perfeitamente — ou quando
a tarefa exige combinacao de competencias de varios agentes — voce precisa
de um agente sob medida.

A fabrica cria esse agente. Contextualizado no estado atual do projeto,
alinhado com as regras existentes, calibrado para a tarefa especifica,
e validado antes e depois da execucao.

---

## Os 5 Supervisores

```
F_Agent_Foreman.md         Orquestrador da fabrica
F_Agent_ContextScanner.md  Le projeto, status, regras, stack
F_Agent_AgentArchitect.md  Projeta estrutura, escopo, regras do agente
F_Agent_AgentComposer.md   Escreve o arquivo .md/.toml final
F_Agent_WorkAuditor.md     Valida o trabalho do agente criado
```

---

## Fluxo de Execucao

```
Pedido do usuario (ou do Camisa10)
        |
   F_Foreman — entende, classifica, coordena
        |
   F_ContextScanner — le o projeto inteiro, entrega relatorio
        |
   F_AgentArchitect — projeta blueprint do agente
        |
   F_AgentComposer — escreve o arquivo final
        |
   Agente criado executa as tasks
        |
   F_WorkAuditor — valida entrega, aprova ou rejeita
        |
   Feedback loop → ajusta agente se necessario
```

---

## Como Usar

### Invocacao simples
```
"Crie um agente para [tarefa]."
"Preciso de um agente que [faca X] considerando [Y]."
"Monte um agente para cobrir o fluxo de [A ate B]."
```

### Invocacao via Camisa10
```
"@C10, essa tarefa nao tem agente adequado. Acione a fabrica."
```

### Invocacao direta
```
"@F, crie um agente de auditoria de acessibilidade WCAG para o frontend."
```

---

## Integracao com a .codex/ Existente

A fabrica **nao substitui** nenhum agente existente. Ela os complementa
criando agentes dinamicos quando necessario.

Os agentes criados pela fabrica:
- Seguem o padrao de nomenclatura da .codex/
- Herdam o protocolo anti-alucinacao do AGENTS.md
- Respeitam CONSTITUTION.md e DECISIONS.md
- Se encaixam no pipeline existente
- Delegam para especialistas (@S, @P, @A, @V) quando necessario

---

## Quando NAO Usar

- A tarefa ja e coberta por um agente existente → use o existente
- A tarefa e trivial (cabe em um prompt de 3 linhas) → nao precisa de agente
- A tarefa e unica e nao vai se repetir → prompt direto e suficiente

---

## Prefixo e Mencao

- Prefixo de pasta e arquivo: `F_`
- Mencao no chat: `@F` (Forge/Fabrica)
- Pipeline: entra como camada de **meta-agente**, acima do pipeline de execucao
