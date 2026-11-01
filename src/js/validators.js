// Funções de validação e máscara reutilizadas pelos formulários e serviços.

export const somenteDigitos = (s) => String(s ?? '').replace(/\D/g, '');

export function mascaraCPF(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function mascaraCNPJ(valor) {
  const d = somenteDigitos(valor).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function cpfValido(cpf) {
  const d = somenteDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  for (const t of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(d[t])) return false;
  }
  return true;
}

export function cnpjValido(cnpj) {
  const d = somenteDigitos(cnpj);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  for (const t of [12, 13]) {
    const pesos = t === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((acc, p, i) => acc + p * Number(d[i]), 0);
    const dv = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (dv !== Number(d[t])) return false;
  }
  return true;
}

export const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e ?? '').trim());

// Aceita placa antiga (ABC1234) e Mercosul (ABC1D23).
export const placaValida = (p) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(normalizarPlaca(p));

export const normalizarPlaca = (p) => String(p ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// parcial: cadastro rápido (nome, CPF e RG); o restante é completado no perfil.
export function validarCliente(c, { parcial = false } = {}) {
  const erros = [];
  if ((c.nome?.trim().length ?? 0) < 3) erros.push('Informe o nome completo.');
  if (!cpfValido(c.cpf)) erros.push('CPF inválido.');
  if (!c.rg?.trim()) erros.push('Informe o RG.');
  if (!parcial) {
    if (!c.profissao?.trim()) erros.push('Informe a profissão.');
    if (!c.endereco?.trim()) erros.push('Informe o endereço.');
  }
  const r = c.rendimentos ?? [];
  if (r.length > 3) erros.push('São permitidas no máximo 3 entidades empregadoras.');
  r.forEach((x, i) => {
    if (!x.entidadeEmpregadora?.trim() || !(Number(x.valor) > 0)) {
      erros.push(`Rendimento ${i + 1}: informe a entidade e um valor maior que zero.`);
    }
  });
  return erros;
}

export function validarAgente(a) {
  const erros = [];
  if ((a.nome?.trim().length ?? 0) < 3) erros.push('Informe a razão social.');
  if (!['empresa', 'banco'].includes(a.tipo)) erros.push('Selecione o tipo (empresa ou banco).');
  if (!cnpjValido(a.cnpj)) erros.push('CNPJ inválido.');
  return erros;
}

export const FORMAS_VALIDAS = ['hatch', 'sedan', 'suv', 'picape'];

export function validarAutomovel(a) {
  const erros = [];
  if (!a.marca?.trim()) erros.push('Informe a marca.');
  if (!a.modelo?.trim()) erros.push('Informe o modelo.');
  const ano = Number(a.ano);
  const anoMax = new Date().getFullYear() + 1;
  if (!Number.isInteger(ano) || ano < 1990 || ano > anoMax) erros.push(`Ano deve estar entre 1990 e ${anoMax}.`);
  if (!placaValida(a.placa)) erros.push('Placa inválida (ex.: ABC1D23).');
  if (!a.matricula?.trim()) erros.push('Informe a matrícula.');
  if (!FORMAS_VALIDAS.includes(a.forma)) erros.push('Escolha o tipo de carroceria.');
  if (!/^#[0-9a-f]{6}$/i.test(a.cor ?? '')) erros.push('Escolha a cor do automóvel.');
  return erros;
}
