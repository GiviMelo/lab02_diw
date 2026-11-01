// Formulário de cliente com a "Carteira do locatário": perfil (cliente), edição e cadastro (agente).
import { exigirPerfil, atualizarSessao } from '../auth.js';
import {
  renderShell, esc, moeda, iniciais, parametro, toast, confirmar,
  mostrarErros, mensagensDe, irPara, mrzNome, mrzDoc,
} from '../ui.js';
import { obterCliente, criarCliente, atualizarCliente, excluirCliente, resumoCliente } from '../servicos.js';
import { cpfValido, mascaraCPF } from '../validators.js';

const sessao = exigirPerfil(['cliente', 'agente']);
const conteudo = document.getElementById('conteudo');
const $ = (id) => document.getElementById(id);

// Cliente só edita o próprio perfil; agente edita (?id=) ou cadastra (sem id).
const modo = sessao?.perfil === 'cliente' ? 'perfil' : parametro('id') ? 'editar' : 'novo';
const id = modo === 'perfil' ? sessao.perfilId : Number(parametro('id')) || null;

let form = { nome: '', cpf: '', rg: '', profissao: '', endereco: '', rendimentos: [] };
let desde = '';
let resumo = { pedidos: 0, contratos: 0, dias: 0 };

function mesAtual() {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function renderCarteira() {
  const renda = form.rendimentos.reduce((s, r) => s + (Number(r.valor) || 0), 0);
  const checks = [
    ['nome', form.nome.trim().length >= 3],
    ['CPF válido', cpfValido(form.cpf)],
    ['RG', !!form.rg.trim()],
    ['profissão', !!form.profissao.trim()],
    ['endereço', !!form.endereco.trim()],
    ['renda', form.rendimentos.length > 0],
  ];
  const ok = checks.filter((c) => c[1]).length;
  const falta = checks.filter((c) => !c[1]).map((c) => c[0]);
  const campo = (k, v, extra = '') => `<div><div class="r-cart-k">${k}</div><div class="r-cart-v" ${extra}>${v}</div></div>`;

  $('carteira').innerHTML = `
    <svg viewBox="0 0 240 92" width="260" style="position: absolute; right: -40px; bottom: 70px; opacity: .07" aria-hidden="true"><path d="M14 70V38Q14 30 22 26L36 22H124Q134 22 140 28L172 46L218 52Q228 54 228 62V70Q228 74 224 74H14Z" fill="#fff"/><circle cx="62" cy="74" r="16" fill="#fff"/><circle cx="182" cy="74" r="16" fill="#fff"/></svg>
    <div class="r-cart-faixa" style="background: #0A6B5E"><span>CARTEIRA DO LOCATÁRIO</span><span>ROTA ALUGUEL · BR</span></div>
    <div class="r-cart-topo">
      <div class="r-avatar" style="background: #2FB5A0; box-shadow: 0 0 0 4px #0E1726, 0 0 0 6px #2FB5A0">${esc(iniciais(form.nome))}</div>
      <div style="min-width: 0; flex: 1">
        <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.01em; overflow-wrap: anywhere">${esc(form.nome || 'Nome do locatário')}</div>
        <div style="font-size: 13px; color: #AEB9CA; margin-top: 2px">${esc(form.profissao || 'Profissão não informada')}</div>
        <div class="r-pill" style="color: #7FD1C4">Membro desde ${esc(desde)}</div>
      </div>
      <svg width="40" height="30" viewBox="0 0 40 30" style="flex: none; align-self: flex-start" aria-hidden="true"><rect width="40" height="30" rx="6" fill="#D9B45B"/><path d="M0 10H40M0 20H40M14 0V30M26 0V30" stroke="#8A6D1F" stroke-width="1.2" opacity=".7"/></svg>
    </div>
    <div class="r-cart-grid">
      ${campo('CPF', esc(form.cpf || '—'), 'style="font-variant-numeric: tabular-nums"')}
      ${campo('RG', esc(form.rg || '—'))}
      ${campo('Renda total', moeda(renda), 'style="color: #7FD1C4"')}
      ${campo('Fontes de renda', `${form.rendimentos.length} de 3`)}
      <div style="grid-column: 1 / -1"><div class="r-cart-k">Endereço</div><div class="r-cart-v" style="font-weight: 600">${esc(form.endereco || '—')}</div></div>
    </div>
    <div class="r-cart-nums">
      <div><b>${resumo.pedidos}</b><span class="r-cart-k">Pedidos</span></div>
      <div><b>${resumo.contratos}</b><span class="r-cart-k">Contratos</span></div>
      <div><b>${resumo.dias}</b><span class="r-cart-k">Dias na estrada</span></div>
    </div>
    <div style="position: relative; padding: 16px 20px 0">
      <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700"><span>Perfil completo</span><span style="color: #7FD1C4">${ok} de 6 campos</span></div>
      <div style="height: 8px; border-radius: 999px; background: #243047; margin-top: 8px; overflow: hidden"><div style="width: ${Math.round((ok / 6) * 100)}%; height: 100%; border-radius: 999px; background: #2FB5A0; transition: width .3s"></div></div>
      <div style="font-size: 12px; color: #AEB9CA; margin-top: 6px">${falta.length ? `Falta: ${falta.join(', ')}.` : 'Tudo certo para agilizar suas análises.'}</div>
    </div>
    <div class="r-mrz" aria-hidden="true">${esc(mrzNome('LOCATARIO', form.nome))}<br>${esc(mrzDoc(form.cpf))}</div>
    <div style="height: 6px; background: repeating-linear-gradient(90deg, #2FB5A0 0 18px, #1F4FB5 18px 36px, #F2A93B 36px 54px)"></div>`;
}

function renderRendimentos() {
  $('rendimentos').innerHTML = form.rendimentos
    .map(
      (r, i) => `<div class="row g-2 align-items-end" data-i="${i}">
        <div class="col-md-6"><label class="form-label" for="rend-ent-${i}">Entidade empregadora ${i + 1}</label><input class="form-control rend-ent" id="rend-ent-${i}" value="${esc(r.entidadeEmpregadora)}"></div>
        <div class="col-8 col-md-4"><label class="form-label" for="rend-val-${i}">Valor mensal (R$)</label><input class="form-control rend-val" id="rend-val-${i}" type="number" min="0" step="0.01" value="${esc(r.valor)}"></div>
        <div class="col-4 col-md-2 d-grid"><button type="button" class="btn btn-outline-danger" aria-label="Remover rendimento ${i + 1}" data-remover="${i}">Remover</button></div>
      </div>`
    )
    .join('');
  $('sem-rend').hidden = form.rendimentos.length > 0;
  $('add-rend').disabled = form.rendimentos.length >= 3;
}

function htmlPagina() {
  const titulo = { perfil: 'Meu perfil', editar: 'Editar cliente', novo: 'Novo cliente' }[modo];
  const sub = modo === 'perfil' ? 'Mantenha seus dados atualizados para agilizar a análise dos pedidos.' : 'Preencha os dados do locatário.';
  const input = (idCampo, rotulo, valor, col) =>
    `<div class="${col}"><label class="form-label" for="f-${idCampo}">${rotulo}</label><input class="form-control" id="f-${idCampo}" data-campo="${idCampo}" value="${esc(valor)}"></div>`;
  return `
    ${modo !== 'perfil' ? '<a class="btn btn-outline-secondary r-voltar" href="clientes.html">← Voltar aos clientes</a>' : ''}
    <header class="mb-4">
      <h1 class="r-h1">${titulo}</h1>
      <p class="r-sub">${sub}</p>
    </header>
    <form class="row g-4 align-items-start" id="form" novalidate>
      <div class="col-12 col-xl-8 d-flex flex-column gap-4">
        <section class="card card-body">
          <h2 class="r-h2">Dados pessoais</h2>
          <div class="row g-3">
            ${input('nome', 'Nome completo', form.nome, 'col-12')}
            ${input('cpf', 'CPF', form.cpf, 'col-md-6')}
            ${input('rg', 'RG', form.rg, 'col-md-6')}
            ${input('profissao', 'Profissão', form.profissao, 'col-md-6')}
            ${input('endereco', 'Endereço', form.endereco, 'col-12')}
          </div>
        </section>
        <section class="card card-body">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <div><h2 class="r-h2" style="margin: 0 0 2px">Rendimentos</h2><p class="text-secondary m-0" style="font-size: 13px">Até 3 entidades empregadoras. Usado na avaliação financeira.</p></div>
            <button type="button" class="btn btn-outline-secondary" id="add-rend">+ Adicionar</button>
          </div>
          <div class="d-flex flex-column gap-3" id="rendimentos"></div>
          <p class="text-secondary m-0" style="font-size: 14px" id="sem-rend" hidden>Nenhum rendimento informado.</p>
        </section>
        ${
          modo === 'novo'
            ? `<section class="card card-body">
                <h2 class="r-h2" style="margin-bottom: 4px">Acesso ao sistema</h2>
                <p class="text-secondary" style="margin: 0 0 16px; font-size: 13px">O cliente entra com este e-mail e senha.</p>
                <div class="row g-3">
                  <div class="col-md-6"><label class="form-label" for="f-email">E-mail</label><input class="form-control" id="f-email" type="email" autocomplete="off"></div>
                  <div class="col-md-6"><label class="form-label" for="f-senha">Senha (mín. 6 caracteres)</label><input class="form-control" id="f-senha" type="password" autocomplete="new-password"></div>
                </div>
              </section>`
            : ''
        }
      </div>
      <aside class="col-12 col-xl-4 d-flex flex-column gap-3">
        <div class="r-carteira" id="carteira"></div>
        <div class="card p-3 gap-3">
          <div id="erros"></div>
          <button class="btn btn-primary" type="submit">${modo === 'novo' ? 'Cadastrar cliente' : 'Salvar alterações'}</button>
          ${modo === 'editar' ? '<button type="button" class="btn btn-outline-danger" id="btn-excluir">Excluir cliente</button>' : ''}
        </div>
      </aside>
    </form>`;
}

function ligarEventos() {
  // Campos simples: atualizam o estado e a carteira sem redesenhar o formulário (mantém o foco).
  conteudo.querySelectorAll('[data-campo]').forEach((el) =>
    el.addEventListener('input', () => {
      if (el.dataset.campo === 'cpf') el.value = mascaraCPF(el.value);
      form[el.dataset.campo] = el.value;
      renderCarteira();
    })
  );
  $('rendimentos').addEventListener('input', (e) => {
    const linha = e.target.closest('[data-i]');
    if (!linha) return;
    const r = form.rendimentos[Number(linha.dataset.i)];
    if (e.target.classList.contains('rend-ent')) r.entidadeEmpregadora = e.target.value;
    if (e.target.classList.contains('rend-val')) r.valor = e.target.value;
    renderCarteira();
  });
  $('rendimentos').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-remover]');
    if (!botao) return;
    form.rendimentos.splice(Number(botao.dataset.remover), 1);
    renderRendimentos();
    renderCarteira();
  });
  $('add-rend').addEventListener('click', () => {
    if (form.rendimentos.length >= 3) return;
    form.rendimentos.push({ entidadeEmpregadora: '', valor: '' });
    renderRendimentos();
    renderCarteira();
  });

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarErros($('erros'), []);
    try {
      if (modo === 'novo') {
        await criarCliente(form, $('f-email').value, $('f-senha').value);
        irPara('clientes.html', 'Cliente cadastrado');
      } else {
        await atualizarCliente(id, form);
        if (modo === 'editar') {
          irPara('clientes.html', 'Cliente atualizado');
        } else {
          atualizarSessao({ nome: form.nome.trim() });
          renderShell('perfil');
          toast('Perfil atualizado');
        }
      }
    } catch (err) {
      mostrarErros($('erros'), mensagensDe(err));
    }
  });

  $('btn-excluir')?.addEventListener('click', async () => {
    if (!(await confirmar(`Excluir o cliente "${form.nome}"? Esta ação não pode ser desfeita.`, { confirmar: 'Excluir cliente' }))) return;
    try {
      await excluirCliente(id);
      irPara('clientes.html', 'Cliente excluído');
    } catch (err) {
      mostrarErros($('erros'), mensagensDe(err));
    }
  });
}

async function iniciar() {
  renderShell(modo === 'perfil' ? 'perfil' : 'clientes');
  if (id) {
    const c = await obterCliente(id);
    form = {
      nome: c.nome,
      cpf: c.cpf,
      rg: c.rg,
      profissao: c.profissao ?? '',
      endereco: c.endereco ?? '',
      rendimentos: (c.rendimentos ?? []).map((r) => ({ ...r })),
    };
    desde = c.membroDesde ?? mesAtual();
    resumo = await resumoCliente(id);
  } else {
    desde = mesAtual();
  }
  conteudo.innerHTML = htmlPagina();
  renderRendimentos();
  renderCarteira();
  ligarEventos();
}

if (sessao) iniciar().catch(() => mostrarErros(conteudo, 'Cliente não encontrado ou servidor indisponível.'));
