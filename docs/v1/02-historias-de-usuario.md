# Histórias do Usuário (v1)

| ID | História | Critérios de aceitação |
|----|----------|------------------------|
| HU01 | Como visitante, quero me cadastrar para poder usar o sistema. | E-mail único; senha mínima de 6 caracteres; cliente informa RG, CPF, nome, endereço, profissão e até 3 rendimentos. |
| HU02 | Como usuário cadastrado, quero fazer login para acessar as funções do meu perfil. | Credenciais inválidas mostram erro; páginas protegidas redirecionam para o login. |
| HU03 | Como cliente, quero consultar e editar meus dados. | CPF válido; máximo de 3 entidades empregadoras com rendimento. |
| HU04 | Como agente, quero listar, criar, editar e excluir clientes (CRUD). | Exclusão pede confirmação; não exclui cliente com pedidos ativos. |
| HU05 | Como cliente, quero introduzir um pedido de aluguel escolhendo ou cadastrando um automóvel. | Pedido nasce com status "Em análise"; campos do automóvel (matrícula, ano, marca, modelo, placa) obrigatórios. |
| HU06 | Como cliente, quero acompanhar o status dos meus pedidos. | Lista mostra apenas os meus pedidos, com status colorido e histórico. |
| HU07 | Como cliente, quero modificar um pedido enquanto estiver "Em análise". | Pedido já avaliado não pode ser editado pelo cliente. |
| HU08 | Como cliente, quero cancelar um pedido. | Só pedidos não contratados; status passa a "Cancelado". |
| HU09 | Como agente, quero avaliar financeiramente um pedido (aprovar ou reprovar com parecer). | Parecer obrigatório; renda do cliente visível na avaliação. |
| HU10 | Como agente, quero modificar dados de um pedido. | Alterações registradas no histórico. |
| HU11 | Como agente, quero executar o contrato de um pedido aprovado definindo a propriedade do automóvel (cliente, empresa ou banco). | Só pedidos "Aprovado financeiramente"; automóvel passa a ter o proprietário escolhido. |
| HU12 | Como agente bancário, quero vincular um contrato de crédito ao aluguel. | Apenas agentes do tipo banco concedem crédito; valor e parcelas obrigatórios. |
| HU13 | Como agente, quero gerenciar os automóveis disponíveis. | CRUD de automóveis com proprietário (empresa ou banco). |
