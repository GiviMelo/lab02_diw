// Ilustração dos automóveis: carrocerias, paleta de cores e placa Mercosul.

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

// Carro sobre o "chão" cinza usado nos cards, no resumo e no detalhe.
export function palco(chaveForma, cor, { largura = '90%', classe = '' } = {}) {
  return `<div class="r-palco ${classe}">
    <div style="width:${largura};margin:0 auto -2px">${carroSvg(chaveForma, cor)}</div>
    <div class="r-palco-chao"></div>
  </div>`;
}

export function placaHtml(placa) {
  const p = String(placa ?? '').replace(/[&<>"']/g, '');
  return `<div class="r-placa"><div class="r-placa-topo">BRASIL</div><div class="r-placa-num">${p}</div></div>`;
}
