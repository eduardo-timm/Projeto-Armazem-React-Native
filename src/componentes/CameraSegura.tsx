import { CameraView, type BarcodeScanningResult, type BarcodeType } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';

/**
 * Envolve o <CameraView> com correções para o bug da "câmera preta" no iPhone
 * (expo/expo#49760 — SDK 57: a luz verde da câmera acende, mas a imagem fica preta).
 *
 * O que ele faz:
 * 1. Só monta a câmera quando a tela está em foco E o app está em primeiro plano.
 *    Só pode existir UMA prévia de câmera ativa; uma câmera "esquecida" numa tela
 *    de trás da pilha é causa clássica da tela preta.
 * 2. Espera a animação de navegação terminar antes de montar (ATRASO_MONTAGEM_MS).
 *    Iniciar a sessão de captura no meio da animação também causa o bug.
 * 3. Renderiza a câmera com tamanho explícito (absoluteFill) e SEM filhos —
 *    sobreposições devem ser irmãs do <CameraView>, nunca filhas.
 * 4. Recria a view nativa (nova `key`) quando o app volta para o primeiro plano,
 *    e automaticamente se `onCameraReady` não disparar em TEMPO_LIMITE_PRONTA_MS.
 * 5. Expõe `reiniciar()` para a tela oferecer o botão "câmera preta? reiniciar",
 *    já que recriar o CameraView é a correção conhecida quando a imagem fica preta.
 */

const ATRASO_MONTAGEM_MS = 450;
const TEMPO_LIMITE_PRONTA_MS = 3500;
const MAX_TENTATIVAS_AUTOMATICAS = 2;

export const CODIGOS_SUPORTADOS: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'code93',
  'itf14',
  'codabar',
  'qr',
  'datamatrix',
];

export type EstadoCamera = 'iniciando' | 'pronta' | 'falhou';

export type ControleCamera = { reiniciar: () => void };

type Props = {
  aoLerCodigo?: (resultado: BarcodeScanningResult) => void;
  lanterna?: boolean;
  aoMudarEstado?: (estado: EstadoCamera) => void;
  ref?: Ref<ControleCamera>;
};

export function CameraSegura({ aoLerCodigo, lanterna = false, aoMudarEstado, ref }: Props) {
  const telaEmFoco = useIsFocused();
  const [appAtivo, setAppAtivo] = useState(AppState.currentState === 'active');
  const [liberadaParaMontar, setLiberadaParaMontar] = useState(false);
  const [chaveCamera, setChaveCamera] = useState(0);
  const [estado, setEstado] = useState<EstadoCamera>('iniciando');
  const tentativas = useRef(0);
  const estavaAtivo = useRef(appAtivo);
  const aoMudarEstadoRef = useRef(aoMudarEstado);

  useEffect(() => {
    aoMudarEstadoRef.current = aoMudarEstado;
  }, [aoMudarEstado]);

  const deveRodar = telaEmFoco && appAtivo;

  const mudarEstado = useCallback((novo: EstadoCamera) => {
    setEstado(novo);
    aoMudarEstadoRef.current?.(novo);
  }, []);

  const reiniciar = useCallback(() => {
    tentativas.current = 0;
    mudarEstado('iniciando');
    setChaveCamera((k) => k + 1);
  }, [mudarEstado]);

  useImperativeHandle(ref, () => ({ reiniciar }), [reiniciar]);

  // Acompanha primeiro/segundo plano. Ao voltar para o app, cria uma view nativa nova.
  useEffect(() => {
    const inscricao = AppState.addEventListener('change', (proximo) => {
      const ativo = proximo === 'active';
      if (ativo && !estavaAtivo.current) setChaveCamera((k) => k + 1);
      estavaAtivo.current = ativo;
      setAppAtivo(ativo);
    });
    return () => inscricao.remove();
  }, []);

  // Só monta depois que a transição de tela terminar (ATRASO_MONTAGEM_MS).
  // Ao perder o foco ou ir para segundo plano, desmonta e volta ao estado inicial.
  useEffect(() => {
    if (!deveRodar) return;
    const t = setTimeout(() => setLiberadaParaMontar(true), ATRASO_MONTAGEM_MS);
    return () => {
      clearTimeout(t);
      setLiberadaParaMontar(false);
      mudarEstado('iniciando');
    };
  }, [deveRodar, mudarEstado]);

  // Vigia: se a câmera nunca avisar que está pronta, recria ela.
  useEffect(() => {
    if (!liberadaParaMontar || estado !== 'iniciando') return;
    const t = setTimeout(() => {
      if (tentativas.current < MAX_TENTATIVAS_AUTOMATICAS) {
        tentativas.current += 1;
        setChaveCamera((k) => k + 1);
      } else {
        mudarEstado('falhou');
      }
    }, TEMPO_LIMITE_PRONTA_MS);
    return () => clearTimeout(t);
  }, [liberadaParaMontar, estado, chaveCamera, mudarEstado]);

  const montada = deveRodar && liberadaParaMontar;

  return (
    <View style={estilos.container}>
      {montada && (
        <CameraView
          key={chaveCamera}
          style={StyleSheet.absoluteFill}
          facing="back"
          active={montada}
          enableTorch={lanterna}
          barcodeScannerSettings={{ barcodeTypes: CODIGOS_SUPORTADOS }}
          onBarcodeScanned={aoLerCodigo}
          onCameraReady={() => {
            tentativas.current = 0;
            mudarEstado('pronta');
          }}
          onMountError={() => mudarEstado('falhou')}
        />
      )}
      {estado === 'iniciando' && (
        <View style={estilos.carregando} pointerEvents="none">
          <ActivityIndicator color="#fff" />
          <Text style={estilos.textoCarregando}>Iniciando câmera…</Text>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { ...StyleSheet.absoluteFill, backgroundColor: '#000' },
  carregando: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  textoCarregando: { color: '#fff', opacity: 0.8 },
});
