# Roteiro da apresentação final (~10 minutos)

O enunciado pede: apresentar o protótipo, **comparar com os modelos descritos inicialmente** e mostrar **as modificações feitas** para o software funcionar. Este roteiro segue essa ordem.

---

## 1. Abertura (1 min)

- O problema: aluguel de carros pela Internet, com **clientes** que pedem e **agentes** (empresas e bancos) que avaliam e fecham contrato.
- Stack: HTML5, CSS3, JavaScript, **Bootstrap 5** e **JSON Server** consumido via **Fetch API**.
- Os dois subsistemas do enunciado:
  - **construção dinâmica das páginas:** `pages/*.js`, `ui.js`, `carros.js`;
  - **gestão de pedidos e contratos:** `servicos.js`, `validators.js`, `auth.js`, `api.js`.

## 2. O que foi modelado no início, a v1 (1 min)

Mostrar [`docs/v1/`](v1/):
- casos de uso, histórias do usuário (HU01–HU13), classes, pacotes e componentes;
- frase-chave: *"A v1 foi a nossa leitura do enunciado antes de escrever código."*

## 3. Demonstração ao vivo (4 min)

Antes, rodar `npm start` e abrir http://localhost:3000. Para começar com dados limpos, restaurar o `db.json` com `git checkout db.json`.

1. **Login → Cliente** (conta de demonstração). Mostrar a **Frota** com selos Livre/Reservado.
2. **Alugar este carro** → mudar as datas e mostrar que **só carros livres no período** aparecem → **Enviar pedido**. O status fica "Em análise".
3. **Meu perfil:** mostrar a carteira do locatário e o máximo de **3 rendimentos**.
4. **Sair → Banco**. Abrir **Pedidos recebidos** → **Ver detalhes**. Mostrar a renda declarada, tentar aprovar sem parecer (erro) e depois aprovar com parecer.
5. **Executar contrato:** escolher a propriedade do automóvel (cliente, empresa ou banco). Mostrar a **chave de crédito**: ligada calcula a parcela pela Tabela Price; desligada, o contrato fica sem crédito. Confirmar.
6. Mostrar o **histórico** do pedido e, rapidamente, o **CRUD de clientes** e o **cadastro de automóvel**: digitar marca e modelo (ex.: Renault Kwid) e clicar em **Buscar foto na Wikipédia**. A foto chega com autor e licença. Precisa de internet.
7. (Opcional) Diminuir a janela: o menu vira **Offcanvas** no celular.

## 4. Modelo × código: o que mudou e por quê (3 min)

Mostrar [`CHANGELOG-modelos.md`](CHANGELOG-modelos.md). Uma frase por versão:

| Versão | O que mudou | Por quê |
|--------|-------------|---------|
| **v1 → v2** | `Avaliacao` e `EventoHistorico` passaram a ficar dentro do `Pedido`; `Usuario` ganhou `perfilId`; contrato com `tipoPropriedade` | Adequar o modelo ao JSON Server e registrar quem é dono do carro. |
| **v2 → v3** | Carro com `forma` e `cor`; disponibilidade **por período**; cadastro rápido; novos casos "Consultar frota" e "Perfil do agente" | Aplicação do protótipo de interface. |
| **v3 → v4** | Diagramas refeitos em **UML padrão (PlantUML)**; novo **diagrama de sequência**; senha só como hash; crédito opcional; interface montada com componentes do Bootstrap | Revisão crítica: notação UML correta e fidelidade ao enunciado. |

Mostrar dois diagramas da v4 lado a lado com o código:
- **Classes** ([`v4/classes.svg`](v4/classes.svg)) × `db.json`: os campos batem um a um.
- **Pacotes** ([`v4/pacotes.svg`](v4/pacotes.svg)) × pasta `src/js`: cada pacote é um arquivo real.

## 5. Problemas encontrados no caminho (30 s)

- O `_expand=automovel` do JSON Server não funciona, porque ele procura a coleção `automovels`. Solução: juntar o automóvel no código.
- Os `DELETE` davam erro 500 quando algum campo `...Id` valia `null`. Solução: não gravar o campo até ele ter valor.

## 6. Encerramento (30 s)

- Requisitos do enunciado: todos atendidos (checklist no README).
- Repositório com **todas as versões** dos modelos (v1 → v4) e o código final.

---

## Perguntas prováveis

- **"Onde estão os dois subsistemas?"** No diagrama de pacotes da v4: os pacotes «Subsistema», com os arquivos `ui.js`/`pages` de um lado e `servicos.js` do outro.
- **"Como garante que o carro não é alugado duas vezes?"** A função `listarLivresNoPeriodo` em `servicos.js` descarta carros com pedido ativo cujas datas se sobrepõem. O mesmo teste roda de novo ao salvar o pedido.
- **"Por que o banco pode contratar sem crédito?"** O enunciado diz que o aluguel *pode* estar associado a um crédito. Por isso o crédito é opcional e só bancos podem concedê-lo.
- **"A senha está segura?"** O `db.json` guarda só o hash SHA-256. Numa aplicação real o hash seria feito no servidor, com sal e tokens, mas o JSON Server é só uma API simulada.
- **"Onde o Bootstrap foi usado?"** Em botões, cards, formulários, tabelas, badges, alertas, navegação, grid, Toast, Modal, Collapse, `form-switch` e Offcanvas. O `rota.css` só ajusta as variáveis `--bs-*`.
