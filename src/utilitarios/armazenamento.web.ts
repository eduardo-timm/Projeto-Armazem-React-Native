/** Versão web de `armazenamento.ts`: mesmas funções síncronas, guardadas no localStorage. */
export const Armazenamento = {
  getItemSync(chave: string): string | null {
    return window.localStorage.getItem(chave);
  },
  setItemSync(chave: string, valor: string) {
    window.localStorage.setItem(chave, valor);
  },
  removeItemSync(chave: string) {
    window.localStorage.removeItem(chave);
  },
};
