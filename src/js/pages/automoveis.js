import { exigirPerfil } from '../auth.js';
import { renderShell, esc, toast, confirmar, mostrarErros, mensagensDe } from '../ui.js';
import { listarAutomoveis, listarAgentes, listarClientes, excluirAutomovel } from '../servicos.js';
import { forma, corNome } from '../carros.js';

const sessao = exigirPerfil(['agente']);
const conteudo = document.getElementById('conteudo');
let carros = [];
let agentes = [];
let clientes = [];

function nomeDono(c) {
  if (c.proprietarioTipo === 'cliente') return `Particular · ${clientes.find((x) => x.id === c.proprietarioId)?.nome ?? '—'}`;
  return agentes.find((a) => a.id === c.proprietarioId)?.nome ?? '—';
}

function renderLinhas() {
  document.getElementById('linhas').innerHTML = carros
    .map(
      (c) => `<tr>
        <td><div style="font-weight: 700">${esc(c.marca)} ${esc(c.modelo)}</div><div style="font-size: 12px; color: #475467">${forma(c.forma).label} · ${c.ano} · ${esc(c.matricula)}</div></td>
        <td style="font-weight: 700; letter-spacing: 0.06em">${esc(c.placa)}</td>
        <td><span style="display: inline-flex; align-items: center; gap: 8px"><span class="r-bolinha" style="background: ${/^#[0-9a-f]{6}$/i.test(c.cor) ? c.cor : '#C5CEDB'}"></span>${corNome(c.cor)}</span></td>
        <td>${esc(nomeDono(c))}</td>
        <td class="r-acoes"><a class="r-btn" href="automovel-form.html?id=${c.id}">Editar</a> <button type="button" class="r-btn r-btn-d" data-excluir="${c.id}">Excluir</button></td>
      </tr>`
    )
    .join('');
  document.getElementById('vazio').hidden = carros.length > 0;
}

async function carregar() {
  [carros, agentes, clientes] = await Promise.all([listarAutomoveis(), listarAgentes(), listarClientes()]);
  renderLinhas();
}

async function iniciar() {
  renderShell('autos');
  conteudo.innerHTML = `
    <header class="r-header">
      <div>
        <h1 class="r-h1">Automóveis</h1>
        <p class="r-sub">Gerencie a frota de empresas e bancos.</p>
      </div>
      <a class="r-btn r-btn-p" href="automovel-form.html">+ Novo automóvel</a>
    </header>
    <div id="erros" style="margin-bottom: 16px"></div>
    <div class="r-card r-table-wrap">
      <table class="r-table" style="min-width: 720px">
        <thead><tr><th>Automóvel</th><th>Placa</th><th>Cor</th><th>Proprietário</th><th><span class="visually-hidden">Ações</span></th></tr></thead>
        <tbody id="linhas"></tbody>
      </table>
      <div class="r-vazio" id="vazio" hidden>Nenhum automóvel cadastrado.</div>
    </div>`;
  document.getElementById('linhas').addEventListener('click', async (e) => {
    const botao = e.target.closest('[data-excluir]');
    if (!botao) return;
    const c = carros.find((x) => x.id === Number(botao.dataset.excluir));
    if (!(await confirmar(`Excluir ${c.marca} ${c.modelo} (${c.placa})?`, { confirmar: 'Excluir automóvel' }))) return;
    const erros = document.getElementById('erros');
    mostrarErros(erros, []);
    try {
      await excluirAutomovel(c.id);
      await carregar();
      toast('Automóvel excluído');
    } catch (err) {
      mostrarErros(erros, mensagensDe(err));
    }
  });
  await carregar();
}

if (sessao) iniciar().catch((err) => mostrarErros(conteudo, mensagensDe(err)));
