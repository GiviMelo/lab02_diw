# Diagrama de Componentes (v3 - alinhado ao código)

```mermaid
flowchart LR
    subgraph Navegador["Navegador (cliente ou agente)"]
        UI["Páginas HTML + Bootstrap 5<br/>+ tema rota.css"]
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
    subgraph CDN["CDNs públicas"]
        BS["Bootstrap 5.3.3 (jsDelivr)"]
        GF["Google Fonts - Manrope"]
    end

    Navegador -- "HTTP GET (HTML, CSS, JS)" --> EST
    AP -- "HTTP JSON (GET, POST, PATCH, DELETE)" --> REST
    UI -- "CSS, JS, fontes" --> CDN
```

| Interface | Provida por | Consumida por |
|-----------|-------------|---------------|
| Arquivos estáticos | Servidor estático do JSON Server | Navegador |
| `/usuarios`, `/clientes`, `/agentes`, `/automoveis`, `/pedidos`, `/contratos`, `/creditos` | API REST do JSON Server | `api.js` |
| Funções de domínio (`salvarPedido`, `listarLivresNoPeriodo`, `avaliarPedido`, `executarContrato`, ...) | `servicos.js` | `pages/*.js` |
| `renderShell`, `toast`, `chipsHtml`, `badgeStatus` | `ui.js` | `pages/*.js` |
| `carroSvg`, `palco`, `placaHtml` | `carros.js` | `pages/*.js` |
