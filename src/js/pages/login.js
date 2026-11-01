import { login, getSessao } from '../auth.js';
import { mostrarAvisoPendente } from '../ui.js';

if (getSessao()) window.location.replace('frota.html');
mostrarAvisoPendente();

const erro = document.getElementById('erro-login');
const email = document.getElementById('email');
const senha = document.getElementById('senha');

async function entrar(e, s) {
  erro.hidden = true;
  try {
    await login(e, s);
    window.location.href = 'frota.html';
  } catch (err) {
    erro.textContent = err.message.includes('servidor') ? err.message : 'E-mail ou senha incorretos.';
    erro.hidden = false;
  }
}

document.getElementById('form-login').addEventListener('submit', (e) => {
  e.preventDefault();
  entrar(email.value, senha.value);
});

// Contas de demonstração: entram direto com a senha padrão do db.json.
document.getElementById('contas').addEventListener('click', (e) => {
  const botao = e.target.closest('[data-email]');
  if (!botao) return;
  email.value = botao.dataset.email;
  senha.value = '123456';
  entrar(botao.dataset.email, '123456');
});
