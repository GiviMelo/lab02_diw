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
    caixa.innerHTML = '<p style="margin: 0; font-size: 14px; color: #475467">Nenhum automóvel livre neste período. Tente outras datas.</p>';
    return;
  }
  caixa.innerHTML = livres
    .map(
      (c) => `<button type="button" class="r-opcao" data-carro="${c.id}" aria-pressed="${c.id === carroSel}">
        <span style="display: flex; flex-direction: column; gap: 2px; text-align: left">
          <span style="font-size: 16px; font-weight: 800">${esc(c.marca)} ${esc(c.modelo)}</span>
          <span style="font-size: 13px; color: #475467">${forma(c.forma).label} · ${corNome(c.cor)} · ${c.ano}</span>
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

  conteudo.innerHTML = `
    <header style="margin-bottom: 28px">
      <h1 class="r-h1">${pedido ? `Editar pedido #${pedido.id}` : 'Novo pedido de aluguel'}</h1>
      <p class="r-sub">Escolha o automóvel, defina o período e envie para análise.</p>
    </header>
    <form class="r-colunas" id="form" novalidate>
      <div class="r-col-main">
        <section class="r-card" style="padding: 24px">
          <h2 class="r-h2" style="margin-bottom: 4px"><span style="color: #0A6B5E">1.</span> Automóvel</h2>
          <p style="margin: 0 0 16px; font-size: 14px; color: #475467">Somente carros livres no período aparecem aqui.</p>
          <div style="display: flex; flex-direction: column; gap: 10px" id="livres" role="group" aria-label="Automóveis livres"></div>
        </section>
        <section class="r-card" style="padding: 24px">
          <h2 class="r-h2"><span style="color: #0A6B5E">2.</span> Período</h2>
          <div class="r-grid-2">
            <div><label for="ini">Início</label><input id="ini" type="date" value="${inicio}"></div>
            <div><label for="fim">Fim</label><input id="fim" type="date" value="${fim}"></div>
          </div>
          <p role="alert" class="r-erro" id="erro-data" style="margin-top: 12px" hidden>A data final deve ser depois da inicial.</p>
          <div style="margin-top: 16px"><label for="obs">Observações (opcional)</label><textarea id="obs" rows="3" placeholder="Ex.: preciso de cadeirinha infantil">${esc(pedido?.observacoes)}</textarea></div>
        </section>
      </div>
      <aside class="r-card r-col-side" style="padding: 24px; display: flex; flex-direction: column; gap: 16px">
        <div class="r-palco r-palco-resumo">
          <div style="width: 85%; margin: 0 auto -2px" id="res-carro"></div>
          <div class="r-palco-chao"></div>
        </div>
        <h2 class="r-h2" style="margin: 0">Resumo</h2>
        <dl style="margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 10px 16px; font-size: 14px">
          <dt style="color: #475467; font-weight: 400">Automóvel</dt><dd style="margin: 0; font-weight: 700; text-align: right" id="res-nome"></dd>
          <dt style="color: #475467; font-weight: 400">Retirada</dt><dd style="margin: 0; font-weight: 700; text-align: right" id="res-ini"></dd>
          <dt style="color: #475467; font-weight: 400">Devolução</dt><dd style="margin: 0; font-weight: 700; text-align: right" id="res-fim"></dd>
          <dt style="color: #475467; font-weight: 400">Duração</dt><dd style="margin: 0; font-weight: 700; text-align: right" id="res-dias"></dd>
        </dl>
        <div style="font-size: 13px; color: #475467; line-height: 1.5; border-top: 1px solid #E1E6ED; padding-top: 14px">
          Após o envio, o pedido entra em <strong>Em análise</strong>. Você poderá editá-lo ou cancelá-lo até a aprovação.
        </div>
        <div id="erros"></div>
        <button class="r-btn r-btn-p" type="submit" id="enviar">${pedido ? 'Salvar alterações' : 'Enviar pedido'}</button>
        <a class="r-btn" href="${voltar}">Descartar</a>
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
