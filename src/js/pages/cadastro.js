import { login, getSessao } from '../auth.js';
import { chipsHtml, ligarChips, mostrarErros, mensagensDe, irPara } from '../ui.js';
import { criarCliente, criarAgente } from '../servicos.js';
import { mascaraCPF, mascaraCNPJ } from '../validators.js';

if (getSessao()) window.location.replace('frota.html');

let perfil = 'cliente';
let tipo = 'banco';

document.getElementById('conteudo').innerHTML = `
  <form class="card w-100 p-4 p-sm-5 gap-3" id="form" novalidate style="max-width: 540px">
    <div>
      <h1 style="margin: 0 0 4px; font-size: 26px; letter-spacing: -0.02em">Criar conta</h1>
      <p class="r-sub">O cadastro é necessário antes de alugar ou avaliar pedidos.</p>
    </div>
    <div class="r-chips" role="group" aria-label="Tipo de conta" id="perfis">
      ${chipsHtml([['cliente', 'Sou cliente'], ['agente', 'Sou empresa ou banco']], perfil)}
    </div>
    <div><label class="form-label" for="cd-nome" id="lbl-nome">Nome completo</label><input class="form-control" id="cd-nome" autocomplete="name"></div>
    <div class="row g-3">
      <div class="col-sm-6"><label class="form-label" for="cd-email">E-mail</label><input class="form-control" id="cd-email" type="email" autocomplete="email"></div>
      <div class="col-sm-6"><label class="form-label" for="cd-senha">Senha</label><input class="form-control" id="cd-senha" type="password" autocomplete="new-password"></div>
    </div>
    <div class="row g-3" id="bloco-cliente">
      <div class="col-sm-6"><label class="form-label" for="cd-cpf">CPF</label><input class="form-control" id="cd-cpf" inputmode="numeric" placeholder="000.000.000-00"></div>
      <div class="col-sm-6"><label class="form-label" for="cd-rg">RG</label><input class="form-control" id="cd-rg"></div>
    </div>
    <div class="row g-3" id="bloco-agente" hidden>
      <div class="col-sm-6"><label class="form-label" for="cd-cnpj">CNPJ</label><input class="form-control" id="cd-cnpj" inputmode="numeric" placeholder="00.000.000/0000-00"></div>
      <div class="col-sm-6">
        <div class="r-label">Tipo de agente</div>
        <div class="r-chips" role="group" aria-label="Tipo de agente" id="tipos">${chipsHtml([['banco', 'Banco'], ['empresa', 'Empresa']], tipo)}</div>
      </div>
    </div>
    <div id="erros"></div>
    <button class="btn btn-primary" type="submit">Criar conta e entrar</button>
    <a class="btn btn-outline-secondary" href="login.html">Já tenho conta</a>
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
