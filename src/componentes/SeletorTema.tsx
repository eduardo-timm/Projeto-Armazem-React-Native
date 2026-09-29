import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { espaco, raio, useEstilos, useTema, type PreferenciaTema, type Tema } from '../tema';
import type { NomeIcone } from './ui';

const OPCOES: { valor: PreferenciaTema; rotulo: string; icone: NomeIcone }[] = [
  { valor: 'sistema', rotulo: 'Sistema', icone: 'phone-portrait-outline' },
  { valor: 'claro', rotulo: 'Claro', icone: 'sunny-outline' },
  { valor: 'escuro', rotulo: 'Escuro', icone: 'moon-outline' },
];

/** Controle segmentado para escolher o tema: Sistema / Claro / Escuro. */
export function SeletorTema() {
  const { cores, preferencia, definirPreferencia } = useTema();
  const estilos = useEstilos(criarEstilos);

  return (
    <View style={estilos.grupo}>
      {OPCOES.map((opcao) => {
        const selecionada = preferencia === opcao.valor;
        return (
          <Pressable
            key={opcao.valor}
            onPress={() => {
              Haptics.selectionAsync();
              definirPreferencia(opcao.valor);
            }}
            style={[estilos.opcao, selecionada && estilos.opcaoSelecionada]}>
            <Ionicons
              name={opcao.icone}
              size={18}
              color={selecionada ? cores.primaria : cores.textoSuave}
            />
            <Text style={[estilos.rotulo, selecionada && { color: cores.texto }]}>
              {opcao.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Botão redondo que alterna rapidamente entre claro e escuro. */
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
      style={({ pressed }) => [estilos.botaoAlternar, pressed && { transform: [{ scale: 0.94 }] }]}>
      <Ionicons name={esquema === 'escuro' ? 'sunny' : 'moon'} size={22} color={cores.primaria} />
    </Pressable>
  );
}

const criarEstilos = ({ cores, sombra }: Tema) => StyleSheet.create({
  grupo: {
    flexDirection: 'row',
    backgroundColor: cores.superficieSuave,
    borderRadius: raio.medio,
    padding: 4,
    gap: 4,
  },
  opcao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: espaco(3),
    borderRadius: raio.medio - 4,
  },
  opcaoSelecionada: { backgroundColor: cores.superficie, ...sombra, shadowOpacity: sombra.shadowOpacity / 2 },
  rotulo: { fontSize: 14, fontWeight: '700', color: cores.textoSuave },
  botaoAlternar: {
    width: 48,
    height: 48,
    borderRadius: raio.medio,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
  },
});
