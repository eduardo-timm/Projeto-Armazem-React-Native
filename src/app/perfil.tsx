import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../componentes/Avatar';
import { Botao } from '../componentes/ui';
import { usePerfis } from '../perfis';
import { useSessaoAtiva } from '../sessao';
import { espaco, fonte, linha, useEstilos, type Tema } from '../tema';
import { mostrarErro } from '../utilitarios/erros';
import { escolherFoto, type OrigemFoto } from '../utilitarios/fotos';

type Acao = OrigemFoto | 'remover';

/** Foto de perfil de quem está usando: tirar com a câmera, escolher da galeria ou remover. */
export default function TelaPerfil() {
  const estilos = useEstilos(criarEstilos);
  const { usuario } = useSessaoAtiva();
  const { fotoDe, trocarFoto } = usePerfis();
  const temFoto = !!fotoDe(usuario);
  const [emAndamento, setEmAndamento] = useState<Acao | null>(null);

  async function executar(acao: Acao) {
    setEmAndamento(acao);
    try {
      if (acao === 'remover') {
        await trocarFoto(usuario, null);
      } else {
        const nova = await escolherFoto(acao);
        if (!nova) return;
        await trocarFoto(usuario, nova);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      mostrarErro(e, 'Não foi possível trocar a foto');
    } finally {
      setEmAndamento(null);
    }
  }

  const ocupado = emAndamento !== null;

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      <View style={estilos.regua} />
      <View style={estilos.topo}>
        <Avatar nome={usuario} tamanho={180} />
        <Text style={estilos.nome}>{usuario}</Text>
        <Text style={estilos.dica}>
          Sua foto aparece para toda a equipe, no início e no histórico de entradas e saídas.
        </Text>
      </View>

      <View style={estilos.acoes}>
        <Botao
          titulo="Tirar foto"
          icone="camera-outline"
          aoPressionar={() => executar('camera')}
          carregando={emAndamento === 'camera'}
          desabilitado={ocupado}
        />
        <Botao
          titulo="Escolher da galeria"
          icone="images-outline"
          variante="secundario"
          aoPressionar={() => executar('galeria')}
          carregando={emAndamento === 'galeria'}
          desabilitado={ocupado}
        />
        {temFoto && (
          <Botao
            titulo="Remover foto"
            icone="trash-outline"
            variante="fantasma"
            aoPressionar={() => executar('remover')}
            carregando={emAndamento === 'remover'}
            desabilitado={ocupado}
          />
        )}
      </View>
    </ScrollView>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  conteudo: { paddingBottom: espaco(10) },
  regua: { height: linha.forte, backgroundColor: cores.divisor },
  topo: { padding: espaco(5), paddingTop: espaco(7), gap: espaco(3) },
  nome: { fontSize: 34, fontFamily: fonte.forte, color: cores.texto, letterSpacing: -1, marginTop: espaco(2) },
  dica: { fontSize: 14, fontFamily: fonte.normal, color: cores.textoSuave, lineHeight: 20 },
  acoes: {
    borderTopWidth: linha.forte,
    borderTopColor: cores.divisor,
    padding: espaco(5),
    gap: espaco(2),
  },
});
