import type { AlertButton } from 'react-native';

/**
 * Versão web de `alerta.ts`. Sem ação (só "OK") → window.alert; com uma ação além do
 * "Cancelar" → window.confirm (OK executa a ação). Os alertas do app têm no máximo uma ação.
 */
export function alertar(titulo: string, mensagem?: string, botoes?: AlertButton[]) {
  const texto = mensagem ? `${titulo}\n\n${mensagem}` : titulo;
  const cancelar = botoes?.find((b) => b.style === 'cancel');
  const acao = botoes?.find((b) => b.style !== 'cancel');

  if (!cancelar) {
    window.alert(texto);
    acao?.onPress?.();
    return;
  }
  if (window.confirm(texto)) acao?.onPress?.();
  else cancelar.onPress?.();
}
