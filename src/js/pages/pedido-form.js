import { exigirPerfil } from '../auth.js';
import { renderShell, esc, dataBR, parametro, mostrarErros, mensagensDe, irPara } from '../ui.js';
import { obterPedido, salvarPedido, listarLivresNoPeriodo, podeEditar, diasEntre, hoje } from '../servicos.js';
import { forma, corNome, carroSvg } from '../carros.js';

const sessao = exigirPerfil();
const conteudo = document.getElementById('conteudo');
const idPedido = Number(parametro('id')) || null;
const $ = (id) => document.getElementById(id);

let pedido = null;
let livres = [];
let carroSel = Number(parametro('carro')) || null;

function somarDias(iso, n) {
  const [a, m, d] = iso.split('-').map(Number);
  const dt = new Date(a, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function renderLivres() {
  const caixa = $('livres');
  if (!livres.length) {
    caixa.innerHTML = '<p class="text-secondary m-0" style="font-size: 14px">Nenhum automóvel livre neste período. Tente outras datas.</p>';
    return;
  }
  caixa.innerHTML = livres
    .map(
      (c) => `<button type="button" class="r-opcao" data-carro="${c.id}" aria-pressed="${c.id === carroSel}">
        <span class="d-flex flex-column gap-1 text-start">
          <span style="font-size: 16px; font-weight: 800">${esc(c.marca)} ${esc(c.modelo)}</span>
          <span class="text-secondary" style="font-size: 13px">${forma(c.forma).label} · ${corNome(c.cor)} · ${c.ano}</span>
        </span>
        <span style="font-weight: 800; letter-spacing: 0.08em; font-size: 14px">${esc(c.placa)}</span>
      </button>`
    )
    .join('');
}

function renderResumo() {
  const ini = $('ini').value;
  const fim = $('fim').value;
  const n = diasEntre(ini, fim);
  const carro = livres.find((c) => c.id === carroSel);
  $('erro-data').hidden = !(ini && fim && n <= 0);
  $('res-carro').innerHTML = carro ? carroSvg(carro.forma, carro.cor) : carroSvg('sedan', '#C5CEDB');
  $('res-nome').textContent = carro ? `${carro.marca} ${carro.modelo}` : 'Não escolhido';
  $('res-ini').textContent = dataBR(ini);
  $('res-fim').textContent = dataBR(fim);
  $('res-dias').textContent = n > 0 ? `${n} ${n === 1 ? 'dia' : 'dias'}` : '—';
  $('enviar').disabled = !(carro && n > 0);
}

// Recalcula os carros livres sempre que o período muda.
async function atualizarLivres() {
  const ini = $('ini').value;
  const fim = $('fim').value;
  if (ini && fim && fim > ini) {
    livres = await listarLivresNoPeriodo(ini, fim, pedido?.id ?? null);
    if (!livres.some((c) => c.id === carroSel)) carroSel = null;
    renderLivres();
  }
  renderResumo();
}

async function iniciar() {
  renderShell(sessao.perfil === 'cliente' && !idPedido ? 'novo' : 'pedidos');
  if (idPedido) {
    pedido = await obterPedido(idPedido);
    if (!podeEditar(sessao, pedido)) {
      irPara(`pedido-detalhe.html?id=${idPedido}`, 'Este pedido não pode mais ser alterado');
      return;
    }
    carroSel = pedido.automovelId;
  } else if (sessao.perfil !== 'cliente') {
    irPara('pedidos.html', 'Apenas clientes criam pedidos');
    return;
  }

  const inicio = pedido?.dataInicio ?? somarDias(hoje(), 1);
  const fim = pedido?.dataFim ?? somarDias(inicio, 4);
  const voltar = pedido ? `pedido-detalhe.html?id=${pedido.id}` : 'frota.html';
  const linhaResumo = (rotulo, id) =>
    `<dt class="col-5 fw-normal text-secondary">${rotulo}</dt><dd class="col-7 mb-0 fw-bold text-end" id="${id}"></dd>`;

  conteudo.innerHTML = `
    <header class="mb-4">
      <h1 class="r-h1">${pedido ? `Editar pedido #${pedido.id}` : 'Novo pedido de aluguel'}</h1>
      <p class="r-sub">Escolha o automóvel, defina o período e envie para análise.</p>
    </header>
    <form class="row g-4 align-items-start" id="form" novalidate>
      <div class="col-12 col-xl-8 d-flex flex-column gap-4">
        <section class="card card-body">
          <h2 class="r-h2" style="margin-bottom: 4px"><span class="text-primary">1.</span> Automóvel</h2>
          <p class="text-secondary" style="margin: 0 0 16px; font-size: 14px">Somente carros livres no período aparecem aqui.</p>
          <div class="d-flex flex-column" style="gap: 10px" id="livres" role="group" aria-label="Automóveis livres"></div>
        </section>
        <section class="card card-body">
          <h2 class="r-h2"><span class="text-primary">2.</span> Período</h2>
          <div class="row g-3">
            <div class="col-md-6"><label class="form-label" for="ini">Início</label><input class="form-control" id="ini" type="date" value="${inicio}"></div>
            <div class="col-md-6"><label class="form-label" for="fim">Fim</label><input class="form-control" id="fim" type="date" value="${fim}"></div>
          </div>
          <p role="alert" class="r-erro mt-3" id="erro-data" hidden>A data final deve ser depois da inicial.</p>
          <div class="mt-3"><label class="form-label" for="obs">Observações (opcional)</label><textarea class="form-control" id="obs" rows="3" placeholder="Ex.: preciso de cadeirinha infantil">${esc(pedido?.observacoes)}</textarea></div>
        </section>
      </div>
      <aside class="col-12 col-xl-4">
        <div class="card card-body gap-3">
          <div class="r-palco r-palco-resumo">
            <div style="width: 85%; margin: 0 auto -2px" id="res-carro"></div>
            <div class="r-palco-chao"></div>
          </div>
          <h2 class="r-h2 m-0">Resumo</h2>
          <dl class="row g-0 gy-2 m-0" style="font-size: 14px">
            ${linhaResumo('Automóvel', 'res-nome')}
            ${linhaResumo('Retirada', 'res-ini')}
            ${linhaResumo('Devolução', 'res-fim')}
            ${linhaResumo('Duração', 'res-dias')}
          </dl>
          <div class="text-secondary border-top pt-3" style="font-size: 13px; line-height: 1.5">
            Após o envio, o pedido entra em <strong>Em análise</strong>. Você poderá editá-lo ou cancelá-lo até a aprovação.
          </div>
          <div id="erros"></div>
          <button class="btn btn-primary" type="submit" id="enviar">${pedido ? 'Salvar alterações' : 'Enviar pedido'}</button>
          <a class="btn btn-outline-secondary" href="${voltar}">Descartar</a>
        </div>
      </aside>
    </form>`;

  $('livres').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-carro]');
    if (!botao) return;
    carroSel = Number(botao.dataset.carro);
    $('livres').querySelectorAll('[data-carro]').forEach((b) => b.setAttribute('aria-pressed', String(b === botao)));
    renderResumo();
  });
  $('ini').addEventListener('change', atualizarLivres);
  $('fim').addEventListener('change', atualizarLivres);

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarErros($('erros'), []);
    try {
      const salvo = await salvarPedido(
        sessao,
        { automovelId: carroSel, dataInicio: $('ini').value, dataFim: $('fim').value, observacoes: $('obs').value },
        pedido
      );
      irPara(`pedido-detalhe.html?id=${salvo.id}`, pedido ? `Pedido #${salvo.id} atualizado` : `Pedido #${salvo.id} enviado para análise`);
    } catch (err) {
      mostrarErros($('erros'), mensagensDe(err));
    }
  });

  await atualizarLivres();
}

if (sessao) iniciar().catch((err) => mostrarErros(conteudo, mensagensDe(err)));
