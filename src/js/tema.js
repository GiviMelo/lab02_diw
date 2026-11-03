// Tema claro/escuro. Carregado no <head> (script clássico) para aplicar o tema antes da
// primeira pintura e evitar o "flash" claro. Usa data-bs-theme, o mecanismo do Bootstrap 5.3.
(function () {
  var CHAVE = 'tema';
  var raiz = document.documentElement;

  function guardado() {
    try {
      return localStorage.getItem(CHAVE);
    } catch (e) {
      return null;
    }
  }

  function atual() {
    // ?tema=light|dark força o tema só nesta carga (útil para gerar o PDF em tema claro).
    var q = /[?&]tema=(light|dark)\b/.exec(location.search);
    if (q) return q[1];
    var g = guardado();
    if (g === 'light' || g === 'dark') return g;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function aplicar(tema) {
    raiz.setAttribute('data-bs-theme', tema);
    document.dispatchEvent(new CustomEvent('tema', { detail: tema }));
  }

  function alternar() {
    var novo = raiz.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(CHAVE, novo);
    } catch (e) {
      /* sem storage: o tema vale só nesta página */
    }
    aplicar(novo);
    return novo;
  }

  var SOL = 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4';
  var LUA = 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z';

  // O ícone mostra o tema para o qual o clique leva.
  function iconeSvg(tamanho) {
    var d = raiz.getAttribute('data-bs-theme') === 'dark' ? SOL : LUA;
    return '<svg width="' + tamanho + '" height="' + tamanho + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  function rotulo() {
    return raiz.getAttribute('data-bs-theme') === 'dark' ? 'Tema claro' : 'Tema escuro';
  }

  aplicar(atual());
  window.Tema = { atual: function () { return raiz.getAttribute('data-bs-theme'); }, alternar: alternar, iconeSvg: iconeSvg, rotulo: rotulo };

  // Páginas sem barra lateral (login, cadastro, /design) ganham um botão flutuante.
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('sidebar')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-outline-secondary r-tema-flutuante';
    b.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:1030;width:44px;padding:0;border-radius:50%;box-shadow:0 4px 12px rgba(0,0,0,.2)';
    function atualizar() {
      b.innerHTML = iconeSvg(20);
      b.setAttribute('aria-label', 'Alternar para ' + rotulo().toLowerCase());
    }
    b.addEventListener('click', alternar);
    document.addEventListener('tema', atualizar);
    atualizar();
    document.body.appendChild(b);
  });
})();
