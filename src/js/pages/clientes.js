import { exigirPerfil } from '../auth.js';
import { renderShell, esc, moeda, toast, confirmar, mostrarErros, mensagensDe } from '../ui.js';
import { listarClientes, excluirCliente, rendaTotal } from '../servicos.js';

const sessao = exigirPerfil(['agente']);
const conteudo = document.getElementById('conteudo');
let clientes = [];

function renderLinhas() {
  const termo = document.getElementById('busca').value.trim().toLowerCase();
  const lista = clientes.filter((c) => !termo || c.nome.toLowerCase().includes(termo) || c.cpf.includes(termo));
  document.getElementById('linhas').innerHTML = lista
    .map(
      (c) => `<tr>
        <td><div class="fw-bold">${esc(c.nome)}</div><div class="text-secondary" style="font-size: 12px">${esc(c.profissao || 'Profissão não informada')}</div></td>
        <td class="r-num">${esc(c.cpf)}</td>
        <td class="r-num">${moeda(rendaTotal(c))}</td>
        <td class="r-acoes"><a class="btn btn-outline-secondary" href="cliente-form.html?id=${c.id}">Editar</a> <button type="button" class="btn btn-outline-danger" data-excluir="${c.id}">Excluir</button></td>
      </tr>`
    )
    .join('');
  document.getElementById('vazio').hidden = lista.length > 0;
}

async function carregar() {
  clientes = await listarClientes();
  renderLinhas();
}

async function iniciar() {
  renderShell('clientes');
  conteudo.innerHTML = `
    <header class="r-header">
      <div>
        <h1 class="r-h1">Clientes</h1>
        <p class="r-sub">Cadastre, edite e consulte os locatários.</p>
      </div>
      <a class="btn btn-primary" href="cliente-form.html?novo=1">+ Novo cliente</a>
    </header>
    <div class="mb-3" style="max-width: 420px"><label class="form-label" for="busca">Buscar por nome ou CPF</label><input class="form-control" id="busca" type="search" placeholder="Ex.: Maria"></div>
    <div id="erros" class="mb-3"></div>
    <div class="card r-table-wrap">
      <table class="table table-hover table-borderless align-middle mb-0 r-table">
        <thead><tr><th>Cliente</th><th>CPF</th><th>Renda total</th><th><span class="visually-hidden">Ações</span></th></tr></thead>
        <tbody id="linhas"></tbody>
      </table>
      <div class="r-vazio" id="vazio" hidden>Nenhum cliente encontrado.</div>
    </div>`;
  document.getElementById('busca').addEventListener('input', renderLinhas);
  document.getElementById('linhas').addEventListener('click', async (e) => {
    const botao = e.target.closest('[data-excluir]');
    if (!botao) return;
    const c = clientes.find((x) => x.id === Number(botao.dataset.excluir));
    if (!(await confirmar(`Excluir o cliente "${c.nome}"? Esta ação não pode ser desfeita.`, { confirmar: 'Excluir cliente' }))) return;
    const erros = document.getElementById('erros');
    mostrarErros(erros, []);
    try {
      await excluirCliente(c.id);
      await carregar();
      toast('Cliente excluído');
    } catch (err) {
      mostrarErros(erros, mensagensDe(err));
    }
  });
  await carregar();
}

if (sessao) iniciar().catch((err) => mostrarErros(conteudo, mensagensDe(err)));
