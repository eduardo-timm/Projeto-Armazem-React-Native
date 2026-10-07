import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { espaco, fonte, raio, useEstilos, useTema, type Tema } from '../tema';
import { mostrarErro } from '../utilitarios/erros';
import { escolherFoto, type OrigemFoto } from '../utilitarios/fotos';
import { FotoProduto } from './FotoProduto';
import type { NomeIcone } from './ui';

/**
 * Campo de foto do formulário: tirar com a câmera, escolher da galeria ou remover.
 * `foto` segue o formato de `FotoProduto` (caminho no Storage ou URI local).
 */
export function SeletorFoto({
  foto,
  aoMudar,
}: {
  foto: string | null;
  aoMudar: (foto: string | null) => void;
}) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const [preparando, setPreparando] = useState(false);

  async function escolher(origem: OrigemFoto) {
    setPreparando(true);
    try {
      const nova = await escolherFoto(origem);
      if (nova) {
        Haptics.selectionAsync();
        aoMudar(nova);
      }
    } catch (e) {
      mostrarErro(e, 'Não foi possível usar a foto');
    } finally {
      setPreparando(false);
    }
  }

  return (
    <View style={{ gap: 6 }}>
      <Text style={estilos.rotulo}>Foto do produto</Text>
      <View style={estilos.caixa}>
        <Pressable
          onPress={() => escolher('camera')}
          disabled={preparando}
          style={[estilos.previa, foto && { borderWidth: 0 }]}
          accessibilityRole="button"
          accessibilityLabel={foto ? 'Tirar outra foto' : 'Tirar foto'}>
          {foto ? (
            <FotoProduto foto={foto} estilo={StyleSheet.absoluteFill} />
          ) : (
            <Ionicons name="camera-outline" size={30} color={cores.primariaForte} />
          )}
          {preparando && (
            <View style={estilos.carregando}>
              <ActivityIndicator color={cores.primaria} />
            </View>
          )}
        </Pressable>

        <View style={estilos.acoes}>
          <Text style={estilos.dica}>
            {foto ? 'Toque na foto para tirar outra.' : 'Opcional — ajuda a reconhecer o produto.'}
          </Text>
          <View style={estilos.linhaBotoes}>
            <BotaoFoto
              icone="camera-outline"
              titulo="Câmera"
              aoPressionar={() => escolher('camera')}
              desabilitado={preparando}
            />
            <BotaoFoto
              icone="images-outline"
              titulo="Galeria"
              aoPressionar={() => escolher('galeria')}
              desabilitado={preparando}
            />
          </View>
          {foto && (
            <Pressable onPress={() => aoMudar(null)} disabled={preparando} hitSlop={8}>
              <Text style={estilos.remover}>Remover foto</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function BotaoFoto({
  icone,
  titulo,
  aoPressionar,
  desabilitado,
}: {
  icone: NomeIcone;
  titulo: string;
  aoPressionar: () => void;
  desabilitado: boolean;
}) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable
      onPress={aoPressionar}
      disabled={desabilitado}
      style={({ pressed }) => [
        estilos.botao,
        { opacity: desabilitado ? 0.45 : 1 },
        pressed && { backgroundColor: cores.superficie },
      ]}>
      <Ionicons name={icone} size={16} color={cores.texto} />
      <Text style={estilos.textoBotao}>{titulo}</Text>
    </Pressable>
  );
}

const TAMANHO_PREVIA = 104;

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  rotulo: { fontSize: 12, fontFamily: fonte.media, color: cores.textoSuave },
  caixa: { flexDirection: 'row', alignItems: 'center', gap: espaco(4) },
  previa: {
    width: TAMANHO_PREVIA,
    height: TAMANHO_PREVIA,
    borderRadius: raio.medio,
    overflow: 'hidden',
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: cores.divisor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carregando: {
    ...StyleSheet.absoluteFill,
    backgroundColor: cores.superficie,
    opacity: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acoes: { flex: 1, gap: espaco(2) },
  dica: { fontSize: 13, fontFamily: fonte.normal, color: cores.textoSuave, lineHeight: 18 },
  linhaBotoes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco(2) },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: espaco(3),
    borderRadius: raio.pequeno,
    borderWidth: 1.5,
    borderColor: cores.divisor,
  },
  textoBotao: { fontSize: 13, fontFamily: fonte.forte, color: cores.texto },
  remover: { fontSize: 13, fontFamily: fonte.media, color: cores.primariaForte },
});
