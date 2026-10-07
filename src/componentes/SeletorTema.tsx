import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { espaco, fonte, raio, useEstilos, useTema, type PreferenciaTema, type Tema } from '../tema';
import type { NomeIcone } from './ui';

const OPCOES: { valor: PreferenciaTema; rotulo: string; icone: NomeIcone }[] = [
  { valor: 'sistema', rotulo: 'Sistema', icone: 'phone-portrait-outline' },
  { valor: 'claro', rotulo: 'Claro', icone: 'sunny-outline' },
  { valor: 'escuro', rotulo: 'Escuro', icone: 'moon-outline' },
];

/** Controle segmentado (Sistema / Claro / Escuro): a opção escolhida fica vermelha. */
export function SeletorTema() {
  const { cores, preferencia, definirPreferencia } = useTema();
  const estilos = useEstilos(criarEstilos);

  return (
    <View style={estilos.grupo}>
      {OPCOES.map((opcao, i) => {
        const selecionada = preferencia === opcao.valor;
        const frente = selecionada ? cores.textoSobrePrimaria : cores.texto;
        return (
          <Pressable
            key={opcao.valor}
            onPress={() => {
              Haptics.selectionAsync();
              definirPreferencia(opcao.valor);
            }}
            style={({ pressed }) => [
              estilos.opcao,
              i > 0 && estilos.separador,
              selecionada && { backgroundColor: cores.primaria },
              pressed && !selecionada && { backgroundColor: cores.superficie },
            ]}>
            <Ionicons name={opcao.icone} size={16} color={frente} />
            <Text style={[estilos.rotulo, { color: frente }]}>{opcao.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Botão quadrado que alterna rapidamente entre claro e escuro. */
export function BotaoAlternarTema() {
  const { cores, esquema, alternarEsquema } = useTema();
  const estilos = useEstilos(criarEstilos);

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        alternarEsquema();
      }}
      hitSlop={8}
      accessibilityLabel={esquema === 'escuro' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      style={({ pressed }) => [estilos.botaoAlternar, pressed && { backgroundColor: cores.superficie }]}>
      <Ionicons name={esquema === 'escuro' ? 'sunny-outline' : 'moon-outline'} size={20} color={cores.texto} />
    </Pressable>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  grupo: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: cores.divisor,
    borderRadius: raio.medio,
    overflow: 'hidden',
  },
  opcao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 46,
    paddingHorizontal: espaco(3),
  },
  separador: { borderLeftWidth: 1.5, borderLeftColor: cores.divisor },
  rotulo: { fontSize: 14, fontFamily: fonte.media },
  botaoAlternar: {
    width: 44,
    height: 44,
    borderRadius: raio.medio,
    borderWidth: 1.5,
    borderColor: cores.divisor,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
