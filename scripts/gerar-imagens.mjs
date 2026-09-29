/**
 * Gera o ícone do app, os ícones do Android, a splash screen e o favicon a partir de um único
 * desenho em SVG. Para mudar as imagens: altere CORES ou a função `desenhoCaixa` e rode
 *   npm run gerar-imagens
 */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PASTA_ASSETS = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const CORES = {
  gradienteInicio: '#3A8763',
  gradienteFim: '#5D9C7B',
  escuroInicio: '#1C2A23',
  escuroFim: '#0E1411',
  scanner: '#F2E6BF',
  fita: '#E3BD62',
  codigo: '#2F6B4F',
  faceTopo: '#FFFFFF',
  faceEsquerda: '#EEF4F0',
  faceDireita: '#CFE0D6',
};

/** Caixa isométrica com código de barras, fita e as marcações do scanner. Espaço de 1024x1024. */
function desenhoCaixa({ mono = false } = {}) {
  const c = (cor, opacidadeMono = 1) =>
    mono ? `fill="#FFFFFF" fill-opacity="${opacidadeMono}"` : `fill="${cor}"`;

  // Barras do código (posição e largura em 0..1 dentro da face esquerda)
  const barras = [
    [0.14, 0.05], [0.22, 0.025], [0.27, 0.07], [0.37, 0.025], [0.42, 0.04],
    [0.5, 0.07], [0.6, 0.025], [0.65, 0.05], [0.73, 0.025], [0.78, 0.07],
  ]
    .map(([u, w]) => `<rect x="${u}" y="0.24" width="${w}" height="0.5" ${c(CORES.codigo, 0.35)}/>`)
    .join('');

  const cantoScanner = (x, y, dx, dy) =>
    `<path d="M ${x} ${y + dy * 120} L ${x} ${y} L ${x + dx * 120} ${y}" fill="none"
       stroke="${mono ? '#FFFFFF' : CORES.scanner}" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>`;

  return `
    ${mono ? '' : '<ellipse cx="512" cy="800" rx="210" ry="34" fill="#000" fill-opacity="0.18" filter="url(#desfoque)"/>'}
    <!-- face esquerda + código de barras -->
    <polygon points="282,382 512,502 512,772 282,652" ${c(CORES.faceEsquerda, 0.8)}/>
    <g transform="matrix(230,120,0,270,282,382)">${barras}</g>
    <!-- face direita + fita descendo pela lateral -->
    <polygon points="512,502 742,382 742,652 512,772" ${c(CORES.faceDireita, 0.55)}/>
    <g transform="matrix(230,-120,0,270,512,502)">
      <rect x="0.4" y="0" width="0.2" height="1" ${c(CORES.fita, 0.3)} opacity="${mono ? 1 : 0.75}"/>
    </g>
    <!-- topo + fita -->
    <polygon points="512,262 742,382 512,502 282,382" ${c(CORES.faceTopo, 1)}/>
    <g transform="matrix(230,-120,230,120,282,382)">
      <rect x="0.4" y="0" width="0.2" height="1" ${c(CORES.fita, 0.45)}/>
    </g>
    <!-- marcações do scanner -->
    ${cantoScanner(190, 190, 1, 1)}
    ${cantoScanner(834, 190, -1, 1)}
    ${cantoScanner(190, 834, 1, -1)}
    ${cantoScanner(834, 834, -1, -1)}
  `;
}

/**
 * fundo: 'gradiente' | 'escuro' | 'transparente'
 * escala: tamanho do desenho (1 = ocupa ~63% do ícone)
 * arredondado: cantos arredondados (splash e favicon; o iOS/Android arredondam o ícone sozinhos)
 */
function montarSvg({ fundo = 'gradiente', escala = 1, arredondado = false, mono = false } = {}) {
  const raio = arredondado ? 230 : 0;
  const fundoSvg =
    fundo === 'transparente'
      ? ''
      : `<rect width="1024" height="1024" rx="${raio}" fill="url(#${fundo})"/>
         ${fundo === 'gradiente' ? `<rect width="1024" height="1024" rx="${raio}" fill="url(#brilho)"/>` : ''}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="gradiente" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${CORES.gradienteInicio}"/>
        <stop offset="1" stop-color="${CORES.gradienteFim}"/>
      </linearGradient>
      <linearGradient id="escuro" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${CORES.escuroInicio}"/>
        <stop offset="1" stop-color="${CORES.escuroFim}"/>
      </linearGradient>
      <radialGradient id="brilho" cx="0.2" cy="0.1" r="0.8">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/>
        <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
      </radialGradient>
      <filter id="desfoque" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="14"/>
      </filter>
    </defs>
    ${fundoSvg}
    <g transform="translate(512 512) scale(${escala}) translate(-512 -512)">
      ${desenhoCaixa({ mono })}
    </g>
  </svg>`;
}

function salvar(arquivo, svg, tamanho) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: tamanho } }).render().asPng();
  const destino = join(PASTA_ASSETS, arquivo);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, png);
  console.log(`✔ ${arquivo} (${tamanho}x${tamanho})`);
}

// iOS: 1024x1024 sem transparência (o sistema arredonda os cantos)
salvar('icon.png', montarSvg({ fundo: 'gradiente' }), 1024);
// iOS 18+: variante para o modo escuro da tela inicial do iPhone
salvar('icon-escuro.png', montarSvg({ fundo: 'escuro' }), 1024);

// Android: ícone adaptativo (desenho menor para caber na "zona segura" de qualquer formato)
salvar('android-icon-foreground.png', montarSvg({ fundo: 'transparente', escala: 0.7 }), 512);
salvar('android-icon-background.png', montarSvg({ fundo: 'gradiente', escala: 0 }), 512);
salvar('android-icon-monochrome.png', montarSvg({ fundo: 'transparente', escala: 0.7, mono: true }), 432);

// Splash screen: ícone arredondado sobre fundo transparente (a cor de fundo vem do app.json)
salvar('splash-icon.png', montarSvg({ fundo: 'gradiente', arredondado: true }), 1024);

// Web
salvar('favicon.png', montarSvg({ fundo: 'gradiente', arredondado: true }), 48);
