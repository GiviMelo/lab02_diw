import { exigirPerfil } from '../auth.js';
import { renderShell, esc, parametro, chipsHtml, ligarChips, mostrarErros, mensagensDe, irPara } from '../ui.js';
import { obterAutomovel, salvarAutomovel, listarAgentes, listarClientes } from '../servicos.js';
import { FORMAS, PALETA, carroSvg } from '../carros.js';

const sessao = exigirPerfil(['agente']);
const conteudo = document.getElementById('conteudo');
const id = Number(parametro('id')) || null;
const $ = (x) => document.getElementById(x);

let agentes = [];
let clientes = [];
let carro;

function renderPreview() {
  $('preview-carro').innerHTML = carroSvg(carro.forma, carro.cor);
  $('preview-nome').textContent = `${carro.marca} ${carro.modelo}`.trim() || 'Novo automóvel';
}

function renderCores() {
  $('cores').innerHTML = PALETA.map(
    ([nome, hex]) =>
      `<button type="button" class="r-swatch" style="background: ${hex}" data-cor="${hex}" aria-label="${nome}" aria-pressed="${hex.toLowerCase() === carro.cor.toLowerCase()}"></button>`
  ).join('');
}

// Segunda escolha do proprietário: qual banco/empresa, ou qual cliente (particular).
function renderDono() {
  const bloco = $('dono');
  if (carro.proprietarioTipo === 'cliente') {
    bloco.innerHTML = `<label class="form-label" for="dono-cliente">Cliente proprietário</label>
      <select class="form-select" id="dono-cliente">${clientes
        .map((c) => `<option value="${c.id}"${c.id === carro.proprietarioId ? ' selected' : ''}>${esc(c.nome)}</option>`)
        .join('')}</select>`;
    if (!clientes.some((c) => c.id === carro.proprietarioId)) carro.proprietarioId = clientes[0]?.id ?? null;
    $('dono-cliente').addEventListener('change', (e) => (carro.proprietarioId = Number(e.target.value)));
    return;
  }
  const opcoes = agentes.filter((a) => a.tipo === carro.proprietarioTipo);
  if (!opcoes.some((a) => a.id === carro.proprietarioId)) {
    carro.proprietarioId = opcoes.find((a) => a.id === sessao.perfilId)?.id ?? opcoes[0]?.id ?? null;
  }
  bloco.innerHTML = `<div class="r-label">${carro.proprietarioTipo === 'banco' ? 'Banco' : 'Empresa'} proprietário</div>
    <div class="r-chips" role="group" aria-label="Instituição proprietária" id="inst">${chipsHtml(opcoes.map((a) => [a.id, a.nome]), carro.proprietarioId)}</div>`;
  ligarChips($('inst'), (v) => (carro.proprietarioId = Number(v)));
}

async function iniciar() {
  renderShell('autos');
  [agentes, clientes] = await Promise.all([listarAgentes(), listarClientes()]);
  carro = id
    ? await obterAutomovel(id)
    : {
        marca: '', modelo: '', ano: String(new Date().getFullYear()), placa: '', matricula: '',
        forma: 'hatch', cor: '#E8ECF1', proprietarioTipo: sessao.tipoAgente, proprietarioId: sessao.perfilId,
      };
  carro.ano = String(carro.ano);

  const campo = (k, rotulo, extra = '') =>
    `<div class="col-md-6 col-xxl-4"><label class="form-label" for="a-${k}">${rotulo}</label><input class="form-control" id="a-${k}" data-campo="${k}" value="${esc(carro[k])}" ${extra}></div>`;
  conteudo.innerHTML = `
    <a class="btn btn-outline-secondary r-voltar" href="automoveis.html">← Voltar aos automóveis</a>
    <header class="mb-4">
      <h1 class="r-h1">${id ? 'Editar automóvel' : 'Novo automóvel'}</h1>
      <p class="r-sub">A ilustração muda conforme o tipo e a cor escolhidos.</p>
    </header>
    <form class="row g-4 align-items-start" id="form" novalidate>
      <section class="col-12 col-xl-8">
        <div class="card card-body" style="gap: 20px">
        <div class="row g-3">
          ${campo('marca', 'Marca')}
          ${campo('modelo', 'Modelo')}
          ${campo('ano', 'Ano', 'type="number"')}
          ${campo('placa', 'Placa', 'placeholder="ABC1D23" maxlength="8"')}
          ${campo('matricula', 'Matrícula', 'placeholder="MAT-0000"')}
        </div>
        <div>
          <div class="r-label">Tipo de carroceria</div>
          <div class="r-chips" role="group" aria-label="Tipo de carroceria" id="formas">${chipsHtml(Object.entries(FORMAS).map(([k, f]) => [k, f.label]), carro.forma)}</div>
        </div>
        <div>
          <div class="r-label">Cor</div>
          <div class="d-flex flex-wrap" style="gap: 10px" role="group" aria-label="Cor do automóvel" id="cores"></div>
        </div>
        <div>
          <div class="r-label">Proprietário</div>
          <div class="r-chips" role="group" aria-label="Proprietário" id="props">${chipsHtml([['empresa', 'Empresa'], ['banco', 'Banco'], ['cliente', 'Particular']], carro.proprietarioTipo)}</div>
        </div>
        <div id="dono"></div>
        </div>
      </section>
      <aside class="col-12 col-xl-4"><div class="card card-body gap-3">
        <div class="r-palco r-palco-resumo">
          <div style="width: 85%; margin: 0 auto -2px" id="preview-carro"></div>
          <div class="r-palco-chao"></div>
        </div>
        <div style="font-size: 18px; font-weight: 800" id="preview-nome"></div>
        <div id="erros"></div>
        <button class="btn btn-primary" type="submit">Salvar automóvel</button>
      </div></aside>
    </form>`;

  conteudo.querySelectorAll('[data-campo]').forEach((el) =>
    el.addEventListener('input', () => {
      if (el.dataset.campo === 'placa') el.value = el.value.toUpperCase();
      carro[el.dataset.campo] = el.value;
      renderPreview();
    })
  );
  ligarChips($('formas'), (v) => {
    carro.forma = v;
    renderPreview();
  });
  $('cores').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cor]');
    if (!b) return;
    carro.cor = b.dataset.cor;
    renderCores();
    renderPreview();
  });
  ligarChips($('props'), (v) => {
    carro.proprietarioTipo = v;
    renderDono();
  });

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarErros($('erros'), []);
    try {
      await salvarAutomovel(carro, id);
      irPara('automoveis.html', 'Automóvel salvo');
    } catch (err) {
      mostrarErros($('erros'), mensagensDe(err));
    }
  });

  renderCores();
  renderDono();
  renderPreview();
}

if (sessao) iniciar().catch(() => mostrarErros(conteudo, 'Automóvel não encontrado ou servidor indisponível.'));
