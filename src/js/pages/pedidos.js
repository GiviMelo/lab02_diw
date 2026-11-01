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
        <td class="r-num fw-bolder">#${p.id}</td>
        <td><div class="fw-bold">${esc(c ? `${c.marca} ${c.modelo}` : '—')}</div><div class="text-secondary" style="font-size: 12px">${quem}</div></td>
        <td class="r-num">${dataBR(p.dataInicio)} → ${dataBR(p.dataFim)}</td>
        <td>${badgeStatus(p.status)}</td>
        <td class="r-acoes"><a class="btn btn-outline-secondary" href="pedido-detalhe.html?id=${p.id}">Ver detalhes</a></td>
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
      ${ehCliente ? '<a class="btn btn-primary" href="pedido-form.html">+ Novo pedido</a>' : ''}
    </header>
    <div class="row g-3 mb-4">
      ${stats
        .map(
          ([rotulo, n]) => `<div class="col-6 col-lg-3"><div class="card h-100" style="padding: 18px 20px">
            <div class="text-secondary fw-bold" style="font-size: 13px">${rotulo}</div>
            <div class="r-num" style="font-size: 34px; font-weight: 800; letter-spacing: -0.02em; margin-top: 4px">${n}</div>
          </div></div>`
        )
        .join('')}
    </div>
    <div class="r-chips mb-3" role="group" aria-label="Filtrar por status" id="filtros">${chipsHtml(opcoes, filtro)}</div>
    <div class="card r-table-wrap">
      <table class="table table-hover table-borderless align-middle mb-0 r-table">
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
