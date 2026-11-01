import { exigirPerfil } from '../auth.js';
import { renderShell, esc, dataBR, badgeStatus, chipsHtml, ligarChips, mostrarErros, mensagensDe, STATUS_LABEL } from '../ui.js';
import { listarPedidos, STATUS } from '../servicos.js';

const sessao = exigirPerfil();
const ehCliente = sessao?.perfil === 'cliente';
const conteudo = document.getElementById('conteudo');
let pedidos = [];
let filtro = 'todos';

function renderLinhas() {
  const lista = pedidos.filter((p) => filtro === 'todos' || p.status === filtro);
  document.getElementById('linhas').innerHTML = lista
    .map((p) => {
      const c = p.automovel;
      const quem = ehCliente ? esc(c?.placa) : `${esc(p.cliente?.nome ?? '—')} · ${esc(c?.placa)}`;
      return `<tr>
        <td class="r-num" style="font-weight: 800">#${p.id}</td>
        <td><div style="font-weight: 700">${esc(c ? `${c.marca} ${c.modelo}` : '—')}</div><div style="font-size: 12px; color: #475467">${quem}</div></td>
        <td class="r-num">${dataBR(p.dataInicio)} → ${dataBR(p.dataFim)}</td>
        <td>${badgeStatus(p.status)}</td>
        <td class="r-acoes"><a class="r-btn" href="pedido-detalhe.html?id=${p.id}">Ver detalhes</a></td>
      </tr>`;
    })
    .join('');
  document.getElementById('vazio').hidden = lista.length > 0;
  document.getElementById('vazio').textContent = pedidos.length ? 'Nenhum pedido com este status.' : 'Nenhum pedido ainda.';
}

async function iniciar() {
  renderShell('pedidos');
  try {
    pedidos = await listarPedidos(sessao);
  } catch (err) {
    mostrarErros(conteudo, mensagensDe(err));
    return;
  }
  const conta = (s) => pedidos.filter((p) => p.status === s).length;
  const stats = [
    ['Total de pedidos', pedidos.length],
    ['Em análise', conta(STATUS.ANALISE)],
    ['Aprovados', conta(STATUS.APROVADO)],
    ['Contratados', conta(STATUS.CONTRATADO)],
  ];
  const opcoes = [['todos', 'Todos'], ...Object.values(STATUS).map((s) => [s, STATUS_LABEL[s]])];

  conteudo.innerHTML = `
    <header class="r-header">
      <div>
        <h1 class="r-h1">${ehCliente ? 'Meus pedidos' : 'Pedidos recebidos'}</h1>
        <p class="r-sub">${ehCliente ? 'Acompanhe, edite ou cancele seus pedidos de aluguel.' : 'Avalie financeiramente e execute os contratos.'}</p>
      </div>
      ${ehCliente ? '<a class="r-btn r-btn-p" href="pedido-form.html">+ Novo pedido</a>' : ''}
    </header>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 28px">
      ${stats
        .map(
          ([rotulo, n]) => `<div class="r-card" style="padding: 18px 20px">
            <div style="font-size: 13px; font-weight: 700; color: #475467">${rotulo}</div>
            <div class="r-num" style="font-size: 34px; font-weight: 800; letter-spacing: -0.02em; margin-top: 4px">${n}</div>
          </div>`
        )
        .join('')}
    </div>
    <div class="r-chips" style="margin-bottom: 16px" role="group" aria-label="Filtrar por status" id="filtros">${chipsHtml(opcoes, filtro)}</div>
    <div class="r-card r-table-wrap">
      <table class="r-table">
        <thead><tr><th>Pedido</th><th>Automóvel</th><th>Período</th><th>Status</th><th><span class="visually-hidden">Ações</span></th></tr></thead>
        <tbody id="linhas"></tbody>
      </table>
      <div class="r-vazio" id="vazio" hidden></div>
    </div>`;
  ligarChips(document.getElementById('filtros'), (v) => {
    filtro = v;
    renderLinhas();
  });
  renderLinhas();
}

if (sessao) iniciar();
