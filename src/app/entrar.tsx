import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Botao, Campo } from '../componentes/ui';
import { useSessao } from '../sessao';
import { espaco, raio, useEstilos, useTema, type Tema } from '../tema';

const logo = require('../../assets/splash-icon.png');

/** Só números, no formato 0000-0000 (o traço entra sozinho). */
function formatarCodigo(texto: string) {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  return digitos.length > 4 ? `${digitos.slice(0, 4)}-${digitos.slice(4)}` : digitos;
}

/** Primeira tela no celular: código da equipe (uma vez só) ou modo teste para apresentações. */
export default function TelaEntrar() {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const { entrarComCodigo, entrarComoTeste } = useSessao();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | undefined>();
  const [entrando, setEntrando] = useState(false);

  async function entrar() {
    if (!codigo.trim()) {
      setErro('Digite o código da equipe');
      return;
    }
    setEntrando(true);
    setErro(undefined);
    try {
      await entrarComCodigo(codigo);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErro(e instanceof Error ? e.message : String(e));
      setEntrando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <View style={estilos.topo}>
            <Image source={logo} style={estilos.logo} />
            <Text style={estilos.titulo}>Armazém</Text>
            <Text style={estilos.subtitulo}>Controle de stock da equipe</Text>
          </View>

          <View style={estilos.cartao}>
            <Text style={estilos.tituloCartao}>Entrar com o código da equipe</Text>
            <Text style={estilos.texto}>
              Você só precisa digitar isso uma vez neste celular.
            </Text>
            <Campo
              rotulo="Código da equipe"
              icone="key-outline"
              value={codigo}
              onChangeText={(t) => {
                setCodigo(formatarCodigo(t));
                setErro(undefined);
              }}
              placeholder="0000-0000"
              keyboardType="number-pad"
              maxLength={9}
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={entrar}
              erro={erro}
            />
            <Botao titulo="Entrar" icone="log-in-outline" aoPressionar={entrar} carregando={entrando} />
          </View>

          <View style={estilos.divisor}>
            <View style={estilos.linha} />
            <Text style={estilos.textoDivisor}>ou</Text>
            <View style={estilos.linha} />
          </View>

          <Botao
            titulo="Entrar no modo Teste"
            icone="school-outline"
            variante="secundario"
            aoPressionar={entrarComoTeste}
          />
          <View style={estilos.dica}>
            <Ionicons name="information-circle-outline" size={16} color={cores.textoSuave} />
            <Text style={estilos.textoDica}>
              Para apresentações: usa um stock separado, sem mexer no stock real da equipe.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const criarEstilos = ({ cores, sombra }: Tema) => StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { flexGrow: 1, justifyContent: 'center', padding: espaco(6), gap: espaco(4) },
  topo: { alignItems: 'center', gap: 4, marginBottom: espaco(2) },
  logo: { width: 96, height: 96, marginBottom: espaco(2) },
  titulo: { fontSize: 32, fontWeight: '800', color: cores.texto, letterSpacing: -1 },
  subtitulo: { fontSize: 15, color: cores.textoSuave },
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.grande,
    padding: espaco(5),
    gap: espaco(3),
    ...sombra,
  },
  tituloCartao: { fontSize: 17, fontWeight: '800', color: cores.texto },
  texto: { fontSize: 14, color: cores.textoSuave, marginTop: -6 },
  divisor: { flexDirection: 'row', alignItems: 'center', gap: espaco(3) },
  linha: { flex: 1, height: 1, backgroundColor: cores.borda },
  textoDivisor: { color: cores.textoSuave, fontSize: 13 },
  dica: { flexDirection: 'row', gap: 6, paddingHorizontal: espaco(1) },
  textoDica: { flex: 1, fontSize: 13, color: cores.textoSuave, lineHeight: 18 },
});
