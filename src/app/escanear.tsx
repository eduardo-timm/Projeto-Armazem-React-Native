import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buscarPorCodigo } from '../banco/banco';
import { CameraSegura, type ControleCamera, type EstadoCamera } from '../componentes/CameraSegura';
import { Botao, type NomeIcone } from '../componentes/ui';
import { useSessaoAtiva } from '../sessao';
import { espaco, fonte, linha, raio, useEstilos, useTema, type Tema } from '../tema';
import { mostrarErro } from '../utilitarios/erros';

export default function TelaEscanear() {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const { db } = useSessaoAtiva();
  const margens = useSafeAreaInsets();
  const [permissao, pedirPermissao] = useCameraPermissions();
  const cameraRef = useRef<ControleCamera>(null);
  const leituraTravada = useRef(false);
  const [lanterna, setLanterna] = useState(false);
  const [estadoCamera, setEstadoCamera] = useState<EstadoCamera>('iniciando');
  const [codigoDigitado, setCodigoDigitado] = useState('');

  // Destrava a leitura toda vez que voltamos para esta tela.
  useFocusEffect(
    useCallback(() => {
      leituraTravada.current = false;
      return () => setLanterna(false);
    }, [])
  );

  /** Produto já existe → abre os detalhes. Não existe → abre o cadastro com o código preenchido. */
  const abrirCodigo = useCallback(
    async (bruto: string) => {
      const codigo = bruto.trim();
      if (!codigo) return;
      try {
        const produto = await buscarPorCodigo(db, codigo);
        if (produto) {
          router.push({ pathname: '/produtos/[id]', params: { id: produto.id } });
        } else {
          router.push({ pathname: '/formulario-produto', params: { codigo } });
        }
      } catch (e) {
        mostrarErro(e);
        // Libera o scanner para tentar de novo depois do aviso.
        leituraTravada.current = false;
      }
    },
    [db]
  );

  const aoLerCodigo = useCallback(
    ({ data }: BarcodeScanningResult) => {
      // O scanner dispara várias vezes por segundo; a trava evita abrir várias telas.
      if (leituraTravada.current || !data) return;
      leituraTravada.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      abrirCodigo(data);
    },
    [abrirCodigo]
  );

  const painelManual = (
    <View style={[estilos.painel, { paddingBottom: margens.bottom + espaco(4) }]}>
      <Text style={estilos.tituloPainel}>Não consegue escanear?</Text>
      <View style={estilos.linhaManual}>
        <View style={estilos.caixaManual}>
          <Ionicons name="keypad-outline" size={18} color={cores.textoSuave} />
          <TextInput
            value={codigoDigitado}
            onChangeText={setCodigoDigitado}
            placeholder="Digite o código de barras"
            placeholderTextColor={cores.textoSuave}
            selectionColor={cores.primaria}
            keyboardType="number-pad"
            returnKeyType="search"
            onSubmitEditing={() => abrirCodigo(codigoDigitado)}
            style={estilos.campoManual}
          />
        </View>
        <Pressable
          style={({ pressed }) => [
            estilos.botaoIr,
            pressed && { backgroundColor: cores.primariaPressionada },
            !codigoDigitado.trim() && { opacity: 0.45 },
          ]}
          disabled={!codigoDigitado.trim()}
          onPress={() => abrirCodigo(codigoDigitado)}>
          <Ionicons name="arrow-forward" size={22} color={cores.textoSobrePrimaria} />
        </Pressable>
      </View>
      <Botao
        titulo="Cadastrar produto manualmente"
        icone="create-outline"
        variante="secundario"
        aoPressionar={() => router.push('/formulario-produto')}
      />
    </View>
  );

  // Permissão ainda carregando
  if (!permissao) {
    return (
      <View style={[estilos.tela, estilos.centro]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  // Permissão negada ou ainda não pedida
  if (!permissao.granted) {
    return (
      <KeyboardAvoidingView
        style={estilos.tela}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar style="light" />
        <View style={{ paddingTop: margens.top + 8, paddingHorizontal: espaco(4) }}>
          <BotaoTopo icone="close" aoPressionar={() => router.back()} />
        </View>
        <View style={estilos.permissao}>
          <View style={estilos.iconePermissao}>
            <Ionicons name="camera-outline" size={36} color="#fff" />
          </View>
          <Text style={estilos.tituloPermissao}>Acesso à câmera</Text>
          <Text style={estilos.textoPermissao}>
            Precisamos da câmera para ler os códigos de barras dos seus produtos.
          </Text>
          {permissao.canAskAgain ? (
            <Botao titulo="Permitir câmera" icone="checkmark" aoPressionar={pedirPermissao} estilo={{ alignSelf: 'stretch' }} />
          ) : (
            <Botao
              titulo="Abrir configurações"
              icone="settings-outline"
              aoPressionar={() => Linking.openSettings()}
              estilo={{ alignSelf: 'stretch' }}
            />
          )}
        </View>
        {painelManual}
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={estilos.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <CameraSegura
          ref={cameraRef}
          lanterna={lanterna}
          aoLerCodigo={aoLerCodigo}
          aoMudarEstado={setEstadoCamera}
        />

        {/* Sobreposições são irmãs da câmera, nunca filhas (evita problemas de prévia no iOS). */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={[estilos.barraTopo, { paddingTop: margens.top + 8 }]} pointerEvents="box-none">
            <BotaoTopo icone="close" aoPressionar={() => router.back()} />
            <Text style={estilos.tituloTopo}>Escanear código</Text>
            <BotaoTopo
              icone={lanterna ? 'flash' : 'flash-off'}
              aoPressionar={() => setLanterna((l) => !l)}
              ativo={lanterna}
            />
          </View>

          <View style={estilos.areaMoldura} pointerEvents="none">
            <View style={estilos.moldura}>
              <Canto estilo={{ top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: raio.grande }} />
              <Canto estilo={{ top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: raio.grande }} />
              <Canto estilo={{ bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: raio.grande }} />
              <Canto estilo={{ bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: raio.grande }} />
              <View style={estilos.linhaMira} />
            </View>
            <Text style={estilos.dica}>Aponte para o código de barras</Text>
          </View>

          {estadoCamera === 'falhou' ? (
            <View style={estilos.caixaFalha}>
              <View style={estilos.linhaFalha}>
                <Ionicons name="alert-circle" size={20} color="#fff" />
                <Text style={estilos.textoFalha}>Não foi possível iniciar a câmera.</Text>
              </View>
              <Botao
                titulo="Tentar de novo"
                icone="refresh"
                variante="secundario"
                aoPressionar={() => cameraRef.current?.reiniciar()}
                estilo={{ borderColor: '#fff' }}
              />
            </View>
          ) : (
            <Pressable style={estilos.pilulaReiniciar} onPress={() => cameraRef.current?.reiniciar()}>
              <Ionicons name="refresh" size={15} color="#fff" />
              <Text style={estilos.textoReiniciar}>Câmera preta? Toque para reiniciar</Text>
            </Pressable>
          )}
        </View>
      </View>
      {painelManual}
    </KeyboardAvoidingView>
  );
}

function BotaoTopo({
  icone,
  aoPressionar,
  ativo,
}: {
  icone: NomeIcone;
  aoPressionar: () => void;
  ativo?: boolean;
}) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable
      onPress={aoPressionar}
      hitSlop={8}
      style={[estilos.botaoTopo, ativo && { backgroundColor: cores.primaria, borderColor: cores.primaria }]}>
      <Ionicons name={icone} size={21} color="#fff" />
    </Pressable>
  );
}

function Canto({ estilo }: { estilo: ViewStyle }) {
  const estilos = useEstilos(criarEstilos);
  return <View style={[estilos.canto, estilo]} />;
}

const LARGURA_MOLDURA = 280;
const ALTURA_MOLDURA = 170;

// A tela do scanner é sempre escura (exceção às cores do tema, ver CLAUDE.md).
const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#000' },
  centro: { alignItems: 'center', justifyContent: 'center' },
  barraTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espaco(4),
  },
  tituloTopo: { color: '#fff', fontSize: 17, fontFamily: fonte.forte },
  botaoTopo: {
    width: 44,
    height: 44,
    borderRadius: raio.medio,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaMoldura: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco(5) },
  moldura: { width: LARGURA_MOLDURA, height: ALTURA_MOLDURA, justifyContent: 'center' },
  canto: { position: 'absolute', width: 40, height: 40, borderColor: cores.destaque },
  linhaMira: { height: linha.forte, marginHorizontal: espaco(4), backgroundColor: cores.destaque },
  dica: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonte.media,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: raio.pilula,
    overflow: 'hidden',
  },
  pilulaReiniciar: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: raio.pilula,
    marginLeft: espaco(4),
    marginBottom: espaco(4) + raio.grande,
  },
  textoReiniciar: { color: '#fff', fontSize: 13, fontFamily: fonte.normal },
  caixaFalha: {
    marginHorizontal: espaco(4),
    marginBottom: espaco(4) + raio.grande,
    padding: espaco(4),
    gap: espaco(3),
    borderRadius: raio.grande,
    backgroundColor: 'rgba(174,24,0,0.92)',
  },
  linhaFalha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textoFalha: { color: '#fff', fontFamily: fonte.forte },
  painel: {
    backgroundColor: cores.fundo,
    borderTopLeftRadius: raio.grande,
    borderTopRightRadius: raio.grande,
    borderTopWidth: linha.forte,
    borderTopColor: cores.primaria,
    marginTop: -raio.grande,
    padding: espaco(4),
    paddingTop: espaco(4.5),
    gap: espaco(3),
  },
  tituloPainel: { fontSize: 17, fontFamily: fonte.forte, color: cores.texto },
  linhaManual: { flexDirection: 'row', gap: espaco(2) },
  caixaManual: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: cores.superficie,
    borderRadius: raio.medio,
    borderWidth: 1.5,
    borderColor: cores.divisor,
    paddingHorizontal: espaco(3),
    height: 52,
  },
  campoManual: { flex: 1, fontSize: 16, fontFamily: fonte.normal, color: cores.texto },
  botaoIr: {
    width: 52,
    height: 52,
    borderRadius: raio.medio,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissao: { flex: 1, justifyContent: 'center', padding: espaco(6), gap: espaco(4) },
  iconePermissao: {
    width: 72,
    height: 72,
    borderRadius: raio.grande,
    backgroundColor: cores.primariaEscura,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloPermissao: { color: '#fff', fontSize: 28, fontFamily: fonte.forte, letterSpacing: -0.6 },
  textoPermissao: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontFamily: fonte.normal,
    lineHeight: 22,
  },
});
