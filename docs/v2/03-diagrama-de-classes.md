# Diagrama de Classes (v2 - alinhado ao código)

Os atributos correspondem aos campos reais do `db.json`. As mudanças em relação à v1 estão em [`../CHANGELOG-modelos.md`](../CHANGELOG-modelos.md).

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
        +string proprietarioTipo
        +int proprietarioId
        +int registradoPorClienteId
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
    Cliente "1" *-- "1..3" Rendimento
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
    Cliente "0..1" <-- "0..*" Automovel : proprietário / registradoPorClienteId
    Agente "0..1" <-- "0..*" Automovel : proprietário
```

## Máquina de estados do Pedido

```mermaid
stateDiagram-v2
    [*] --> EmAnalise : cliente introduz pedido
    EmAnalise --> EmAnalise : cliente ou agente modifica
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

## Valores permitidos

| Campo | Valores |
|-------|---------|
| `Usuario.perfil` | `cliente`, `agente` |
| `Agente.tipo` | `empresa`, `banco` |
| `Automovel.proprietarioTipo` | `cliente`, `empresa`, `banco` ou `null` (a definir) |
| `Contrato.tipoPropriedade` | `cliente`, `empresa`, `banco` |
| `Pedido.status` | Em análise, Aprovado financeiramente, Reprovado, Contrato executado, Cancelado |
