/**
 * Guarda preferências no aparelho (tema e sessão).
 * No celular usa o kv-store do expo-sqlite; na web, `armazenamento.web.ts` usa o localStorage
 * (o SQLite da web precisa de WASM e cabeçalhos especiais no servidor).
 */
export { default as Armazenamento } from 'expo-sqlite/kv-store';
