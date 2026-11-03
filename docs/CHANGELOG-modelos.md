# Changelog dos modelos (v1 → v2)

Registro das revisões feitas nos diagramas durante o desenvolvimento, e o motivo de cada uma. Isso responde ao critério "atualização dos modelos conforme a necessidade do projeto".

## Diagrama de Classes

| # | Mudança | Motivo |
|---|---------|--------|
| 1 | `Usuario` ganhou `perfilId` | Liga o login ao `Cliente` ou `Agente`; evita duplicar dados de identificação. |
| 2 | `Avaliacao` virou objeto embutido em `Pedido.avaliacoes[]` (composição) | O JSON Server trata melhor dados que só existem junto do pedido; reduz requisições. |
| 3 | Adicionado `EventoHistorico` em `Pedido.historico[]` | Requisito de rastreabilidade das modificações feitas por clientes e agentes (HU10). |
| 4 | `Pedido` ganhou `dataInicio`, `dataFim`, `observacoes`, `contratoId` | O pedido precisa do período de aluguel; `contratoId` é a ligação com o contrato. |
| 5 | `Automovel.proprietarioTipo` aceita `null` e foi adicionado `registradoPorClienteId` | Um carro informado pelo cliente não tem dono até a execução do contrato. O campo identifica quem pode editá-lo e permite descartá-lo. |
| 6 | `Contrato` ganhou `tipoPropriedade`, `proprietarioId`, `agenteId` | A propriedade do automóvel depende do tipo de contrato (cliente, empresa ou banco). |
| 7 | `Credito` ganhou `pedidoId`, `bancoId`, `valorParcela`, `dataConcessao` | Rastrear o banco concedente e guardar a parcela calculada (Tabela Price). |

## Diagrama de Pacotes

| # | Mudança | Motivo |
|---|---------|--------|
| 1 | Pacotes renomeados para os arquivos reais (`pages`, `ui`, `servicos`, `validators`, `auth`, `api`) | Alinhamento modelo ↔ código. |
| 2 | Adicionado `clienteForm.js` | O mesmo formulário de cliente é usado no cadastro, no CRUD e no perfil. |

## Diagrama de Componentes

| # | Mudança | Motivo |
|---|---------|--------|
| 1 | O JSON Server aparece com duas interfaces: estática (`--static ./src`) e REST | O mesmo processo serve as páginas e a API, o que elimina problemas de CORS. |

## Decisões de implementação com impacto no modelo

- **`_expand` do JSON Server:** a coleção `automoveis` não é encontrada por `_expand=automovel`, porque a biblioteca de plural gera `automovels`. Por isso `servicos.js` junta o automóvel ao pedido no cliente, em vez de usar `_expand`.
- **Cancelamento:** só é possível em `Em análise` ou `Aprovado financeiramente`. Depois do contrato, não.
- **Exclusão de cliente:** bloqueada enquanto houver pedidos ativos (em análise, aprovados ou contratados). Os pedidos finalizados (reprovados e cancelados) e o usuário são removidos junto com o cliente.
- **Crédito:** apenas agentes do tipo `banco` podem vincular um contrato de crédito.
- **Senhas em texto puro:** aceitável apenas porque o JSON Server é uma API simulada para fins acadêmicos. Em produção usaríamos hash e tokens.

---

# v2 → v3

Revisão feita ao aplicar o protótipo de interface **Rota Aluguel** e implementar as próximas funcionalidades do plano. Os cinco modelos foram atualizados em [`v3/`](v3/README.md).

## Casos de uso e histórias

| # | Mudança | Motivo |
|---|---------|--------|
| 1 | Novo caso **Consultar frota** (HU14) | O protótipo tem uma tela de frota com a disponibilidade de cada carro; o pedido parte dela. |
| 2 | Novo caso **Gerenciar perfil de agente** (HU15) | O protótipo tem a "Credencial de agente", com razão social e CNPJ editáveis. |
| 3 | **Cadastro rápido** (HU01) | O cliente cria a conta só com nome, CPF e RG e completa profissão, endereço e renda no perfil. A "Carteira do locatário" mostra o progresso. |
| 4 | O cliente **escolhe o carro da frota** (HU05) e deixa de informar um carro próprio | O protótipo só oferece carros da frota. Isso também remove o campo `registradoPorClienteId`. |
| 5 | Agente modifica pedido também na tela de pedido (HU10) | O enunciado diz que agentes modificam pedidos; usamos o mesmo formulário do cliente. |

## Diagrama de classes

| # | Mudança | Motivo |
|---|---------|--------|
| 1 | `Automovel` ganhou `forma` e `cor`; saiu `registradoPorClienteId` | A ilustração do carro (carroceria e cor) aparece na frota, no pedido e no detalhe. |
| 2 | `Cliente` ganhou `membroDesde` | Exibido na carteira do locatário. |
| 3 | `Cliente`–`Rendimento` passou de `1..3` para `0..3` | Com o cadastro rápido, o cliente pode ainda não ter informado renda. |
| 4 | `EventoHistorico` ganhou `detalhe` | O parecer e o resumo do crédito aparecem em cada evento do histórico. |
| 5 | `Pedido.contratoId` e `Contrato.creditoId` ficam ausentes até existirem, em vez de `null` | No JSON Server 0.17 todo `DELETE` falhava com erro 500 quando havia um campo terminado em `Id` valendo `null`. Encontramos isso nos testes de exclusão de cliente. |

## Pacotes e componentes

| # | Mudança | Motivo |
|---|---------|--------|
| 1 | Novo módulo `carros.js` (ilustração SVG e placa Mercosul) | Reutilizado por cinco telas. |
| 2 | `clienteForm.js` foi removido; o formulário de cliente virou a página `cliente-form` com a carteira ao lado | O protótipo une perfil, edição e cadastro de cliente na mesma tela. |
| 3 | Novo tema `css/rota.css` sobre o Bootstrap 5 e a fonte Manrope (Google Fonts) | Aplica o visual do protótipo sem abandonar o Bootstrap exigido no enunciado. |
| 4 | `ui.js` monta a barra lateral (`renderShell`) | O protótipo usa uma barra lateral fixa, com menu diferente para cliente e agente. |

## Regras de negócio novas ou ajustadas

- **Disponibilidade por período:** um carro só aparece no pedido se nenhum pedido ativo dele se sobrepõe às datas escolhidas. Na frota, "Reservado" significa ter um pedido ativo que ainda não terminou.
- **Parecer:** obrigatório, com no mínimo 5 caracteres.
- **Crédito:** o agente banco sempre informa o crédito ao executar o contrato, como no protótipo. Contratos executados por empresas não têm crédito, então o crédito continua opcional no modelo.
- **Parcelas:** de 1 a 120.

---

# v3 → v4

Revisão feita após uma avaliação crítica do trabalho com base nos critérios do enunciado. Os modelos estão em [`v4/`](v4/README.md).

## Notação dos diagramas

| # | Mudança | Motivo |
|---|---------|--------|
| 1 | Todos os diagramas foram refeitos em **PlantUML**, com notação UML padrão | O Mermaid não tem diagramas de casos de uso, pacotes e componentes. Na v3 esses três eram fluxogramas imitando UML. |
| 2 | **Casos de uso:** atores com boneco, `Empresa` e `Banco` como especializações (generalização) de `Agente`, ator `Visitante` para "Criar conta" e novo caso incluído "Verificar disponibilidade no período" | Deixa explícito que só o Banco concede crédito, e que a disponibilidade é reutilizada ao criar e ao modificar o pedido. |
| 3 | **Classes:** visibilidade (`-`, `+`), tipos, enumerações (`StatusPedido`, `TipoAgente`, `TipoPropriedade`, `Carroceria`, `PerfilUsuario`) e operações principais | A v3 listava campos sem tipos UML nem operações. |
| 4 | **Pacotes:** pacotes UML (com aba) agrupados nos dois subsistemas, com dependências «import», «use» e «access» | Notação padrão de diagrama de pacotes. |
| 5 | **Componentes:** interfaces fornecidas (pirulito) e requeridas, dentro dos nós "navegador" e "servidor central" | Notação UML 2 de componentes. |
| 6 | **Novo diagrama de sequência** do fluxo principal (pedido → avaliação → contrato) | Mostra a colaboração entre páginas, `servicos.js`, `api.js` e o JSON Server. |

## Modelo de domínio

| # | Mudança | Motivo |
|---|---------|--------|
| 1 | `Usuario.senha` virou `Usuario.senhaHash` (SHA-256) | A senha não deve ficar gravada em texto puro, mesmo numa API simulada. |
| 2 | Crédito no contrato voltou a ser **opcional também para bancos** (HU12) | O enunciado diz que o aluguel *pode* estar associado a um crédito. Na v3 o banco era obrigado a informar crédito. |

## Interface (impacto no diagrama de componentes)

| # | Mudança | Motivo |
|---|---------|--------|
| 1 | A interface passou a ser montada com **componentes do Bootstrap 5**: `btn`, `card`, `form-control`/`form-select`/`form-label`, `table`, `badge`, `alert`, `nav-pills`, `row`/`col`, Toast, Modal, Collapse, `form-switch` e Offcanvas | O enunciado pede a interface em Bootstrap 5. Na v3 quase todo o visual vinha de CSS próprio. Agora o tema `rota.css` só ajusta as variáveis `--bs-*` dos componentes. |
| 2 | No celular, a barra lateral virou um **Offcanvas** aberto por um botão de menu | A barra lateral do protótipo ocupava muito espaço em telas pequenas. |

## Correção encontrada em teste (v4)

| # | Mudança | Motivo |
|---|---------|--------|
| 1 | `npm start` passou a rodar o JSON Server **sem `--watch`** (`npm run start:watch` continua disponível) | Com `--watch`, o servidor reiniciava ao detectar as próprias gravações. Ao executar um contrato com crédito, o crédito e o contrato eram gravados, o servidor reiniciava e as duas últimas gravações falhavam ("Não foi possível conectar ao servidor"). |
| 2 | `executarContrato` desfaz as gravações anteriores se uma etapa falhar | O JSON Server não tem transações. Sem isso, sobravam crédito e contrato "soltos" com o pedido ainda "Aprovado". No diagrama de sequência, as 4 gravações formam uma unidade: ou todas acontecem, ou nenhuma. |

## Fotos reais dos automóveis (v4)

| # | Mudança | Motivo |
|---|---------|--------|
| 1 | `Automovel` ganhou `foto`, `fotoCredito` e `fotoFonte` (opcionais, `[0..1]` no diagrama de classes) | Os cards passaram a mostrar fotos reais em vez da ilustração. Crédito e fonte guardam o autor e a licença, que as licenças Creative Commons exigem citar. |
| 2 | Novo serviço externo no diagrama de componentes: **API da Wikipédia / Wikimedia Commons** | O cadastro de automóvel busca a foto pela marca e modelo (`pageimages`) e o autor/licença (`imageinfo`). Os carros iniciais usam cópias locais em `src/img/carros`, então a aplicação funciona sem internet. |
| 3 | A ilustração (`forma` + `cor`) virou **reserva**: aparece quando o carro não tem foto ou a imagem não carrega. A tela de login mantém a ilustração animada do protótipo | Nenhum carro fica sem imagem, mesmo com um endereço quebrado. |
