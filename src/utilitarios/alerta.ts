import { Alert, type AlertButton } from 'react-native';

/**
 * Mesmo uso do `Alert.alert`. Use sempre este em vez do Alert direto:
 * na web o Alert do React Native não aparece, e `alerta.web.ts` troca por alert/confirm do navegador.
 */
export function alertar(titulo: string, mensagem?: string, botoes?: AlertButton[]) {
  Alert.alert(titulo, mensagem, botoes);
}
