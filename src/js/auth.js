// Autenticação e controle de acesso por perfil (cliente ou agente).
import { api } from './api.js';

const CHAVE = 'sessao';

export function getSessao() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE));
  } catch {
    return null;
  }
}

// SHA-256 da senha (Web Crypto). O db.json guarda só o hash, nunca a senha.
// Sem "sal" e calculado no navegador: suficiente para a API simulada, não para produção.
export async function hashSenha(senha) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(senha)));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function login(email, senha) {
  const emailNorm = String(email).trim().toLowerCase();
  const [usuario] = await api.listar(`/usuarios?email=${encodeURIComponent(emailNorm)}`);
  if (!usuario || usuario.senhaHash !== (await hashSenha(senha))) {
    throw new Error('E-mail ou senha inválidos.');
  }
  const colecao = usuario.perfil === 'cliente' ? 'clientes' : 'agentes';
  const perfil = await api.obter(`/${colecao}/${usuario.perfilId}`);
  const sessao = {
    usuarioId: usuario.id,
    perfil: usuario.perfil,
    perfilId: usuario.perfilId,
    nome: perfil.nome,
    tipoAgente: perfil.tipo ?? null,
  };
  sessionStorage.setItem(CHAVE, JSON.stringify(sessao));
  return sessao;
}

// Mantém o nome da sessão em dia quando o usuário edita o próprio perfil.
export function atualizarSessao(campos) {
  const sessao = getSessao();
  if (!sessao) return;
  sessionStorage.setItem(CHAVE, JSON.stringify({ ...sessao, ...campos }));
}

export function logout() {
  sessionStorage.removeItem(CHAVE);
  window.location.href = 'login.html';
}

// Garante que existe um usuário logado e que o perfil dele é permitido na página.
export function exigirPerfil(perfisPermitidos = ['cliente', 'agente']) {
  const sessao = getSessao();
  if (!sessao) {
    window.location.replace('login.html');
    return null;
  }
  if (!perfisPermitidos.includes(sessao.perfil)) {
    window.location.replace('frota.html');
    return null;
  }
  return sessao;
}
