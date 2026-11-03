import { exigirPerfil } from '../auth.js';
import { renderShell, esc, badgeLivre, icone, chipsHtml, ligarChips, mostrarErros, mensagensDe } from '../ui.js';
import { listarAutomoveis, listarAgentes, automoveisEmUso } from '../servicos.js';
import { forma, fotoCarro, placaHtml } from '../carros.js';

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
      ? `<a class="btn btn-primary mt-auto" href="pedido-form.html?carro=${c.id}">Alugar este carro</a>`
      : `<div class="mt-auto d-flex align-items-center" style="min-height: 44px; font-size: 13px; color: #667085">${
          livre ? 'Apenas clientes criam pedidos' : 'Indisponível no momento'
        }</div>`;
  return `
    <div class="col">
      <article class="card h-100 lift r-carro">
        ${fotoCarro(c)}
        <div class="d-flex justify-content-between align-items-start gap-2">${placaHtml(c.placa)}${badgeLivre(livre)}</div>
        <div>
          <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.01em">${esc(c.marca)} ${esc(c.modelo)}</div>
          <div class="text-secondary" style="font-size: 14px; margin-top: 2px">${forma(c.forma).label} · ${c.ano} · ${esc(c.matricula)}</div>
        </div>
        <div class="d-flex align-items-center gap-2 text-secondary" style="font-size: 13px">${icone(c.proprietarioTipo, 16)} ${esc(nomeDono(c))}</div>
        ${acao}
      </article>
    </div>`;
}

function renderGrade() {
  const lista = carros.filter((c) => filtro === 'todos' || c.proprietarioTipo === filtro);
  document.getElementById('grade').innerHTML = lista.length
    ? lista.map(cardCarro).join('')
    : '<div class="col-12"><div class="card r-vazio">Nenhum automóvel nesta categoria.</div></div>';
}

// Banner: as fotos se alternam com um esmaecimento, como o carro trocando no protótipo.
function iniciarHero() {
  const caixa = document.getElementById('hero-carro');
  caixa.innerHTML = carros.map((c) => fotoCarro(c)).join('');
  const fotos = [...caixa.children];
  let i = 0;
  const mostrar = () => {
    const c = carros[i % carros.length];
    fotos.forEach((f, k) => f.classList.toggle('ativa', k === i % carros.length));
    document.getElementById('hero-nome').textContent = `${c.marca} ${c.modelo} · ${forma(c.forma).label}`;
    i += 1;
  };
  mostrar();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(mostrar, 3000);
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
        <a class="btn btn-aqua" href="${ehCliente ? 'pedido-form.html' : 'pedidos.html'}">${ehCliente ? 'Começar um pedido' : 'Ver pedidos recebidos'}</a>
      </div>
      <div style="flex: 1 1 320px; max-width: 460px; align-self: flex-end">
        <div class="r-hero-foto" id="hero-carro"></div>
        <div class="text-center" style="font-size: 12px; font-weight: 700; color: #AEB9CA; padding: 10px 0 8px" id="hero-nome" aria-live="off"></div>
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
    <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4" id="grade"></div>
    <p class="r-foto-credito mt-4">Fotos: Wikimedia Commons, licenças Creative Commons. Passe o mouse sobre uma foto para ver o autor.</p>`;
  ligarChips(document.getElementById('filtros'), (v) => {
    filtro = v;
    renderGrade();
  });
  renderGrade();
  if (carros.length) iniciarHero();
}

if (sessao) iniciar();
