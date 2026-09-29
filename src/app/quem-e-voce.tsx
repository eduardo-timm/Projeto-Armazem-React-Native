import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../componentes/Avatar';
import { USUARIOS_EQUIPE, useSessao } from '../sessao';
import { espaco, raio, useEstilos, useTema, type Tema } from '../tema';

/** Escolha rápida de quem está usando o app (sem senha). Fica registrado no histórico. */
export default function TelaQuemEVoce() {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const { escolherUsuario, sair } = useSessao();

  function confirmarSaida() {
    Alert.alert(
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
        <Text style={estilos.titulo}>Quem é você?</Text>
        <Text style={estilos.subtitulo}>
          Assim o histórico mostra quem fez cada entrada e saída.
        </Text>

        <View style={{ gap: espaco(3), marginTop: espaco(4) }}>
          {USUARIOS_EQUIPE.map((nome) => (
            <Pressable
              key={nome}
              onPress={() => {
                Haptics.selectionAsync();
                escolherUsuario(nome);
              }}
              style={({ pressed }) => [estilos.opcao, pressed && { transform: [{ scale: 0.98 }] }]}>
              <Avatar nome={nome} tamanho={52} />
              <Text style={estilos.nome}>{nome}</Text>
              <Ionicons name="chevron-forward" size={22} color={cores.textoSuave} />
            </Pressable>
          ))}
        </View>

        <Pressable onPress={confirmarSaida} style={estilos.sair} hitSlop={8}>
          <Ionicons name="log-out-outline" size={18} color={cores.textoSuave} />
          <Text style={estilos.textoSair}>Usar outro código / sair deste celular</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const criarEstilos = ({ cores, sombra }: Tema) => StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { flexGrow: 1, justifyContent: 'center', padding: espaco(6) },
  titulo: { fontSize: 32, fontWeight: '800', color: cores.texto, letterSpacing: -1 },
  subtitulo: { fontSize: 15, color: cores.textoSuave, marginTop: 6, lineHeight: 21 },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco(4),
    backgroundColor: cores.superficie,
    borderRadius: raio.grande,
    padding: espaco(4),
    ...sombra,
  },
  nome: { flex: 1, fontSize: 20, fontWeight: '700', color: cores.texto },
  sair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: espaco(8),
  },
  textoSair: { fontSize: 14, color: cores.textoSuave },
});
