import { exigirPerfil } from '../auth.js';
import { renderShell, esc, badgeLivre, icone, chipsHtml, ligarChips, mostrarErros, mensagensDe } from '../ui.js';
import { listarAutomoveis, listarAgentes, automoveisEmUso } from '../servicos.js';
import { forma, carroSvg, palco, placaHtml } from '../carros.js';

const sessao = exigirPerfil();
const ehCliente = sessao?.perfil === 'cliente';
const conteudo = document.getElementById('conteudo');
let carros = [];
let emUso = new Set();
let agentes = [];
let filtro = 'todos';

function nomeDono(c) {
  if (c.proprietarioTipo === 'cliente') return 'Particular';
  return agentes.find((a) => a.id === c.proprietarioId)?.nome ?? '—';
}

function cardCarro(c) {
  const livre = !emUso.has(c.id);
  const acao =
    ehCliente && livre
      ? `<a class="r-btn r-btn-p" style="margin-top: auto" href="pedido-form.html?carro=${c.id}">Alugar este carro</a>`
      : `<div style="margin-top: auto; min-height: 44px; display: flex; align-items: center; font-size: 13px; color: #667085">${
          livre ? 'Apenas clientes criam pedidos' : 'Indisponível no momento'
        }</div>`;
  return `
    <article class="r-card lift r-carro">
      ${palco(c.forma, c.cor)}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px">${placaHtml(c.placa)}${badgeLivre(livre)}</div>
      <div>
        <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.01em">${esc(c.marca)} ${esc(c.modelo)}</div>
        <div style="font-size: 14px; color: #475467; margin-top: 2px">${forma(c.forma).label} · ${c.ano} · ${esc(c.matricula)}</div>
      </div>
      <div style="font-size: 13px; color: #475467; display: flex; align-items: center; gap: 8px">${icone(c.proprietarioTipo, 16)} ${esc(nomeDono(c))}</div>
      ${acao}
    </article>`;
}

function renderGrade() {
  const lista = carros.filter((c) => filtro === 'todos' || c.proprietarioTipo === filtro);
  document.getElementById('grade').innerHTML = lista.length
    ? lista.map(cardCarro).join('')
    : '<div class="r-card r-vazio" style="grid-column: 1 / -1">Nenhum automóvel nesta categoria.</div>';
}

// Carro do banner: troca a cada segundo, como no protótipo.
function iniciarHero() {
  let i = 0;
  const mostrar = () => {
    const c = carros[i % carros.length];
    document.getElementById('hero-carro').innerHTML = carroSvg(c.forma, c.cor);
    document.getElementById('hero-nome').textContent = `${c.marca} ${c.modelo} · ${forma(c.forma).label}`;
    i += 1;
  };
  mostrar();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(mostrar, 1000);
}

async function iniciar() {
  renderShell('frota');
  try {
    [carros, emUso, agentes] = await Promise.all([listarAutomoveis(), automoveisEmUso(), listarAgentes()]);
  } catch (err) {
    mostrarErros(conteudo, mensagensDe(err));
    return;
  }
  const livres = carros.filter((c) => !emUso.has(c.id)).length;
  conteudo.innerHTML = `
    <section class="r-hero">
      <div style="flex: 1 1 300px; padding-bottom: 32px">
        <div class="r-hero-kicker">Pronto para pegar a estrada</div>
        <h2>Para onde vamos hoje?</h2>
        <p style="margin: 0 0 20px; font-size: 15px; color: #AEB9CA; max-width: 400px">${
          ehCliente ? 'Escolha um carro livre e monte seu pedido em minutos.' : 'Acompanhe a frota e avalie os pedidos dos clientes.'
        }</p>
        <a class="r-btn r-btn-aqua" href="${ehCliente ? 'pedido-form.html' : 'pedidos.html'}">${ehCliente ? 'Começar um pedido' : 'Ver pedidos recebidos'}</a>
      </div>
      <div style="flex: 1 1 320px; max-width: 460px; align-self: flex-end">
        <div style="width: 82%; margin: 0 auto -2px" id="hero-carro"></div>
        <div style="text-align: center; font-size: 12px; font-weight: 700; color: #AEB9CA; padding-bottom: 8px" id="hero-nome" aria-live="off"></div>
        <div style="background: #1B2639; margin: 0 -36px; padding-top: 20px"><div class="dash"></div><div style="height: 20px"></div></div>
      </div>
    </section>
    <header class="r-header">
      <div>
        <h1 class="r-h1">Frota disponível</h1>
        <p class="r-sub">${livres} de ${carros.length} automóveis livres para novos pedidos.</p>
      </div>
      <div class="r-chips" role="group" aria-label="Filtrar por proprietário" id="filtros">
        ${chipsHtml([['todos', 'Todos'], ['empresa', 'Empresas'], ['banco', 'Bancos'], ['cliente', 'Particulares']], filtro)}
      </div>
    </header>
    <div class="r-frota" id="grade"></div>`;
  ligarChips(document.getElementById('filtros'), (v) => {
    filtro = v;
    renderGrade();
  });
  renderGrade();
  if (carros.length) iniciarHero();
}

if (sessao) iniciar();
