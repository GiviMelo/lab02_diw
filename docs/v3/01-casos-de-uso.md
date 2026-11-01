# Diagrama de Casos de Uso (v3)

Mudanças em relação à v1: entram **Consultar frota**, **Gerenciar perfil de agente** e o cadastro rápido. O cliente passa a escolher o carro da frota (não informa mais um carro próprio), e a disponibilidade depende do período.

```mermaid
flowchart LR
    Cliente([Cliente])
    Agente([Agente<br/>Empresa ou Banco])

    subgraph Sistema[Sistema de Aluguel de Carros - Rota Aluguel]
        UC1(Criar conta)
        UC2(Autenticar-se)
        UC3(Manter perfil do cliente)
        UC14(Consultar frota)
        UC4(Introduzir pedido de aluguel)
        UC5(Modificar pedido)
        UC6(Consultar pedidos e status)
        UC7(Cancelar pedido)
        UC8(Avaliar pedido financeiramente)
        UC10(Executar contrato)
        UC11(Conceder crédito)
        UC12(Gerenciar automóveis)
        UC13(Manter clientes - CRUD)
        UC15(Gerenciar perfil de agente)
    end

    Cliente --- UC1
    Cliente --- UC2
    Cliente --- UC3
    Cliente --- UC14
    Cliente --- UC4
    Cliente --- UC5
    Cliente --- UC6
    Cliente --- UC7

    Agente --- UC1
    Agente --- UC2
    Agente --- UC14
    Agente --- UC5
    Agente --- UC6
    Agente --- UC8
    Agente --- UC10
    Agente --- UC12
    Agente --- UC13
    Agente --- UC15

    UC10 -. "«extend» (agente banco)" .-> UC11
    UC4 -. "«include»" .-> UC14
```
