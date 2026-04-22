# Demanda - Controle de Amostras

Oi, tudo bem?

Segue aqui o que a gente precisa no sistema. Tentei detalhar o máximo que consegui mas qualquer
dúvida é só falar.

---

A gente precisa controlar as amostras que a gente envia pros clientes. Hoje isso tudo fica numa
planilha do excel e tá virando uma bagunça. A ideia é trazer isso pro NetSuite.

Quando a gente cria um pedido de venda pra um cliente, às vezes a gente manda junto algumas
amostras de produto pra ele avaliar. Essas amostras não são cobradas mas a gente precisa saber
o que foi, quanto foi, e se o cliente devolveu ou não.

O que a gente precisa:

- Um lugar pra registrar as amostras que foram enviadas. Precisa ter: qual cliente, qual produto,
  quantidade, data que foi, e um status (enviada, devolvida, perdida)

- Seria bom vincular isso ao pedido de venda quando tiver um pedido relacionado, mas nem sempre
  vai ter pedido, às vezes a gente manda amostra só pra prospecção

- Quando o status mudar pra "devolvida" a gente queria receber um email avisando o responsável
  pelo cliente (que fica no campo de representante de vendas do cliente)

- Todo mês a gente precisa de um relatório com tudo que tá como "enviada" há mais de 30 dias,
  porque aí a gente entra em contato com o cliente pra cobrar a devolução ou confirmar que perdeu

- No cadastro do cliente queria ter um campo mostrando quantas amostras estão em aberto pra aquele
  cliente, pra quando a gente abrir o cliente já saber se tem coisa pendente

Acho que é isso por enquanto. Ah, um detalhe: o campo de representante de vendas no cliente
a gente já tem, é o custentity_ff_representante, e o internalId dele é 1847. Já o produto de
amostra segue o cadastro normal de item do NetSuite mesmo.