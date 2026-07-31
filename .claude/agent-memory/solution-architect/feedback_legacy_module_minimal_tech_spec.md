---
name: feedback-legacy-module-minimal-tech-spec
description: Para módulos legados sem TECH-SPEC/MANIFEST prévio, criar um TECH-SPEC focado só na regra sendo alterada, não retroagir sobre o módulo inteiro
metadata:
  type: feedback
---

Quando um módulo legado não tem `Docs/TECH-SPEC.md` nem `MANIFEST.md` e o usuário pede
uma mudança pontual de regra de negócio, o TECH-SPEC criado deve cobrir **apenas** a
regra em questão (o entrypoint e a regra que estão mudando), não documentar o módulo
inteiro retroativamente.

**Why:** confirmado explicitamente pelo usuário (Roque) no caso de
[[project-gafisa-purchase-contract-budget]] — pedido era "não precisa retroatividade
documentar o módulo inteiro". Documentar tudo de uma vez é trabalho não pedido e atrasa
a entrega da regra que efetivamente importa agora.

**How to apply:** ao detectar módulo legado sem TECH-SPEC, siga o formato de seções já
usado em outros TECH-SPECs do workspace (ex.: `PropertyAllocation/Docs/TECH-SPEC.md` —
título com nome do módulo + cliente, seções por entrypoint, referência a
`[MANIFEST.md]` quando há objetos cadastrados), mas escreva só a seção da regra pedida.
Se não há MANIFEST existente e a mudança não introduz objeto novo (campo/registro/script
custom), não é preciso acionar o `manifest-builder` — registre isso explicitamente na
conversa para o usuário confirmar que realmente não há objeto novo antes de pular esse
passo.
