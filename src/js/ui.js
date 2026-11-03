// Construção dinâmica da interface: shell com barra lateral, avisos, confirmação e formatação.
import { getSessao, logout } from './auth.js';
import { STATUS } from './servicos.js';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const moeda = (v) =>
  'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Datas sempre como dd/mm/aaaa (datas puras "aaaa-mm-dd" não passam por fuso horário).
export function dataBR(valor) {
  if (!valor) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [a, m, d] = valor.split('-');
    return `${d}/${m}/${a}`;
  }
  return new Date(valor).toLocaleDateString('pt-BR');
}

export const iniciais = (nome) =>
  (nome || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0].toUpperCase())
    .join('');

// ---------- Status ----------

export const STATUS_LABEL = {
  [STATUS.ANALISE]: 'Em análise',
  [STATUS.APROVADO]: 'Aprovado',
  [STATUS.REPROVADO]: 'Reprovado',
  [STATUS.CONTRATADO]: 'Contratado',
  [STATUS.CANCELADO]: 'Cancelado',
};

const CORES_STATUS = {
  [STATUS.ANALISE]: ['#FFF1D6', '#7A4A00'],
  [STATUS.APROVADO]: ['#DCEBFF', '#0B3F8F'],
  [STATUS.REPROVADO]: ['#FDE2E2', '#8F1D1D'],
  [STATUS.CONTRATADO]: ['#D9F2E6', '#0B5B3A'],
  [STATUS.CANCELADO]: ['#E6E9EE', '#3B4656'],
};

function badge(texto, [fundo, cor]) {
  return `<span class="badge rounded-pill r-status" style="background:${fundo};color:${cor}">${esc(texto)}</span>`;
}

export const badgeStatus = (status) => badge(STATUS_LABEL[status] ?? status, CORES_STATUS[status] ?? ['#E6E9EE', '#3B4656']);
export const badgeLivre = (livre) =>
  livre ? badge('Livre', CORES_STATUS[STATUS.CONTRATADO]) : badge('Reservado', CORES_STATUS[STATUS.ANALISE]);

// ---------- Ícones ----------

export const ICONES = {
  frota: 'M5 17h14M3 13l2-6a2 2 0 012-1.4h10A2 2 0 0119 7l2 6v4h-3v-2H6v2H3v-4z',
  pedidos: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6M9 12h6M9 16h4',
  novo: 'M12 5v14M5 12h14',
  clientes: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  autos: 'M3 7h18M3 12h18M3 17h18',
  perfil: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  sair: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  empresa: 'M3 21V7l9-4 9 4v14M9 21v-6h6v6',
  banco: 'M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18',
  cliente: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  sol: 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  lua: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
};

export const icone = (nome, tamanho = 20) =>
  `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONES[nome]}"/></svg>`;

export const LOGO = `<svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#2FB5A0"/><path d="M7 19l2.2-5.2A2 2 0 0111 12.6h10a2 2 0 011.8 1.2L25 19v4h-2.5v-1.5h-13V23H7v-4z" stroke="#0E1726" stroke-width="1.8" stroke-linejoin="round"/><circle cx="11.5" cy="18.5" r="1.2" fill="#0E1726"/><circle cx="20.5" cy="18.5" r="1.2" fill="#0E1726"/></svg>`;

// ---------- Shell ----------

function itensMenu(sessao) {
  const cliente = sessao.perfil === 'cliente';
  const itens = [
    ['frota', 'Frota', 'frota.html'],
    ['pedidos', cliente ? 'Meus pedidos' : 'Pedidos recebidos', 'pedidos.html'],
  ];
  if (cliente) itens.push(['novo', 'Novo pedido', 'pedido-form.html']);
  else itens.push(['clientes', 'Clientes', 'clientes.html'], ['autos', 'Automóveis', 'automoveis.html']);
  itens.push(['perfil', 'Meu perfil', cliente ? 'cliente-form.html' : 'perfil-agente.html']);
  return itens;
}

// Monta a barra lateral (Offcanvas do Bootstrap: fixa no desktop, gaveta no celular);
// "ativo" é a chave do item de menu da página atual.
export function renderShell(ativo) {
  const sessao = getSessao();
  const papel = sessao.perfil === 'cliente' ? 'Cliente' : `Agente · ${sessao.tipoAgente === 'banco' ? 'Banco' : 'Empresa'}`;
  const menu = itensMenu(sessao)
    .map(
      ([chave, rotulo, href]) =>
        `<li class="nav-item"><a class="nav-link r-nav${chave === ativo ? ' active' : ''}" href="${href}"${
          chave === ativo ? ' aria-current="page"' : ''
        }>${icone(chave)}${esc(rotulo)}</a></li>`
    )
    .join('');

  const aside = document.getElementById('sidebar');
  aside.classList.add('offcanvas-lg', 'offcanvas-start');
  aside.tabIndex = -1;
  aside.setAttribute('aria-label', 'Menu principal');
  aside.innerHTML = `
    <div class="d-flex align-items-center justify-content-between">
      <a class="r-brand" href="frota.html">${LOGO} Rota Aluguel</a>
      <button type="button" class="btn-close btn-close-white d-lg-none" data-bs-dismiss="offcanvas" data-bs-target="#sidebar" aria-label="Fechar menu"></button>
    </div>
    <nav aria-label="Principal"><ul class="nav nav-pills flex-column r-menu">${menu}</ul></nav>
    <div class="r-aside-pe">
      <div class="r-user"><div class="r-user-nome">${esc(sessao.nome)}</div><div class="r-user-papel">${papel}</div></div>
      <button class="nav-link r-nav" style="color:#C5CEDB" type="button" id="btn-tema"></button>
      <button class="nav-link r-nav" style="color:#C5CEDB" type="button" id="btn-sair">${icone('sair')} Sair</button>
    </div>`;

  // Barra superior só aparece abaixo de 992px (d-lg-none) e abre o menu.
  if (!document.getElementById('topbar')) {
    aside.insertAdjacentHTML(
      'beforebegin',
      `<header class="r-topbar d-lg-none" id="topbar">
        <a class="r-brand" href="frota.html">${LOGO} Rota Aluguel</a>
        <button class="btn btn-outline-light" style="min-height:44px" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebar" aria-controls="sidebar" aria-label="Abrir menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
      </header>`
    );
  }
  const btnTema = document.getElementById('btn-tema');
  const atualizarTema = () => {
    btnTema.innerHTML = `${window.Tema.iconeSvg(20)} ${window.Tema.rotulo()}`;
  };
  btnTema.addEventListener('click', () => window.Tema.alternar());
  document.addEventListener('tema', atualizarTema);
  atualizarTema();
  document.getElementById('btn-sair').addEventListener('click', logout);
  mostrarAvisoPendente();
}

// ---------- Avisos (Toast do Bootstrap) ----------

export function toast(mensagem) {
  let area = document.getElementById('toasts');
  if (!area) {
    area = document.createElement('div');
    area.id = 'toasts';
    area.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-4';
    document.body.appendChild(area);
  }
  area.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'toast r-toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `<div class="toast-body">${esc(mensagem)}</div>`;
  area.appendChild(el);
  if (window.bootstrap) {
    new bootstrap.Toast(el, { delay: 2600 }).show();
  } else {
    el.classList.add('show');
    setTimeout(() => el.remove(), 2600);
  }
}

// Aviso que sobrevive a uma troca de página (ex.: salvar e voltar para a lista).
export function avisoNaProximaPagina(mensagem) {
  try {
    sessionStorage.setItem('aviso', mensagem);
  } catch {
    /* sem storage: o aviso simplesmente não aparece */
  }
}

export function mostrarAvisoPendente() {
  try {
    const msg = sessionStorage.getItem('aviso');
    if (msg) {
      sessionStorage.removeItem('aviso');
      toast(msg);
    }
  } catch {
    /* idem */
  }
}

export function irPara(url, mensagem) {
  if (mensagem) avisoNaProximaPagina(mensagem);
  window.location.href = url;
}

// Mostra erros (string ou lista) no estilo do protótipo; lista vazia limpa o contêiner.
export function mostrarErros(container, erros) {
  const lista = (Array.isArray(erros) ? erros : [erros]).filter(Boolean);
  container.innerHTML = lista.length
    ? `<div class="alert alert-danger" role="alert"><ul class="mb-0 ps-3">${lista.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>`
    : '';
}

export const limparErros = (container) => mostrarErros(container, []);

export const mensagensDe = (err) => err?.erros ?? [err?.message ?? String(err)];

export function confirmar(mensagem, { titulo = 'Confirmação', confirmar: rotulo = 'Confirmar' } = {}) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'modal fade';
    el.tabIndex = -1;
    el.setAttribute('aria-labelledby', 'confirmar-titulo');
    el.innerHTML = `
      <div class="modal-dialog modal-dialog-centered"><div class="modal-content p-2">
        <div class="modal-header border-0"><h2 class="modal-title r-h2 m-0" id="confirmar-titulo">${esc(titulo)}</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button></div>
        <div class="modal-body pt-0 text-secondary">${esc(mensagem)}</div>
        <div class="modal-footer border-0">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Voltar</button>
          <button type="button" class="btn btn-outline-danger" id="confirmar-sim">${esc(rotulo)}</button>
        </div>
      </div></div>`;
    document.body.appendChild(el);
    const modal = new bootstrap.Modal(el);
    let resultado = false;
    el.querySelector('#confirmar-sim').addEventListener('click', () => {
      resultado = true;
      modal.hide();
    });
    el.addEventListener('hidden.bs.modal', () => {
      el.remove();
      resolve(resultado);
    });
    modal.show();
  });
}

// ---------- Chips ----------

// opcoes: [[valor, rótulo], ...] → botões de alternância do Bootstrap (.btn.active + aria-pressed).
export const chipsHtml = (opcoes, atual) =>
  opcoes
    .map(([valor, rotulo]) => {
      const on = String(valor) === String(atual);
      return `<button type="button" class="btn chip${on ? ' active' : ''}" data-valor="${esc(valor)}" aria-pressed="${on}">${esc(rotulo)}</button>`;
    })
    .join('');

// Liga um grupo de chips: ao clicar, marca o chip e chama aoEscolher(valor).
export function ligarChips(container, aoEscolher) {
  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip[data-valor]');
    if (!chip) return;
    container.querySelectorAll('.chip').forEach((c) => {
      c.classList.toggle('active', c === chip);
      c.setAttribute('aria-pressed', String(c === chip));
    });
    aoEscolher(chip.dataset.valor);
  });
}

// ---------- Faixa "MRZ" das carteiras ----------

const semAcento = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z ]/g, '')
    .trim()
    .replace(/ +/g, '<');

export const linhaMrz = (texto, n = 32) => (texto + '<'.repeat(n)).slice(0, n);
export const mrzNome = (prefixo, nome) => linhaMrz(semAcento(nome) ? `${prefixo}<<${semAcento(nome)}` : prefixo);
export const mrzDoc = (doc) => linhaMrz(String(doc ?? '').replace(/\D/g, '') + '<<BRA<<ROTA<ALUGUEL');

export const parametro = (nome) => new URLSearchParams(window.location.search).get(nome);
