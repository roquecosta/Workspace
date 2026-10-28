---
name: project-drivetech-ppc-oracle-import
description: Drivetech ProjectPriceComposition — import de orçamento (CSV, origem Oracle) com fan-out multi-camada, árvore hierárquica (Grupo CPV) e processamento em Map/Reduce — FECHADO no TECH-SPEC
metadata:
  type: project
---

Projeto Drivetech, `ProjectPriceComposition` (CPV). TECH-SPEC em
`Drivetech/src/FileCabinet/SuiteScripts/Dome/ProjectPriceComposition/Docs/TECH-SPEC.md`,
MANIFEST na mesma pasta. v1 MVP já fechado (9 camadas MP/MM/SC/DP/EP/EC/MF/GP/FD, cascata,
AUXILIAR, Comissão por Faixa, import CSV por camada — `importLayerCSV`).

**Extensão fechada em 2026-10-27 (2 rodadas):** botão "Importar Orçamento" na aba
CCPV-Resumo + nova visualização em árvore hierárquica (Grupo CPV). Estado final após
revisão (o formato do arquivo e a arquitetura de processamento mudaram numa 2ª rodada,
depois que a implementação já ia começar):

1. **Formato final: `.csv`** (não `.xlsx` — mudou na 2ª rodada), mesmo delimitador `;`/
   decimal `,` do CSV de camada existente, reaproveita `Utils/csvParser.util.js`. "Oracle"
   só aparece como citação de fonte (`Docs/aplicativo orçamento_Oracle.csv`), nunca em nome
   de ação/botão/seção — ação Restlet chama-se `importBudgetFile`.
2. Fan-out multi-camada num único arquivo. Convive com `importLayerCSV`, não substitui.
3. **Mapeamento Subgrupo → Camada (não Categoria de topo — Categoria mistura tudo, 8
   categorias de topo com 174 subgrupos no total):** hardcoded no script, cobrindo hoje só
   um seed de 10 subgrupos de alta/média confiança (MATERIAIS MONTAGEM→MM, SUB
   CONTRATADOS→SC, DESPESAS→DP, LOGÍSTICA→DP, CHAPARIA→MP, BARRAMENTO→MP, TINTAS E
   PINTURA→MP, REDE-SWITCH/PATCH CORDS/CABOS DE REDE→MP, MISCELÂNEAS POR COLUNA→MP,
   COMISSIONAMENTO E STARTUP→EC). Usuário não tem a lista completa e não vai fechar agora.
   **Fallback confirmado:** qualquer subgrupo fora da lista (não só "OUTROS") é rejeitado e
   reportado ("subgrupo sem mapeamento conhecido: X") — nunca cai numa camada "catch-all"
   (rejeitado explicitamente como opção, por poder computar custo/imposto errado na
   cascata). Subgrupos ainda sem mapeamento: MISCELÂNEAS, MÁQUINAS HVAC, SERVIÇOS CCM,
   SERVIÇOS PAINÉIS, SERVIÇOS AUXILIARES, MONTAGEM EM CAMPO, OUTROS.
4. **Processamento migrou de síncrono (Restlet) para Map/Reduce** na 2ª rodada, por pedido
   do usuário (percebeu que a criação dos registros filhos podia ser pesada). Pegadinha
   técnica identificada e resolvida: a inferência de hierarquia depende da ORDEM das
   linhas, que o `map` (paralelo) não preserva — solução: resolver hierarquia + mapeamento
   + criação/reaproveitamento de Grupo CPV **sequencialmente no `getInputData`**; `map`
   só cria linha-folha (paralelo, sem lógica de hierarquia); `summarize` recalcula a
   cascata uma vez e libera o lock.
5. **Lock por Proposta** (não global como o da Exclusão) — permite importações simultâneas
   em Propostas diferentes, impede duas na mesma Proposta. Mesma semântica de
   liberação/trava da Exclusão (sucesso libera automático, falha trava até "Forçar
   destravamento").
6. **UI mudou de modal imediato para submeter+polling**, igual à tela de Exclusão de
   Proposta — `importBudgetFile` agora só valida (cabeçalho/formato) e submete a task.
7. **Decisão de arquitetura — script Map/Reduce genérico, não dedicado:** usuário sinalizou
   intenção de rodar mais de uma operação assíncrona no futuro no mesmo script. Resolvido
   criando `customscript_pd_ppc_handler_mr`* único, com dispatch por parâmetro de operação
   (`custscript_pd_ppc_mr_operacao`*) + payload JSON genérico (`custscript_pd_ppc_mr_payload`*)
   — espelha o padrão já usado no Restlet único `customscript_pd_ppc_handler_rl`* (mesmo
   projeto). Raciocínio: não é over-engineering especulativo porque replica um padrão já
   validado no mesmo projeto, e o pedido de múltiplas operações futuras foi explícito, não
   inferido.

**Árvore hierárquica (Grupo CPV):** `customrecord_pd_ppc_grupo`* com auto-relacionamento
(`custrecord_pd_ppc_grupo_pai`*, self-join, decidido via `architecture-brainstorm` entre 3
alternativas) + campo opcional `custrecord_pd_ppc_<camada>_grupo`* nas 9 camadas. Montagem
lazy-load (só ao clicar no menu "Árvore"), sem busca recursiva (1 busca de todos os Grupo
CPV da Proposta + até 9 buscas de itens-folha, hierarquia remontada em memória). Somente
leitura por enquanto. Itens manuais/CSV sem Grupo CPV aparecem como folha de nível raiz.
Reaproveita Grupo CPV já existente (mesmo nome + mesmo pai) na reimportação, evitando
galho duplicado.

**Regra de inferência de hierarquia** (sem coluna de pai explícita no arquivo — vem da
ORDEM das linhas): Categoria (nível 1, `IDs` termina `AN` + Quantidade vazia) → Equipamento
(nível 2, `IDs` termina `AN` + Quantidade preenchida + `Codigo`≠`Descricao`) → Subgrupo
(nível 3, `IDs` termina `AN` + `Codigo`=`Descricao`) → Item (nível 4, `IDs` termina `AP`).
Pai = agrupador mais próximo acima. Campo `Item` valida sequência dentro do pai — quebra
rejeita só o item-folha. Regra específica do formato atual; se a fonte trouxer coluna de
pai/nível explícita no futuro, usar essa coluna em vez de inferir pela ordem.

**Pendências no TECH-SPEC:** (1) mapeamento Subgrupo→Camada incompleto, hardcoded, pode
virar cadastro configurável se crescer/mudar muito; (2) edição/exclusão via árvore não
implementada (somente leitura).

**Why (lição para próximas rodadas):** duas vezes nesta extensão o desenho mudou depois de
"fechado" — a motivação real (árvore) só apareceu depois do fan-out estar fechado, e o
formato do arquivo + arquitetura de processamento mudaram depois que a implementação já
ia começar. Vale sempre reconfirmar decisões fechadas há mais de uma sessão antes de
considerar a implementação liberada, especialmente formato de arquivo de entrada e
volume/performance esperado (foi o que disparou a migração para Map/Reduce).

**How to apply:** ao estender esta área do CPV (completar o mapeamento de subgrupos, 2ª
operação no MR genérico, agregação de totais na árvore, edição via árvore), os objetos já
estão cadastrados no MANIFEST — não redesenhar do zero, só avaliar incrementos. Ver
MANIFEST para internal IDs exatos de `customrecord_pd_ppc_grupo`*,
`custrecord_pd_ppc_<camada>_grupo`*, `customscript_pd_ppc_handler_mr`*,
`custscript_pd_ppc_mr_operacao`* e `custscript_pd_ppc_mr_payload`*.
