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

export async function login(email, senha) {
  const emailNorm = String(email).trim().toLowerCase();
  const usuarios = await api.listar(
    `/usuarios?email=${encodeURIComponent(emailNorm)}&senha=${encodeURIComponent(senha)}`
  );
  if (usuarios.length === 0) {
    throw new Error('E-mail ou senha inválidos.');
  }
  const usuario = usuarios[0];
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
