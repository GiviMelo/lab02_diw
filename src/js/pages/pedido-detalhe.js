import { exigirPerfil } from '../auth.js';
import { api } from '../api.js';
import {
  renderShell, esc, moeda, dataBR, badgeStatus, parametro, toast, confirmar,
  chipsHtml, ligarChips, mostrarErros, mensagensDe, irPara,
} from '../ui.js';
import {
  obterPedido, listarAgentes, cancelarPedido, avaliarPedido, executarContrato,
  calcularParcela, creditoValido, podeEditar, podeCancelar, rendaTotal, STATUS,
} from '../servicos.js';
import { forma, corNome, fotoCarro, creditoFoto } from '../carros.js';

const sessao = exigirPerfil();
const conteudo = document.getElementById('conteudo');
const ehAgente = sessao?.perfil === 'agente';
const ehBanco = sessao?.tipoAgente === 'banco';
const $ = (id) => document.getElementById(id);

let pedido;
let agentes = [];
// Escolhas do painel de contrato (mantidas entre recarregamentos da tela).
let propSel = 'cliente';
let instSel = null;
let comCredito = true;
const credito = { valor: '30000', parcelas: '48', taxaMensal: '1.5' };

function nomeProprietario(carro) {
  if (carro.proprietarioTipo === 'cliente') {
    return carro.proprietarioId === pedido.clienteId ? pedido.cliente.nome : 'Particular';
  }
  return agentes.find((a) => a.id === carro.proprietarioId)?.nome ?? '—';
}

async function camposDoAluguel() {
  const c = pedido.automovel;
  const campos = [
    ['Automóvel', `${c.marca} ${c.modelo}`],
    ['Placa', c.placa],
    ['Tipo · ano', `${forma(c.forma).label} · ${c.ano}`],
    ['Cor', corNome(c.cor)],
    ['Retirada', dataBR(pedido.dataInicio)],
    ['Devolução', dataBR(pedido.dataFim)],
    ['Proprietário', nomeProprietario(c)],
  ];
  if (ehAgente) campos.push(['Cliente', pedido.cliente.nome]);
  if (pedido.observacoes) campos.push(['Observações', pedido.observacoes]);
  if (pedido.contratoId) {
    const contrato = await api.obter(`/contratos/${pedido.contratoId}`);
    if (contrato.creditoId) {
      const cr = await api.obter(`/creditos/${contrato.creditoId}`);
      campos.push(['Crédito', `${moeda(cr.valor)} em ${cr.parcelas}x de ${moeda(cr.valorParcela)}`]);
    } else {
      campos.push(['Crédito', 'Sem contrato de crédito']);
    }
  }
  return campos;
}

function painelAvaliacao() {
  return `
    <div class="rounded-3 px-3 py-3" style="background: var(--r-surface-2)">
      <div class="r-kicker">Renda declarada do cliente</div>
      <div style="font-size: 22px; font-weight: 800; margin-top: 2px">${moeda(rendaTotal(pedido.cliente))}</div>
    </div>
    <div><label class="form-label" for="parecer">Parecer da avaliação (obrigatório)</label><textarea class="form-control" id="parecer" rows="3" placeholder="Justifique a decisão"></textarea></div>
    <button type="button" class="btn btn-primary" data-avaliar="sim">Aprovar análise financeira</button>
    <button type="button" class="btn btn-outline-danger" data-avaliar="nao">Reprovar</button>`;
}

function painelCredito() {
  return `
    <div class="border rounded-3 p-3 d-flex flex-column gap-3">
      <div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" role="switch" id="com-credito"${comCredito ? ' checked' : ''} aria-controls="bloco-credito">
        <label class="form-check-label" for="com-credito">Vincular contrato de crédito</label>
      </div>
      <div class="collapse${comCredito ? ' show' : ''}" id="bloco-credito">
        <div class="d-flex flex-column gap-3">
          <div><label class="form-label" for="cval">Valor financiado (R$)</label><input class="form-control" id="cval" type="number" min="0" value="${credito.valor}"></div>
          <div class="row g-2">
            <div class="col-6"><label class="form-label" for="cn">Parcelas</label><input class="form-control" id="cn" type="number" min="1" max="120" value="${credito.parcelas}"></div>
            <div class="col-6"><label class="form-label" for="ctx">Taxa (% a.m.)</label><input class="form-control" id="ctx" type="number" min="0" step="0.1" value="${credito.taxaMensal}"></div>
          </div>
          <div class="rounded-3" style="background: var(--r-tint); padding: 12px 14px">
            <div style="font-size: 12px; color: #0B5B3A; font-weight: 700">Parcela estimada (Tabela Price)</div>
            <div class="r-num" style="font-size: 22px; font-weight: 800; color: #0B5B3A" id="parcela"></div>
          </div>
        </div>
      </div>
    </div>`;
}

function painelContrato() {
  return `
    <div>
      <div class="r-label">Propriedade do automóvel</div>
      <div class="r-chips" role="group" aria-label="Propriedade do automóvel" id="prop">
        ${chipsHtml([['cliente', 'Cliente'], ['empresa', 'Empresa'], ['banco', 'Banco']], propSel)}
      </div>
    </div>
    <div id="bloco-inst" hidden>
      <div class="r-label">Instituição proprietária</div>
      <div class="r-chips" role="group" aria-label="Instituição proprietária" id="inst"></div>
    </div>
    ${ehBanco ? painelCredito() : ''}
    <button type="button" class="btn btn-primary" id="btn-contratar">Executar contrato</button>`;
}

function painelAcoes() {
  const partes = [];
  if (ehAgente && pedido.status === STATUS.ANALISE) partes.push(painelAvaliacao());
  if (ehAgente && pedido.status === STATUS.APROVADO) partes.push(painelContrato());
  if (podeEditar(sessao, pedido)) partes.push(`<a class="btn btn-outline-secondary" href="pedido-form.html?id=${pedido.id}">Editar pedido</a>`);
  if (podeCancelar(sessao, pedido)) partes.push('<button type="button" class="btn btn-outline-danger" id="btn-cancelar">Cancelar pedido</button>');
  if (!partes.length) {
    const texto =
      pedido.status === STATUS.CONTRATADO
        ? 'Contrato executado. Nenhuma ação pendente.'
        : ehAgente
          ? 'Nenhuma ação disponível para este status.'
          : 'Este pedido não pode mais ser alterado.';
    partes.push(`<p class="text-secondary m-0" style="font-size: 14px; line-height: 1.5">${texto}</p>`);
  }
  return partes.join('');
}

async function render() {
  const c = pedido.automovel;
  const campos = await camposDoAluguel();
  conteudo.innerHTML = `
    <a class="btn btn-outline-secondary r-voltar" href="pedidos.html">← Voltar aos pedidos</a>
    <header class="d-flex flex-wrap align-items-center gap-3 mb-4">
      <h1 class="r-h1 m-0">Pedido #${pedido.id}</h1>
      ${badgeStatus(pedido.status)}
    </header>
    <div class="row g-4 align-items-start">
      <div class="col-12 col-xl-8 d-flex flex-column gap-4">
        <section class="card card-body">
          <div style="max-width: 640px; width: 100%; margin: 0 auto">${fotoCarro(c, { classe: 'r-foto-detalhe' })}${creditoFoto(c)}</div>
        </section>
        <section class="card card-body">
          <h2 class="r-h2">Dados do aluguel</h2>
          <dl class="row g-4 m-0">
            ${campos
              .map(
                ([k, v]) => `<div class="col-sm-6"><dt class="r-kicker">${esc(k)}</dt><dd class="m-0 mt-1 fw-bold" style="font-size: 16px; overflow-wrap: anywhere">${esc(v)}</dd></div>`
              )
              .join('')}
          </dl>
        </section>
        <section class="card card-body">
          <h2 class="r-h2" style="margin-bottom: 20px">Histórico</h2>
          <ol class="r-timeline">
            ${pedido.historico
              .map(
                (h) => `<li>
                  <div class="r-tl-trilho"><span class="r-tl-ponto"></span><span class="r-tl-linha"></span></div>
                  <div style="padding-bottom: 20px"><div class="fw-bold">${esc(h.acao)}</div>
                    <div class="text-secondary" style="font-size: 13px">${[dataBR(h.data), h.autor, h.detalhe].filter(Boolean).map(esc).join(' · ')}</div></div>
                </li>`
              )
              .join('')}
          </ol>
        </section>
      </div>
      <aside class="col-12 col-xl-4">
        <div class="card card-body" style="gap: 14px">
          <h2 class="r-h2" style="margin: 0 0 2px">Ações</h2>
          ${painelAcoes()}
          <div id="erros"></div>
        </div>
      </aside>
    </div>`;
  ligarEventos();
}

async function executar(acao, mensagem) {
  mostrarErros($('erros'), []);
  try {
    await acao();
    await carregar();
    toast(mensagem);
  } catch (err) {
    mostrarErros($('erros'), mensagensDe(err));
  }
}

function ligarEventos() {
  $('btn-cancelar')?.addEventListener('click', async () => {
    if (await confirmar(`Cancelar o pedido #${pedido.id}? Esta ação não pode ser desfeita.`, { confirmar: 'Cancelar pedido' })) {
      executar(() => cancelarPedido(sessao, pedido), 'Pedido cancelado pelo cliente');
    }
  });

  document.querySelectorAll('[data-avaliar]').forEach((b) =>
    b.addEventListener('click', () => {
      const aprovado = b.dataset.avaliar === 'sim';
      executar(
        () => avaliarPedido(sessao, pedido, aprovado, $('parecer').value),
        aprovado ? 'Análise financeira aprovada' : 'Análise financeira reprovada'
      );
    })
  );

  if (!$('btn-contratar')) return;

  const atualizarInstituicoes = () => {
    const opcoes = agentes.filter((a) => a.tipo === propSel);
    $('bloco-inst').hidden = propSel === 'cliente';
    if (!opcoes.some((a) => a.id === instSel)) {
      // Padrão: o próprio agente logado, se for do tipo escolhido.
      instSel = opcoes.find((a) => a.id === sessao.perfilId && a.tipo === sessao.tipoAgente)?.id ?? opcoes[0]?.id ?? null;
    }
    $('inst').innerHTML = chipsHtml(opcoes.map((a) => [a.id, a.nome]), instSel);
  };
  ligarChips($('prop'), (v) => {
    propSel = v;
    atualizarInstituicoes();
  });
  ligarChips($('inst'), (v) => (instSel = Number(v)));
  atualizarInstituicoes();

  if (ehBanco) {
    // O crédito é opcional ("pode estar associado"): o switch abre/fecha o bloco (Collapse do Bootstrap).
    const bloco = bootstrap.Collapse.getOrCreateInstance($('bloco-credito'), { toggle: false });
    $('com-credito').addEventListener('change', (e) => {
      comCredito = e.target.checked;
      comCredito ? bloco.show() : bloco.hide();
    });
    const simular = () => {
      credito.valor = $('cval').value;
      credito.parcelas = $('cn').value;
      credito.taxaMensal = $('ctx').value;
      $('parcela').textContent = creditoValido(credito)
        ? moeda(calcularParcela(Number(credito.valor), Number(credito.parcelas), credito.taxaMensal))
        : moeda(0);
    };
    ['cval', 'cn', 'ctx'].forEach((id) => $(id).addEventListener('input', simular));
    simular();
  }

  $('btn-contratar').addEventListener('click', () =>
    executar(
      () =>
        executarContrato(sessao, pedido, {
          tipoPropriedade: propSel,
          proprietarioId: instSel,
          credito: ehBanco && comCredito ? { ...credito } : null,
        }),
      'Contrato executado'
    )
  );
}

async function carregar() {
  [pedido, agentes] = await Promise.all([obterPedido(parametro('id')), listarAgentes()]);
  if (!ehAgente && pedido.clienteId !== sessao.perfilId) {
    irPara('pedidos.html');
    return;
  }
  await render();
}

if (sessao) {
  renderShell('pedidos');
  carregar().catch(() => mostrarErros(conteudo, 'Pedido não encontrado ou servidor indisponível.'));
}
