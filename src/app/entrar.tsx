import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Botao, Campo } from '../componentes/ui';
import { useSessao } from '../sessao';
import { espaco, fonte, linha, raio, useEstilos, useTema, type Tema } from '../tema';

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
            <View style={estilos.marca}>
              <Text style={estilos.letraMarca}>A</Text>
            </View>
            <View>
              <Text style={estilos.titulo}>Armazém</Text>
              <Text style={estilos.subtitulo}>Controle de stock da equipe</Text>
            </View>
          </View>

          <View style={estilos.secao}>
            <View style={estilos.cabecalhoSecao}>
              <Text style={estilos.numero}>01</Text>
              <Text style={estilos.tituloSecao}>Entrar com o código da equipe</Text>
            </View>
            <Text style={estilos.texto}>Você só precisa digitar isso uma vez neste celular.</Text>
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
              style={estilos.campoCodigo}
            />
            <Botao titulo="Entrar" icone="arrow-forward" aoPressionar={entrar} carregando={entrando} />
          </View>

          <View style={estilos.secao}>
            <View style={estilos.cabecalhoSecao}>
              <Text style={estilos.numero}>02</Text>
              <Text style={estilos.tituloSecao}>Ou use o modo Teste</Text>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { flexGrow: 1, paddingBottom: espaco(6) },
  topo: { padding: espaco(6), paddingTop: espaco(8), gap: espaco(5) },
  marca: {
    width: 56,
    height: 56,
    borderRadius: raio.medio,
    backgroundColor: cores.primariaEscura,
    justifyContent: 'flex-end',
    padding: 7,
  },
  letraMarca: { fontSize: 30, lineHeight: 32, fontFamily: fonte.forte, color: cores.textoSobrePrimaria },
  titulo: { fontSize: 58, lineHeight: 58, fontFamily: fonte.forte, color: cores.texto, letterSpacing: -2.6 },
  subtitulo: { fontSize: 16, fontFamily: fonte.normal, color: cores.textoSuave, marginTop: espaco(3) },
  secao: {
    borderTopWidth: linha.forte,
    borderTopColor: cores.divisor,
    padding: espaco(6),
    gap: espaco(3.5),
  },
  cabecalhoSecao: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  numero: { fontSize: 12, fontFamily: fonte.media, color: cores.primariaForte },
  tituloSecao: { flex: 1, fontSize: 20, fontFamily: fonte.forte, color: cores.texto },
  texto: { fontSize: 14, fontFamily: fonte.normal, color: cores.textoSuave },
  campoCodigo: { fontSize: 24, fontFamily: fonte.forte, letterSpacing: 3 },
  dica: { flexDirection: 'row', gap: 8 },
  textoDica: { flex: 1, fontSize: 13, fontFamily: fonte.normal, color: cores.textoSuave, lineHeight: 18 },
});
