# Diagrama de Componentes (v2 - alinhado ao código)

```mermaid
flowchart LR
    subgraph Navegador["Navegador (cliente ou agente)"]
        UI["Páginas HTML + Bootstrap 5"]
        PG["pages/*.js (controladores)"]
        SV["servicos.js / validators.js / auth.js"]
        AP["api.js (Fetch API)"]
        UI --> PG --> SV --> AP
    end
    subgraph Servidor["Servidor central - JSON Server (npm start, porta 3000)"]
        EST["Servidor estático<br/>(--static ./src)<br/>Subsistema de construção de páginas"]
        REST["API REST<br/>Subsistema de gestão de pedidos e contratos"]
        DB[("db.json<br/>usuarios, clientes, agentes,<br/>automoveis, pedidos,<br/>contratos, creditos")]
        REST --> DB
    end

    Navegador -- "HTTP GET (HTML, CSS, JS)" --> EST
    AP -- "HTTP JSON (GET, POST, PATCH, DELETE)" --> REST
```

Interfaces:

| Interface | Provida por | Consumida por |
|-----------|-------------|---------------|
| Arquivos estáticos | Servidor estático do JSON Server | Navegador |
| `/usuarios`, `/clientes`, `/agentes`, `/automoveis`, `/pedidos`, `/contratos`, `/creditos` | API REST do JSON Server | `api.js` |
| Funções de domínio (`salvarPedido`, `avaliarPedido`, `executarContrato`...) | `servicos.js` | `pages/*.js` |
