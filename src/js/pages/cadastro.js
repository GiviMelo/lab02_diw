import { login, getSessao } from '../auth.js';
import { chipsHtml, ligarChips, mostrarErros, mensagensDe, irPara } from '../ui.js';
import { criarCliente, criarAgente } from '../servicos.js';
import { mascaraCPF, mascaraCNPJ } from '../validators.js';

if (getSessao()) window.location.replace('frota.html');

let perfil = 'cliente';
let tipo = 'banco';

document.getElementById('conteudo').innerHTML = `
  <form class="r-card" id="form" novalidate style="width: 100%; max-width: 540px; padding: 36px; box-sizing: border-box; display: flex; flex-direction: column; gap: 16px">
    <div>
      <h1 style="margin: 0 0 4px; font-size: 26px; letter-spacing: -0.02em">Criar conta</h1>
      <p style="margin: 0; color: #475467; font-size: 15px">O cadastro é necessário antes de alugar ou avaliar pedidos.</p>
    </div>
    <div class="r-chips" role="group" aria-label="Tipo de conta" id="perfis">
      ${chipsHtml([['cliente', 'Sou cliente'], ['agente', 'Sou empresa ou banco']], perfil)}
    </div>
    <div><label for="cd-nome" id="lbl-nome">Nome completo</label><input id="cd-nome" autocomplete="name"></div>
    <div class="r-grid-2">
      <div><label for="cd-email">E-mail</label><input id="cd-email" type="email" autocomplete="email"></div>
      <div><label for="cd-senha">Senha</label><input id="cd-senha" type="password" autocomplete="new-password"></div>
    </div>
    <div class="r-grid-2" id="bloco-cliente">
      <div><label for="cd-cpf">CPF</label><input id="cd-cpf" inputmode="numeric" placeholder="000.000.000-00"></div>
      <div><label for="cd-rg">RG</label><input id="cd-rg"></div>
    </div>
    <div class="r-grid-2" id="bloco-agente" hidden>
      <div><label for="cd-cnpj">CNPJ</label><input id="cd-cnpj" inputmode="numeric" placeholder="00.000.000/0000-00"></div>
      <div>
        <div class="r-label">Tipo de agente</div>
        <div class="r-chips" role="group" aria-label="Tipo de agente" id="tipos">${chipsHtml([['banco', 'Banco'], ['empresa', 'Empresa']], tipo)}</div>
      </div>
    </div>
    <div id="erros"></div>
    <button class="r-btn r-btn-p" type="submit">Criar conta e entrar</button>
    <a class="r-btn" href="login.html">Já tenho conta</a>
  </form>`;

const $ = (id) => document.getElementById(id);

ligarChips($('perfis'), (v) => {
  perfil = v;
  $('bloco-cliente').hidden = perfil !== 'cliente';
  $('bloco-agente').hidden = perfil === 'cliente';
  $('lbl-nome').textContent = perfil === 'cliente' ? 'Nome completo' : 'Razão social';
  mostrarErros($('erros'), []);
});
ligarChips($('tipos'), (v) => (tipo = v));
$('cd-cpf').addEventListener('input', (e) => (e.target.value = mascaraCPF(e.target.value)));
$('cd-cnpj').addEventListener('input', (e) => (e.target.value = mascaraCNPJ(e.target.value)));

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  mostrarErros($('erros'), []);
  const email = $('cd-email').value;
  const senha = $('cd-senha').value;
  try {
    if (perfil === 'cliente') {
      await criarCliente({ nome: $('cd-nome').value, cpf: $('cd-cpf').value, rg: $('cd-rg').value }, email, senha, { parcial: true });
    } else {
      await criarAgente({ nome: $('cd-nome').value, tipo, cnpj: $('cd-cnpj').value }, email, senha);
    }
    await login(email, senha);
    irPara(perfil === 'cliente' ? 'cliente-form.html' : 'frota.html', 'Conta criada com sucesso');
  } catch (err) {
    mostrarErros($('erros'), mensagensDe(err));
  }
});
