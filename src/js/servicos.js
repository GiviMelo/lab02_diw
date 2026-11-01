// Regras de negócio: gestão de clientes, agentes, automóveis, pedidos e contratos.
import { api } from './api.js';
import {
  validarCliente,
  validarAgente,
  validarAutomovel,
  emailValido,
  mascaraCPF,
  mascaraCNPJ,
  normalizarPlaca,
} from './validators.js';

export const STATUS = {
  ANALISE: 'Em análise',
  APROVADO: 'Aprovado financeiramente',
  REPROVADO: 'Reprovado',
  CONTRATADO: 'Contrato executado',
  CANCELADO: 'Cancelado',
};

// Pedidos nesses status ainda estão "vivos" e bloqueiam exclusões e reservas.
export const STATUS_ATIVOS = [STATUS.ANALISE, STATUS.APROVADO, STATUS.CONTRATADO];

export class ErroValidacao extends Error {
  constructor(erros) {
    super(erros.join('\n'));
    this.erros = erros;
  }
}

const agora = () => new Date().toISOString();

export function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const mesAno = () => {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export const diasEntre = (ini, fim) => (ini && fim ? Math.round((new Date(fim) - new Date(ini)) / 86400000) : 0);

function lancarSeErros(erros) {
  if (erros.length) throw new ErroValidacao(erros);
}

// ---------- Usuários ----------

async function validarCredenciais(email, senha, erros) {
  const emailNorm = String(email ?? '').trim().toLowerCase();
  if (!emailValido(emailNorm)) erros.push('E-mail inválido.');
  if (String(senha ?? '').length < 6) erros.push('A senha deve ter ao menos 6 caracteres.');
  if (emailValido(emailNorm)) {
    const existentes = await api.listar(`/usuarios?email=${encodeURIComponent(emailNorm)}`);
    if (existentes.length) erros.push('Este e-mail já está cadastrado.');
  }
  return emailNorm;
}

export async function obterUsuario(perfil, perfilId) {
  const [usuario] = await api.listar(`/usuarios?perfil=${perfil}&perfilId=${perfilId}`);
  return usuario ?? null;
}

// ---------- Clientes ----------

export const listarClientes = () => api.listar('/clientes?_sort=nome&_order=asc');
export const obterCliente = (id) => api.obter(`/clientes/${id}`);

function normalizarCliente(d) {
  return {
    nome: d.nome.trim(),
    rg: d.rg.trim(),
    cpf: mascaraCPF(d.cpf),
    endereco: (d.endereco ?? '').trim(),
    profissao: (d.profissao ?? '').trim(),
    rendimentos: (d.rendimentos ?? []).map((r) => ({
      entidadeEmpregadora: r.entidadeEmpregadora.trim(),
      valor: Number(r.valor),
    })),
  };
}

async function cpfEmUso(cpf, ignorarId) {
  const lista = await api.listar(`/clientes?cpf=${encodeURIComponent(mascaraCPF(cpf))}`);
  return lista.some((c) => c.id !== ignorarId);
}

// parcial: cadastro rápido da tela "Criar conta" (endereço e profissão vêm depois, no perfil).
export async function criarCliente(dados, email, senha, { parcial = false } = {}) {
  const erros = validarCliente(dados, { parcial });
  const emailNorm = await validarCredenciais(email, senha, erros);
  if (!erros.length && (await cpfEmUso(dados.cpf))) erros.push('Já existe um cliente com este CPF.');
  lancarSeErros(erros);
  const cliente = await api.criar('/clientes', { ...normalizarCliente(dados), membroDesde: mesAno() });
  await api.criar('/usuarios', { email: emailNorm, senha, perfil: 'cliente', perfilId: cliente.id });
  return cliente;
}

export async function atualizarCliente(id, dados) {
  const erros = validarCliente(dados);
  if (!erros.length && (await cpfEmUso(dados.cpf, Number(id)))) erros.push('Já existe outro cliente com este CPF.');
  lancarSeErros(erros);
  return api.atualizar(`/clientes/${id}`, normalizarCliente(dados));
}

export async function excluirCliente(id) {
  const pedidos = await api.listar(`/pedidos?clienteId=${id}`);
  if (pedidos.some((p) => STATUS_ATIVOS.includes(p.status))) {
    throw new ErroValidacao(['Cliente possui pedidos ativos e não pode ser excluído.']);
  }
  for (const p of pedidos) await api.remover(`/pedidos/${p.id}`);
  const usuarios = await api.listar(`/usuarios?perfil=cliente&perfilId=${id}`);
  for (const u of usuarios) await api.remover(`/usuarios/${u.id}`);
  await api.remover(`/clientes/${id}`);
}

export const rendaTotal = (cliente) => (cliente?.rendimentos ?? []).reduce((s, r) => s + Number(r.valor || 0), 0);

// Números exibidos na "Carteira do locatário".
export async function resumoCliente(clienteId) {
  const pedidos = await api.listar(`/pedidos?clienteId=${clienteId}`);
  const contratados = pedidos.filter((p) => p.status === STATUS.CONTRATADO);
  return {
    pedidos: pedidos.length,
    contratos: contratados.length,
    dias: contratados.reduce((s, p) => s + Math.max(0, diasEntre(p.dataInicio, p.dataFim)), 0),
  };
}

// ---------- Agentes ----------

export const listarAgentes = () => api.listar('/agentes?_sort=nome&_order=asc');
export const obterAgente = (id) => api.obter(`/agentes/${id}`);

async function cnpjEmUso(cnpj, ignorarId) {
  const lista = await api.listar(`/agentes?cnpj=${encodeURIComponent(mascaraCNPJ(cnpj))}`);
  return lista.some((a) => a.id !== ignorarId);
}

export async function criarAgente(dados, email, senha) {
  const erros = validarAgente(dados);
  const emailNorm = await validarCredenciais(email, senha, erros);
  if (!erros.length && (await cnpjEmUso(dados.cnpj))) erros.push('Já existe um agente com este CNPJ.');
  lancarSeErros(erros);
  const agente = await api.criar('/agentes', {
    nome: dados.nome.trim(),
    tipo: dados.tipo,
    cnpj: mascaraCNPJ(dados.cnpj),
  });
  await api.criar('/usuarios', { email: emailNorm, senha, perfil: 'agente', perfilId: agente.id });
  return agente;
}

// O tipo (empresa ou banco) é fixo após o cadastro; só razão social e CNPJ mudam.
export async function atualizarAgente(id, { nome, cnpj }) {
  const atual = await obterAgente(id);
  const erros = validarAgente({ nome, cnpj, tipo: atual.tipo });
  if (!erros.length && (await cnpjEmUso(cnpj, Number(id)))) erros.push('Já existe outro agente com este CNPJ.');
  lancarSeErros(erros);
  return api.atualizar(`/agentes/${id}`, { nome: nome.trim(), cnpj: mascaraCNPJ(cnpj) });
}

// ---------- Automóveis ----------

export const listarAutomoveis = () => api.listar('/automoveis?_sort=id&_order=asc');
export const obterAutomovel = (id) => api.obter(`/automoveis/${id}`);

async function validarUnicidadeAutomovel(dados, ignorarId, erros) {
  const placa = normalizarPlaca(dados.placa);
  const outros = (await api.listar('/automoveis')).filter((a) => a.id !== ignorarId);
  if (outros.some((a) => normalizarPlaca(a.placa) === placa)) erros.push('Já existe um automóvel com esta placa.');
  if (outros.some((a) => a.matricula.trim().toLowerCase() === dados.matricula.trim().toLowerCase())) {
    erros.push('Já existe um automóvel com esta matrícula.');
  }
}

export async function salvarAutomovel(dados, id = null) {
  const erros = validarAutomovel(dados);
  if (!['empresa', 'banco', 'cliente'].includes(dados.proprietarioTipo)) erros.push('Escolha o proprietário.');
  else if (!dados.proprietarioId) erros.push('Escolha quem é o proprietário.');
  if (!erros.length) await validarUnicidadeAutomovel(dados, id, erros);
  lancarSeErros(erros);
  const corpo = {
    matricula: dados.matricula.trim(),
    ano: Number(dados.ano),
    marca: dados.marca.trim(),
    modelo: dados.modelo.trim(),
    placa: normalizarPlaca(dados.placa),
    forma: dados.forma,
    cor: dados.cor.toUpperCase(),
    proprietarioTipo: dados.proprietarioTipo,
    proprietarioId: Number(dados.proprietarioId),
  };
  return id ? api.atualizar(`/automoveis/${id}`, corpo) : api.criar('/automoveis', corpo);
}

export async function excluirAutomovel(id) {
  const pedidos = await api.listar(`/pedidos?automovelId=${id}`);
  if (pedidos.length) {
    throw new ErroValidacao(['Automóvel possui pedidos e não pode ser excluído.']);
  }
  await api.remover(`/automoveis/${id}`);
}

// ---------- Disponibilidade ----------

// Um pedido "segura" o carro enquanto está ativo e o período ainda não acabou.
const seguraCarro = (p) => STATUS_ATIVOS.includes(p.status) && p.dataFim >= hoje();

export async function automoveisEmUso() {
  const pedidos = await api.listar('/pedidos');
  return new Set(pedidos.filter(seguraCarro).map((p) => p.automovelId));
}

// Carros sem pedido ativo que se sobreponha ao período [ini, fim].
export async function listarLivresNoPeriodo(ini, fim, pedidoIgnoradoId = null) {
  const [carros, pedidos] = await Promise.all([listarAutomoveis(), api.listar('/pedidos')]);
  const bloqueados = new Set(
    pedidos
      .filter((p) => p.id !== pedidoIgnoradoId && STATUS_ATIVOS.includes(p.status))
      .filter((p) => !(p.dataFim < ini || p.dataInicio > fim))
      .map((p) => p.automovelId)
  );
  return carros.filter((c) => !bloqueados.has(c.id));
}

// ---------- Pedidos ----------

// O JSON Server pluraliza "automovel" como "automovels", então o automóvel é
// anexado aqui em vez de usar _expand (só o cliente usa _expand).
async function anexarAutomoveis(pedidos) {
  const carros = await listarAutomoveis();
  return pedidos.map((p) => ({ ...p, automovel: carros.find((a) => a.id === p.automovelId) ?? null }));
}

export async function listarPedidos(sessao) {
  const filtro = sessao.perfil === 'cliente' ? `&clienteId=${sessao.perfilId}` : '';
  return anexarAutomoveis(await api.listar(`/pedidos?_expand=cliente&_sort=id&_order=desc${filtro}`));
}

export async function obterPedido(id) {
  const [pedido] = await anexarAutomoveis([await api.obter(`/pedidos/${id}?_expand=cliente`)]);
  return pedido;
}

function registrar(pedido, autor, acao, detalhe = null) {
  const evento = { data: agora(), autor, acao };
  if (detalhe) evento.detalhe = detalhe;
  return [...(pedido?.historico ?? []), evento];
}

// Clientes editam pedidos "Em análise"; agentes também podem modificar pedidos aprovados.
export function podeEditar(sessao, pedido) {
  if (sessao.perfil === 'cliente') return pedido.clienteId === sessao.perfilId && pedido.status === STATUS.ANALISE;
  return [STATUS.ANALISE, STATUS.APROVADO].includes(pedido.status);
}

export const podeCancelar = (sessao, pedido) =>
  sessao.perfil === 'cliente' && pedido.clienteId === sessao.perfilId && [STATUS.ANALISE, STATUS.APROVADO].includes(pedido.status);

// dados: { automovelId, dataInicio, dataFim, observacoes }
export async function salvarPedido(sessao, dados, existente = null) {
  if (existente && !podeEditar(sessao, existente)) throw new ErroValidacao(['Este pedido não pode mais ser alterado.']);
  if (!existente && sessao.perfil !== 'cliente') throw new ErroValidacao(['Apenas clientes introduzem pedidos.']);

  const erros = [];
  const { dataInicio, dataFim } = dados;
  if (!dataInicio || !dataFim) erros.push('Informe as datas de retirada e devolução.');
  else {
    // Uma data de início já existente (e talvez passada) pode ser mantida na edição.
    const inicioMudou = !existente || dataInicio !== existente.dataInicio;
    if (inicioMudou && dataInicio < hoje()) erros.push('A data de retirada não pode estar no passado.');
    if (dataFim <= dataInicio) erros.push('A data final deve ser depois da inicial.');
  }
  if (!dados.automovelId) erros.push('Escolha um automóvel.');
  if (!erros.length) {
    const livres = await listarLivresNoPeriodo(dataInicio, dataFim, existente?.id ?? null);
    if (!livres.some((c) => c.id === Number(dados.automovelId))) erros.push('Este automóvel não está livre no período escolhido.');
  }
  lancarSeErros(erros);

  const campos = {
    automovelId: Number(dados.automovelId),
    dataInicio,
    dataFim,
    observacoes: (dados.observacoes ?? '').trim(),
  };

  if (existente) {
    const acao = sessao.perfil === 'agente' ? 'Pedido modificado pelo agente' : 'Pedido modificado';
    return api.atualizar(`/pedidos/${existente.id}`, { ...campos, historico: registrar(existente, sessao.nome, acao) });
  }
  return api.criar('/pedidos', {
    clienteId: sessao.perfilId,
    ...campos,
    dataCriacao: agora(),
    status: STATUS.ANALISE,
    avaliacoes: [],
    // contratoId só é gravado na execução do contrato: o JSON Server 0.17 quebra
    // nos DELETEs quando algum campo "...Id" vale null.
    historico: registrar(null, sessao.nome, 'Pedido enviado'),
  });
}

export async function cancelarPedido(sessao, pedido) {
  if (!podeCancelar(sessao, pedido)) {
    throw new ErroValidacao(['Só é possível cancelar pedidos em análise ou aprovados (ainda sem contrato).']);
  }
  return api.atualizar(`/pedidos/${pedido.id}`, {
    status: STATUS.CANCELADO,
    historico: registrar(pedido, sessao.nome, 'Pedido cancelado pelo cliente'),
  });
}

export async function avaliarPedido(sessao, pedido, aprovado, parecer) {
  if (pedido.status !== STATUS.ANALISE) {
    throw new ErroValidacao(['Apenas pedidos em análise podem ser avaliados.']);
  }
  const texto = (parecer ?? '').trim();
  if (texto.length < 5) throw new ErroValidacao(['Escreva um parecer antes de decidir.']);
  const avaliacao = { agenteId: sessao.perfilId, agenteNome: sessao.nome, aprovado, parecer: texto, data: agora() };
  return api.atualizar(`/pedidos/${pedido.id}`, {
    status: aprovado ? STATUS.APROVADO : STATUS.REPROVADO,
    avaliacoes: [...(pedido.avaliacoes ?? []), avaliacao],
    historico: registrar(
      pedido,
      sessao.nome,
      aprovado ? 'Análise financeira aprovada' : 'Análise financeira reprovada',
      `Parecer: ${texto}`
    ),
  });
}

// Parcela pela Tabela Price.
export function calcularParcela(valor, parcelas, taxaMensalPercent) {
  const i = Number(taxaMensalPercent) / 100;
  if (!i) return valor / parcelas;
  return (valor * i) / (1 - Math.pow(1 + i, -parcelas));
}

export const creditoValido = ({ valor, parcelas, taxaMensal }) =>
  Number(valor) > 0 &&
  Number.isInteger(Number(parcelas)) &&
  Number(parcelas) >= 1 &&
  Number(parcelas) <= 120 &&
  taxaMensal !== '' &&
  Number(taxaMensal) >= 0;

// dados: { tipoPropriedade: 'cliente'|'empresa'|'banco', proprietarioId (agente), credito?: {valor, parcelas, taxaMensal} }
export async function executarContrato(sessao, pedido, dados) {
  if (pedido.status !== STATUS.APROVADO) {
    throw new ErroValidacao(['O contrato só pode ser executado para pedidos aprovados financeiramente.']);
  }
  const erros = [];
  if (!['cliente', 'empresa', 'banco'].includes(dados.tipoPropriedade)) erros.push('Escolha a propriedade do automóvel.');
  if (dados.tipoPropriedade !== 'cliente' && !dados.proprietarioId) erros.push('Escolha a instituição proprietária.');
  if (dados.credito) {
    if (sessao.tipoAgente !== 'banco') erros.push('Apenas agentes do tipo banco podem conceder crédito.');
    else if (!creditoValido(dados.credito)) erros.push('Informe valor, parcelas (1–120) e taxa válidos.');
  }
  lancarSeErros(erros);

  let creditoId = null;
  let detalhe = null;
  if (dados.credito) {
    const valor = Number(dados.credito.valor);
    const parcelas = Number(dados.credito.parcelas);
    const taxaMensal = Number(dados.credito.taxaMensal);
    const valorParcela = Number(calcularParcela(valor, parcelas, taxaMensal).toFixed(2));
    const c = await api.criar('/creditos', {
      bancoId: sessao.perfilId,
      pedidoId: pedido.id,
      valor,
      parcelas,
      taxaMensal,
      valorParcela,
      dataConcessao: agora(),
    });
    creditoId = c.id;
    const fmt = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    detalhe = `Crédito de R$ ${fmt(valor)} em ${parcelas}x de R$ ${fmt(valorParcela)}`;
  }

  const proprietarioId = dados.tipoPropriedade === 'cliente' ? pedido.clienteId : Number(dados.proprietarioId);
  // creditoId fica ausente (e não null) quando não há crédito; ver comentário em salvarPedido.
  const contrato = await api.criar('/contratos', {
    pedidoId: pedido.id,
    agenteId: sessao.perfilId,
    tipoPropriedade: dados.tipoPropriedade,
    proprietarioId,
    ...(creditoId ? { creditoId } : {}),
    dataExecucao: agora(),
  });

  await api.atualizar(`/automoveis/${pedido.automovelId}`, {
    proprietarioTipo: dados.tipoPropriedade,
    proprietarioId,
  });

  return api.atualizar(`/pedidos/${pedido.id}`, {
    status: STATUS.CONTRATADO,
    contratoId: contrato.id,
    historico: registrar(pedido, sessao.nome, 'Contrato executado', detalhe),
  });
}
