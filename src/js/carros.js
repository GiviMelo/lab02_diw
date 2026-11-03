// Automóveis: fotos reais, ilustração de reserva (carrocerias e paleta de cores) e placa Mercosul.
import { fotoValida } from './validators.js';

export const FORMAS = {
  hatch: {
    label: 'Hatch',
    body: 'M14 70V38Q14 30 22 26L36 22H124Q134 22 140 28L172 46L218 52Q228 54 228 62V70Q228 74 224 74H14Z',
    win: 'M34 28H122Q128 28 132 32L158 46H28Z',
    pil: 'M84 28V46',
  },
  sedan: {
    label: 'Sedã',
    body: 'M14 70V56Q14 50 22 49L50 46L78 26Q82 22 90 22H134Q142 22 148 28L172 46L218 52Q228 54 228 62V70Q228 74 224 74H14Z',
    win: 'M84 29H132Q138 29 142 33L160 46H66Z',
    pil: 'M108 29V46',
  },
  suv: {
    label: 'SUV',
    body: 'M14 70V30Q14 22 22 20L34 14H128Q138 14 144 22L176 44L218 50Q228 52 228 62V70Q228 74 224 74H14Z',
    win: 'M30 21H126Q132 21 136 27L162 44H26Z',
    pil: 'M80 21V44',
  },
  picape: {
    label: 'Picape',
    body: 'M14 70V44Q14 40 20 40H86V28Q86 22 94 22H138Q146 22 152 28L172 42L218 50Q228 52 228 62V70Q228 74 224 74H14Z',
    win: 'M94 28H136Q142 28 146 32L158 42H94Z',
    pil: 'M120 28V42',
  },
};

export const PALETA = [
  ['Branco', '#E8ECF1'],
  ['Prata', '#8A97A8'],
  ['Grafite', '#3B4656'],
  ['Azul', '#1F4FB5'],
  ['Vermelho', '#C0392B'],
  ['Âmbar', '#F2A93B'],
  ['Verde-água', '#2FB5A0'],
];

const COR_PADRAO = '#C5CEDB';

export const forma = (chave) => FORMAS[chave] ?? FORMAS.hatch;

export function corNome(hex) {
  const p = PALETA.find((x) => x[1].toLowerCase() === String(hex).toLowerCase());
  return p ? p[0] : 'Personalizada';
}

// Só aceita cores hexadecimais, pois o valor vai direto para o SVG.
const corSegura = (cor) => (/^#[0-9a-f]{6}$/i.test(cor ?? '') ? cor : COR_PADRAO);

export function carroSvg(chaveForma, cor) {
  const f = forma(chaveForma);
  const c = corSegura(cor);
  return `<svg viewBox="0 0 240 92" width="100%" style="display:block" aria-hidden="true"><ellipse cx="120" cy="89" rx="104" ry="3" fill="#000" opacity=".2"/><path d="${f.body}" fill="${c}"/><path d="${f.win}" fill="#0E1726" opacity=".85"/><path d="${f.pil}" stroke="${c}" stroke-width="3"/><rect x="216" y="56" width="10" height="5" rx="2" fill="#FFE9A8"/><rect x="14" y="58" width="6" height="5" rx="2" fill="#E5484D"/><circle cx="62" cy="74" r="16" fill="#0E1726"/><circle cx="62" cy="74" r="7" fill="#C5CEDB"/><circle cx="182" cy="74" r="16" fill="#0E1726"/><circle cx="182" cy="74" r="7" fill="#C5CEDB"/></svg>`;
}

// ---------- Fotos reais ----------
// Cada automóvel pode ter `foto` (caminho local em img/carros ou URL https), `fotoCredito` e `fotoFonte`.
// Sem foto, ou se a imagem não carregar, cai de volta na ilustração.

const attr = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

export function fotoCarro(c, { classe = '' } = {}) {
  if (!c || !fotoValida(c.foto)) return `<div class="r-foto r-foto-vazia ${classe}">${carroSvg(c?.forma, c?.cor)}</div>`;
  const alt = `${c.marca ?? ''} ${c.modelo ?? ''}`.trim();
  return `<img class="r-foto ${classe}" src="${attr(c.foto)}" alt="${attr(alt)}" loading="lazy"
    data-forma="${attr(c.forma)}" data-cor="${attr(c.cor)}"${c.fotoCredito ? ` title="Foto: ${attr(c.fotoCredito)}"` : ''}>`;
}

// Legenda de atribuição exigida pelas licenças Creative Commons das fotos.
export function creditoFoto(c) {
  if (!c?.fotoCredito) return '';
  const texto = `Foto: ${attr(c.fotoCredito)}`;
  return `<div class="r-foto-credito">${
    /^https:\/\//.test(c.fotoFonte ?? '') ? `<a href="${attr(c.fotoFonte)}" target="_blank" rel="noopener">${texto}</a>` : texto
  }</div>`;
}

// Foto quebrada (URL fora do ar): troca pela ilustração do carro.
document.addEventListener(
  'error',
  (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains('r-foto')) return;
    const div = document.createElement('div');
    div.className = `${img.className} r-foto-vazia`;
    div.innerHTML = carroSvg(img.dataset.forma, img.dataset.cor);
    img.replaceWith(div);
  },
  true
);

// Busca uma foto na Wikipédia (API pública, com CORS) a partir de marca e modelo.
// Devolve { foto, fotoCredito, fotoFonte } com autor e licença vindos do Wikimedia Commons.
export async function buscarFotoWikipedia(marca, modelo) {
  const termo = `${marca} ${modelo}`.trim();
  for (const idioma of ['pt', 'en']) {
    const q = new URLSearchParams({
      action: 'query', format: 'json', origin: '*', generator: 'search', gsrsearch: termo, gsrlimit: '5',
      prop: 'pageimages', piprop: 'thumbnail|name', pithumbsize: '800',
    });
    const r = await fetch(`https://${idioma}.wikipedia.org/w/api.php?${q}`);
    const paginas = Object.values((await r.json()).query?.pages ?? {}).sort((a, b) => a.index - b.index);
    const pag = paginas.find((p) => p.thumbnail && /\.(jpe?g|png|webp)$/i.test(p.pageimage ?? ''));
    if (!pag) continue;
    const info = new URLSearchParams({
      action: 'query', format: 'json', origin: '*', titles: `File:${pag.pageimage}`, prop: 'imageinfo', iiprop: 'url|extmetadata',
    });
    const meta = Object.values((await (await fetch(`https://commons.wikimedia.org/w/api.php?${info}`)).json()).query?.pages ?? {})[0]
      ?.imageinfo?.[0];
    const limpar = (html) => new DOMParser().parseFromString(html ?? '', 'text/html').body.textContent.trim();
    const autor = limpar(meta?.extmetadata?.Artist?.value);
    const licenca = limpar(meta?.extmetadata?.LicenseShortName?.value);
    return {
      foto: pag.thumbnail.source,
      fotoCredito: [autor || 'Wikimedia Commons', licenca].filter(Boolean).join(' · '),
      fotoFonte: meta?.descriptionurl ?? `https://${idioma}.wikipedia.org/?curid=${pag.pageid}`,
    };
  }
  return null;
}

export function placaHtml(placa) {
  const p = String(placa ?? '').replace(/[&<>"']/g, '');
  return `<div class="r-placa"><div class="r-placa-topo">BRASIL</div><div class="r-placa-num">${p}</div></div>`;
}
