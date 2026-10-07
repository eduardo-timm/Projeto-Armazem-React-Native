import { Image } from 'expo-image';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fonteDaFoto } from '../banco/supabase';
import { usePerfis } from '../perfis';
import { useSessao, type Usuario } from '../sessao';
import { fonte } from '../tema';

/** Tons do próprio sistema (tinta, vermelho e cinzas) em vez de cores soltas. */
export const CORES_USUARIO: Record<Usuario, string> = {
  Eduardo: '#2D2B2B',
  Tomás: '#DD2B0F',
  Tiago: '#7D7979',
  Teste: '#9B9797',
};

/**
 * Quadrado com cantos suaves e a foto de perfil da pessoa. Sem foto (ou enquanto ela carrega),
 * mostra a inicial no canto de baixo, sobre a cor da pessoa.
 */
export function Avatar({ nome, tamanho = 40 }: { nome: Usuario; tamanho?: number }) {
  const { acesso } = useSessao();
  const { fotoDe } = usePerfis();
  const foto = fotoDe(nome);
  const fonteFoto = useMemo(
    () => (foto && acesso ? fonteDaFoto(acesso, foto) : null),
    [acesso, foto]
  );

  return (
    <View
      style={[
        estilos.quadrado,
        {
          width: tamanho,
          height: tamanho,
          borderRadius: Math.round(tamanho * 0.22),
          padding: Math.round(tamanho * 0.12),
          backgroundColor: CORES_USUARIO[nome],
        },
      ]}>
      <Text style={[estilos.inicial, { fontSize: tamanho * 0.44, lineHeight: tamanho * 0.48 }]}>
        {nome.charAt(0)}
      </Text>
      {fonteFoto && (
        <Image
          source={fonteFoto}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          recyclingKey={foto}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  quadrado: { alignItems: 'flex-start', justifyContent: 'flex-end', overflow: 'hidden' },
  inicial: { color: '#fff', fontFamily: fonte.forte },
});
