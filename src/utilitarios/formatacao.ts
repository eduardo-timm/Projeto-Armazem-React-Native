/** Formata em Real (R$ 1.234,56) sem depender de Intl, para ficar igual em qualquer aparelho. */
export function formatarMoeda(valor: number) {
  const [inteiro, decimal] = Math.abs(valor).toFixed(2).split('.');
  const comPontos = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${valor < 0 ? '-' : ''}R$ ${comPontos},${decimal}`;
}

/** Aceita "12,50", "12.50" ou "1.234,56". */
export function converterDecimal(texto: string) {
  const limpo = texto.replace(/[^\d,.-]/g, '');
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Máscara de preço ao digitar: os números entram pela direita e a vírgula fica sempre
 * antes dos dois últimos (1 → "0,01", 1250 → "12,50", 123456 → "1.234,56").
 * Apagar tudo deixa o campo vazio. O resultado é lido por `converterDecimal`.
 */
export function mascararMoeda(texto: string) {
  const digitos = texto.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11);
  if (!digitos) return '';
  const completo = digitos.padStart(3, '0');
  const inteiro = completo.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${inteiro},${completo.slice(-2)}`;
}

export function converterInteiro(texto: string) {
  const n = parseInt(texto.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

/** "22/09 às 14:30" (ou "22/09/2025 às 14:30" se for de outro ano), no fuso do celular. */
export function formatarDataHora(iso: string) {
  const data = new Date(iso);
  const dois = (n: number) => String(n).padStart(2, '0');
  const ano = data.getFullYear() !== new Date().getFullYear() ? `/${data.getFullYear()}` : '';
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)}${ano} às ${dois(data.getHours())}:${dois(data.getMinutes())}`;
}
