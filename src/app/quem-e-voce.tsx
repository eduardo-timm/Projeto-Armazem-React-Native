import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../componentes/Avatar';
import { Rotulo } from '../componentes/ui';
import { USUARIOS_EQUIPE, useSessao } from '../sessao';
import { espaco, fonte, linha, useEstilos, useTema, type Tema } from '../tema';
import { alertar } from '../utilitarios/alerta';

/** Escolha rápida de quem está usando o app (sem senha). Fica registrado no histórico. */
export default function TelaQuemEVoce() {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const { escolherUsuario, sair } = useSessao();

  function confirmarSaida() {
    alertar(
      'Sair deste celular?',
      'Vai ser preciso digitar o código da equipe de novo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: sair },
      ]
    );
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <View style={estilos.topo}>
          <Rotulo estilo={{ color: cores.primariaForte }}>Equipe</Rotulo>
          <Text style={estilos.titulo}>Quem é você?</Text>
          <Text style={estilos.subtitulo}>
            Assim o histórico mostra quem fez cada entrada e saída.
          </Text>
        </View>

        <View style={estilos.lista}>
          {USUARIOS_EQUIPE.map((nome, i) => (
            <Pressable
              key={nome}
              onPress={() => {
                Haptics.selectionAsync();
                escolherUsuario(nome);
              }}
              style={({ pressed }) => [estilos.opcao, pressed && { backgroundColor: cores.superficie }]}>
              <Text style={estilos.numero}>{String(i + 1).padStart(2, '0')}</Text>
              <Avatar nome={nome} tamanho={56} />
              <Text style={estilos.nome}>{nome}</Text>
              <Ionicons name="arrow-forward" size={22} color={cores.texto} />
            </Pressable>
          ))}
        </View>

        <View style={{ flex: 1 }} />
        <Pressable onPress={confirmarSaida} style={estilos.sair} hitSlop={8}>
          <Ionicons name="log-out-outline" size={18} color={cores.primariaForte} />
          <Text style={estilos.textoSair}>Usar outro código / sair deste celular</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { flexGrow: 1 },
  topo: { padding: espaco(6), paddingTop: espaco(10), gap: espaco(3) },
  titulo: { fontSize: 46, lineHeight: 48, fontFamily: fonte.forte, color: cores.texto, letterSpacing: -1.6 },
  subtitulo: { fontSize: 15, fontFamily: fonte.normal, color: cores.textoSuave, lineHeight: 21 },
  lista: { borderTopWidth: linha.forte, borderTopColor: cores.divisor },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco(3),
    paddingHorizontal: espaco(6),
    paddingVertical: espaco(4),
    borderBottomWidth: linha.fina,
    borderBottomColor: cores.borda,
  },
  numero: { width: 22, fontSize: 12, fontFamily: fonte.media, color: cores.textoSuave },
  nome: { flex: 1, fontSize: 22, fontFamily: fonte.forte, color: cores.texto },
  sair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: espaco(6),
    marginTop: espaco(8),
    marginBottom: espaco(6),
  },
  textoSair: { fontSize: 14, fontFamily: fonte.forte, color: cores.primariaForte },
});
