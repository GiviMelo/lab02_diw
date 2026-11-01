// Perfil do agente com a "Credencial de agente".
import { exigirPerfil, atualizarSessao } from '../auth.js';
import { api } from '../api.js';
import { renderShell, esc, iniciais, toast, mostrarErros, mensagensDe, mrzNome, mrzDoc } from '../ui.js';
import { obterAgente, atualizarAgente, obterUsuario, STATUS } from '../servicos.js';
import { mascaraCNPJ } from '../validators.js';

const sessao = exigirPerfil(['agente']);
const conteudo = document.getElementById('conteudo');
const $ = (id) => document.getElementById(id);

let agente;
let numeros = { frota: 0, pedidos: 0, contratos: 0, clientes: 0 };

function renderCredencial() {
  const nome = $('pa-nome').value;
  const cnpj = $('pa-cnpj').value;
  const tipo = agente.tipo === 'banco' ? 'Banco' : 'Empresa';
  $('credencial').innerHTML = `
    <div class="r-cart-faixa" style="background: #1F4FB5"><span>CREDENCIAL DE AGENTE</span><span>ROTA ALUGUEL · BR</span></div>
    <div class="r-cart-topo">
      <div class="r-avatar" style="background: #F2A93B; box-shadow: 0 0 0 4px #0E1726, 0 0 0 6px #F2A93B">${esc(iniciais(nome))}</div>
      <div style="min-width: 0; flex: 1"><div style="font-size: 20px; font-weight: 800; overflow-wrap: anywhere">${esc(nome)}</div><div class="r-pill" style="color: #F2C777">${tipo}</div></div>
    </div>
    <div class="r-cart-grid">
      <div><div class="r-cart-k">CNPJ</div><div class="r-cart-v r-num">${esc(cnpj || '—')}</div></div>
      <div><div class="r-cart-k">Frota própria</div><div class="r-cart-v">${numeros.frota} automóveis</div></div>
    </div>
    <div class="r-cart-nums">
      <div><b>${numeros.pedidos}</b><span class="r-cart-k">Pedidos</span></div>
      <div><b>${numeros.contratos}</b><span class="r-cart-k">Contratos</span></div>
      <div><b>${numeros.clientes}</b><span class="r-cart-k">Clientes</span></div>
    </div>
    <div class="r-mrz" aria-hidden="true">${esc(mrzNome('AGENTE', nome))}<br>${esc(mrzDoc(cnpj))}</div>
    <div style="height: 6px; background: repeating-linear-gradient(90deg, #F2A93B 0 18px, #1F4FB5 18px 36px, #2FB5A0 36px 54px)"></div>`;
}

async function iniciar() {
  renderShell('perfil');
  const [ag, usuario, carros, pedidos, clientes] = await Promise.all([
    obterAgente(sessao.perfilId),
    obterUsuario('agente', sessao.perfilId),
    api.listar('/automoveis'),
    api.listar('/pedidos'),
    api.listar('/clientes'),
  ]);
  agente = ag;
  numeros = {
    frota: carros.filter((c) => c.proprietarioTipo === agente.tipo && c.proprietarioId === agente.id).length,
    pedidos: pedidos.length,
    contratos: pedidos.filter((p) => p.status === STATUS.CONTRATADO).length,
    clientes: clientes.length,
  };

  conteudo.innerHTML = `
    <header style="margin-bottom: 28px">
      <h1 class="r-h1">Meu perfil</h1>
      <p class="r-sub">Dados da sua instituição.</p>
    </header>
    <div class="r-colunas">
      <form class="r-card" id="form" novalidate style="flex: 999 1 420px; padding: 24px; display: flex; flex-direction: column; gap: 16px">
        <div><label for="pa-nome">Razão social</label><input id="pa-nome" value="${esc(agente.nome)}"></div>
        <div class="r-grid-2">
          <div><label for="pa-cnpj">CNPJ</label><input id="pa-cnpj" inputmode="numeric" value="${esc(agente.cnpj)}"></div>
          <div><label>Tipo<input value="${agente.tipo === 'banco' ? 'Banco' : 'Empresa'}" disabled style="margin-top: 6px"></label></div>
        </div>
        <div><label>E-mail de acesso<input value="${esc(usuario?.email ?? '')}" disabled style="margin-top: 6px"></label></div>
        <div id="erros"></div>
        <button class="r-btn r-btn-p" type="submit">Salvar alterações</button>
      </form>
      <aside class="r-carteira r-col-side" id="credencial"></aside>
    </div>`;

  $('pa-nome').addEventListener('input', renderCredencial);
  $('pa-cnpj').addEventListener('input', (e) => {
    e.target.value = mascaraCNPJ(e.target.value);
    renderCredencial();
  });
  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarErros($('erros'), []);
    try {
      const salvo = await atualizarAgente(agente.id, { nome: $('pa-nome').value, cnpj: $('pa-cnpj').value });
      atualizarSessao({ nome: salvo.nome });
      renderShell('perfil');
      toast('Perfil atualizado');
    } catch (err) {
      mostrarErros($('erros'), mensagensDe(err));
    }
  });
  renderCredencial();
}

if (sessao) iniciar().catch((err) => mostrarErros(conteudo, mensagensDe(err)));
