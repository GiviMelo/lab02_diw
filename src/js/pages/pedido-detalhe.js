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
import { forma, corNome, carroSvg } from '../carros.js';

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
    }
  }
  return campos;
}

function painelAvaliacao() {
  return `
    <div style="background: #F3F5F7; border-radius: 12px; padding: 14px 16px">
      <div class="r-kicker">Renda declarada do cliente</div>
      <div style="font-size: 22px; font-weight: 800; margin-top: 2px">${moeda(rendaTotal(pedido.cliente))}</div>
    </div>
    <div><label for="parecer">Parecer da avaliação (obrigatório)</label><textarea id="parecer" rows="3" placeholder="Justifique a decisão"></textarea></div>
    <button type="button" class="r-btn r-btn-p" data-avaliar="sim">Aprovar análise financeira</button>
    <button type="button" class="r-btn r-btn-d" data-avaliar="nao">Reprovar</button>`;
}

function painelContrato() {
  return `
    <div>
      <div class="r-label" style="margin-bottom: 8px">Propriedade do automóvel</div>
      <div class="r-chips" role="group" aria-label="Propriedade do automóvel" id="prop">
        ${chipsHtml([['cliente', 'Cliente'], ['empresa', 'Empresa'], ['banco', 'Banco']], propSel)}
      </div>
    </div>
    <div id="bloco-inst" hidden>
      <div class="r-label" style="margin-bottom: 8px">Instituição proprietária</div>
      <div class="r-chips" role="group" aria-label="Instituição proprietária" id="inst"></div>
    </div>
    ${
      ehBanco
        ? `<div style="border: 1px solid #E1E6ED; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px">
            <div style="font-size: 13px; font-weight: 800">Contrato de crédito</div>
            <div><label for="cval">Valor financiado (R$)</label><input id="cval" type="number" min="0" value="${credito.valor}"></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
              <div><label for="cn">Parcelas</label><input id="cn" type="number" min="1" max="120" value="${credito.parcelas}"></div>
              <div><label for="ctx">Taxa (% a.m.)</label><input id="ctx" type="number" min="0" step="0.1" value="${credito.taxaMensal}"></div>
            </div>
            <div style="background: #EAF7F3; border-radius: 10px; padding: 12px 14px">
              <div style="font-size: 12px; color: #0B5B3A; font-weight: 700">Parcela estimada (Tabela Price)</div>
              <div class="r-num" style="font-size: 22px; font-weight: 800; color: #0B5B3A" id="parcela"></div>
            </div>
          </div>`
        : ''
    }
    <button type="button" class="r-btn r-btn-p" id="btn-contratar">Executar contrato</button>`;
}

function painelAcoes() {
  const partes = [];
  if (ehAgente && pedido.status === STATUS.ANALISE) partes.push(painelAvaliacao());
  if (ehAgente && pedido.status === STATUS.APROVADO) partes.push(painelContrato());
  if (podeEditar(sessao, pedido)) partes.push(`<a class="r-btn" href="pedido-form.html?id=${pedido.id}">Editar pedido</a>`);
  if (podeCancelar(sessao, pedido)) partes.push('<button type="button" class="r-btn r-btn-d" id="btn-cancelar">Cancelar pedido</button>');
  if (!partes.length) {
    const texto =
      pedido.status === STATUS.CONTRATADO
        ? 'Contrato executado. Nenhuma ação pendente.'
        : ehAgente
          ? 'Nenhuma ação disponível para este status.'
          : 'Este pedido não pode mais ser alterado.';
    partes.push(`<p style="margin: 0; font-size: 14px; color: #475467; line-height: 1.5">${texto}</p>`);
  }
  return partes.join('');
}

async function render() {
  const c = pedido.automovel;
  const campos = await camposDoAluguel();
  conteudo.innerHTML = `
    <a class="r-btn r-voltar" href="pedidos.html">← Voltar aos pedidos</a>
    <header style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin-bottom: 28px">
      <h1 class="r-h1" style="margin: 0">Pedido #${pedido.id}</h1>
      ${badgeStatus(pedido.status)}
    </header>
    <div class="r-colunas">
      <div class="r-col-main" style="flex-basis: 420px">
        <section class="r-card" style="overflow: hidden">
          <div class="r-palco r-palco-detalhe">
            <div style="width: 60%; max-width: 360px; margin: 0 auto -2px">${carroSvg(c.forma, c.cor)}</div>
            <div class="r-palco-chao"></div>
          </div>
        </section>
        <section class="r-card" style="padding: 24px">
          <h2 class="r-h2">Dados do aluguel</h2>
          <dl style="margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px">
            ${campos
              .map(
                ([k, v]) => `<div><dt class="r-kicker">${esc(k)}</dt><dd style="margin: 4px 0 0; font-size: 16px; font-weight: 700; overflow-wrap: anywhere">${esc(v)}</dd></div>`
              )
              .join('')}
          </dl>
        </section>
        <section class="r-card" style="padding: 24px">
          <h2 class="r-h2" style="margin-bottom: 20px">Histórico</h2>
          <ol class="r-timeline">
            ${pedido.historico
              .map(
                (h) => `<li>
                  <div class="r-tl-trilho"><span class="r-tl-ponto"></span><span class="r-tl-linha"></span></div>
                  <div style="padding-bottom: 20px"><div style="font-weight: 700">${esc(h.acao)}</div>
                    <div style="font-size: 13px; color: #475467">${[dataBR(h.data), h.autor, h.detalhe].filter(Boolean).map(esc).join(' · ')}</div></div>
                </li>`
              )
              .join('')}
          </ol>
        </section>
      </div>
      <aside class="r-card" style="flex: 1 1 320px; padding: 24px; display: flex; flex-direction: column; gap: 14px">
        <h2 class="r-h2" style="margin: 0 0 2px">Ações</h2>
        ${painelAcoes()}
        <div id="erros"></div>
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
          credito: ehBanco ? { ...credito } : null,
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
