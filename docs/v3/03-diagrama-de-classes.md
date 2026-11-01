# Diagrama de Classes (v3 - alinhado ao código)

Os atributos correspondem aos campos do `db.json`. As mudanças estão em [`../CHANGELOG-modelos.md`](../CHANGELOG-modelos.md).

```mermaid
classDiagram
    class Usuario {
        +int id
        +string email
        +string senha
        +string perfil
        +int perfilId
    }
    class Cliente {
        +int id
        +string nome
        +string rg
        +string cpf
        +string endereco
        +string profissao
        +string membroDesde
    }
    class Rendimento {
        +string entidadeEmpregadora
        +number valor
    }
    class Agente {
        +int id
        +string nome
        +string tipo
        +string cnpj
    }
    class Automovel {
        +int id
        +string matricula
        +int ano
        +string marca
        +string modelo
        +string placa
        +string forma
        +string cor
        +string proprietarioTipo
        +int proprietarioId
    }
    class Pedido {
        +int id
        +datetime dataCriacao
        +date dataInicio
        +date dataFim
        +string observacoes
        +string status
        +int contratoId
    }
    class Avaliacao {
        +int agenteId
        +string agenteNome
        +bool aprovado
        +string parecer
        +datetime data
    }
    class EventoHistorico {
        +datetime data
        +string autor
        +string acao
        +string detalhe
    }
    class Contrato {
        +int id
        +string tipoPropriedade
        +int proprietarioId
        +datetime dataExecucao
    }
    class Credito {
        +int id
        +number valor
        +int parcelas
        +number taxaMensal
        +number valorParcela
        +datetime dataConcessao
    }

    Usuario "1" --> "1" Cliente : perfilId (perfil=cliente)
    Usuario "1" --> "1" Agente : perfilId (perfil=agente)
    Cliente "1" *-- "0..3" Rendimento
    Cliente "1" --> "0..*" Pedido : clienteId
    Pedido "*" --> "1" Automovel : automovelId
    Pedido "1" *-- "0..*" Avaliacao
    Pedido "1" *-- "1..*" EventoHistorico
    Agente "1" --> "0..*" Avaliacao : agenteId
    Pedido "1" --> "0..1" Contrato : contratoId
    Contrato "*" --> "1" Agente : agenteId (executor)
    Contrato "1" --> "0..1" Credito : creditoId
    Credito "*" --> "1" Agente : bancoId (tipo banco)
    Credito "*" --> "1" Pedido : pedidoId
    Automovel "0..*" --> "1" Cliente : proprietário (tipo cliente)
    Automovel "0..*" --> "1" Agente : proprietário (tipo empresa/banco)
```

## Valores permitidos

| Campo | Valores |
|-------|---------|
| `Usuario.perfil` | `cliente`, `agente` |
| `Agente.tipo` | `empresa`, `banco` |
| `Automovel.forma` | `hatch`, `sedan`, `suv`, `picape` |
| `Automovel.cor` | hexadecimal da paleta: Branco, Prata, Grafite, Azul, Vermelho, Âmbar, Verde-água |
| `Automovel.proprietarioTipo` / `Contrato.tipoPropriedade` | `cliente`, `empresa`, `banco` |
| `Pedido.status` | Em análise, Aprovado financeiramente, Reprovado, Contrato executado, Cancelado (na tela: Em análise, Aprovado, Reprovado, Contratado, Cancelado) |

`Pedido.contratoId` e `Contrato.creditoId` ficam **ausentes** (não `null`) enquanto não existem. Veja o changelog.

## Máquina de estados do Pedido

```mermaid
stateDiagram-v2
    [*] --> EmAnalise : cliente envia pedido
    EmAnalise --> EmAnalise : cliente ou agente modifica
    Aprovado --> Aprovado : agente modifica
    EmAnalise --> Aprovado : agente aprova (parecer)
    EmAnalise --> Reprovado : agente reprova (parecer)
    EmAnalise --> Cancelado : cliente cancela
    Aprovado --> Cancelado : cliente cancela
    Aprovado --> Contratado : agente executa contrato
    Reprovado --> [*]
    Cancelado --> [*]
    Contratado --> [*]

    EmAnalise : Em análise
    Aprovado : Aprovado financeiramente
    Contratado : Contrato executado
```
