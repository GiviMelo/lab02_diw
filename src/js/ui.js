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
  return `<span class="r-badge" style="background:${fundo};color:${cor}">${esc(texto)}</span>`;
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

// Monta a barra lateral; "ativo" é a chave do item de menu da página atual.
export function renderShell(ativo) {
  const sessao = getSessao();
  const papel = sessao.perfil === 'cliente' ? 'Cliente' : `Agente · ${sessao.tipoAgente === 'banco' ? 'Banco' : 'Empresa'}`;
  const menu = itensMenu(sessao)
    .map(
      ([chave, rotulo, href]) =>
        `<a class="r-nav" href="${href}"${chave === ativo ? ' aria-current="page"' : ''}>${icone(chave === 'perfil' ? 'perfil' : chave)}${esc(rotulo)}</a>`
    )
    .join('');
  document.getElementById('sidebar').innerHTML = `
    <a class="r-brand" href="frota.html">${LOGO} Rota Aluguel</a>
    <nav aria-label="Principal" class="r-menu">${menu}</nav>
    <div class="r-aside-pe">
      <div class="r-user"><div class="r-user-nome">${esc(sessao.nome)}</div><div class="r-user-papel">${papel}</div></div>
      <button class="r-nav" type="button" id="btn-sair">${icone('sair')} Sair</button>
    </div>`;
  document.getElementById('btn-sair').addEventListener('click', logout);
  mostrarAvisoPendente();
}

// ---------- Avisos ----------

let timerToast;
export function toast(mensagem) {
  document.querySelector('.r-toast')?.remove();
  const el = document.createElement('div');
  el.className = 'r-toast';
  el.setAttribute('role', 'status');
  el.textContent = mensagem;
  document.body.appendChild(el);
  clearTimeout(timerToast);
  timerToast = setTimeout(() => el.remove(), 2600);
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
    ? `<ul role="alert" class="r-erros">${lista.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`
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
      <div class="modal-dialog modal-dialog-centered"><div class="modal-content r-card" style="padding:12px">
        <div class="modal-header border-0"><h2 class="modal-title r-h2 m-0" id="confirmar-titulo">${esc(titulo)}</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button></div>
        <div class="modal-body pt-0" style="color:#475467">${esc(mensagem)}</div>
        <div class="modal-footer border-0">
          <button type="button" class="r-btn" data-bs-dismiss="modal">Voltar</button>
          <button type="button" class="r-btn r-btn-d" id="confirmar-sim">${esc(rotulo)}</button>
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

// opcoes: [[valor, rótulo], ...] → botões .chip com aria-pressed.
export const chipsHtml = (opcoes, atual) =>
  opcoes
    .map(([valor, rotulo]) => `<button type="button" class="chip" data-valor="${esc(valor)}" aria-pressed="${String(valor) === String(atual)}">${esc(rotulo)}</button>`)
    .join('');

// Liga um grupo de chips: ao clicar, marca o chip e chama aoEscolher(valor).
export function ligarChips(container, aoEscolher) {
  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip[data-valor]');
    if (!chip) return;
    container.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
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
