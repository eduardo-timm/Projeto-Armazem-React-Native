import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../componentes/Avatar';
import { Botao } from '../componentes/ui';
import { usePerfis } from '../perfis';
import { useSessaoAtiva } from '../sessao';
import { espaco, useEstilos, type Tema } from '../tema';
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
      <View style={estilos.topo}>
        <Avatar nome={usuario} tamanho={160} />
        <Text style={estilos.nome}>{usuario}</Text>
        <Text style={estilos.dica}>
          Sua foto aparece para toda a equipe, no início e no histórico de entradas e saídas.
        </Text>
      </View>

      <View style={{ gap: espaco(3) }}>
        <Botao
          titulo="Tirar foto"
          icone="camera"
          aoPressionar={() => executar('camera')}
          carregando={emAndamento === 'camera'}
          desabilitado={ocupado}
        />
        <Botao
          titulo="Escolher da galeria"
          icone="images"
          variante="secundario"
          aoPressionar={() => executar('galeria')}
          carregando={emAndamento === 'galeria'}
          desabilitado={ocupado}
        />
        {temFoto && (
          <Botao
            titulo="Remover foto"
            icone="trash-outline"
            variante="perigo"
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
  conteudo: { padding: espaco(6), gap: espaco(8) },
  topo: { alignItems: 'center', gap: espaco(2), marginTop: espaco(4) },
  nome: { fontSize: 26, fontWeight: '800', color: cores.texto, marginTop: espaco(2) },
  dica: { fontSize: 14, color: cores.textoSuave, textAlign: 'center', lineHeight: 20 },
});
