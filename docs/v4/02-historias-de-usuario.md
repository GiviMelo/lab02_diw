# Histórias do Usuário (v4)

As histórias marcadas com ✱ mudaram ou são novas em relação à v1; ✚ indica mudança na v4.

| ID | História | Critérios de aceitação |
|----|----------|------------------------|
| HU01 ✱ | Como visitante, quero criar uma conta rapidamente para começar a usar o sistema. | Cliente informa nome, e-mail, senha, CPF e RG; agente informa razão social, e-mail, senha, CNPJ e tipo. Entra logado após criar a conta. E-mail e CPF/CNPJ únicos. |
| HU02 ✱✚ | Como usuário cadastrado, quero fazer login com segurança, inclusive com contas de demonstração. | Credenciais inválidas mostram "E-mail ou senha incorretos."; páginas protegidas redirecionam ao login; a senha nunca é gravada, só o hash SHA-256. |
| HU03 ✱ | Como cliente, quero completar e editar meu perfil e ver minha carteira de locatário. | Exige profissão e endereço; até 3 rendimentos; a carteira mostra o progresso do perfil e os números de pedidos, contratos e dias na estrada. |
| HU04 | Como agente, quero listar, criar, editar e excluir clientes (CRUD). | Busca por nome ou CPF; exclusão pede confirmação e é bloqueada com pedidos ativos. |
| HU05 ✱ | Como cliente, quero introduzir um pedido escolhendo um carro da frota e o período. | Só aparecem carros livres no período; o resumo mostra carro, retirada, devolução e duração; pedido nasce "Em análise". |
| HU06 | Como cliente, quero acompanhar o status dos meus pedidos. | Indicadores por status, filtro por status e histórico no detalhe. |
| HU07 | Como cliente, quero modificar um pedido enquanto estiver "Em análise". | Pedido avaliado não pode ser editado pelo cliente. |
| HU08 | Como cliente, quero cancelar um pedido. | Somente em análise ou aprovado; pede confirmação. |
| HU09 | Como agente, quero avaliar financeiramente um pedido. | Mostra a renda declarada; parecer obrigatório; aprova ou reprova. |
| HU10 | Como agente, quero modificar dados de um pedido. | Em análise ou aprovado; alteração registrada no histórico. |
| HU11 | Como agente, quero executar o contrato definindo a propriedade do automóvel. | Cliente, empresa ou banco (escolhendo a instituição); o automóvel passa a ter esse proprietário. |
| HU12 ✚ | Como agente bancário, quero **opcionalmente** vincular um contrato de crédito ao executar o contrato. | Chave "Vincular contrato de crédito" (ligada por padrão); valor, parcelas (1–120) e taxa; parcela estimada pela Tabela Price. Sem crédito, o contrato registra "Sem contrato de crédito". |
| HU13 ✱ | Como agente, quero gerenciar os automóveis com uma prévia visual. | Carroceria (hatch, sedã, SUV, picape), cor e proprietário; placa e matrícula únicas. |
| HU14 ✱ | Como usuário, quero ver a frota com a disponibilidade de cada carro. | Cards com placa, carroceria, proprietário e selo Livre/Reservado; filtro por proprietário. |
| HU15 ✱ | Como agente, quero editar o perfil da minha instituição. | Razão social e CNPJ editáveis; tipo e e-mail apenas leitura; credencial com números da operação. |
