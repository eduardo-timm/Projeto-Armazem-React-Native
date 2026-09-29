import { Image } from 'expo-image';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fonteDaFoto } from '../banco/supabase';
import { usePerfis } from '../perfis';
import { useSessao, type Usuario } from '../sessao';

export const CORES_USUARIO: Record<Usuario, string> = {
  Eduardo: '#5B5BF7',
  Tomás: '#10B9A5',
  Tiago: '#F59E0B',
  Teste: '#94A3B8',
};

/**
 * Círculo com a foto de perfil da pessoa. Sem foto (ou enquanto ela carrega), mostra a
 * inicial sobre a cor da pessoa.
 */
export function Avatar({ nome, tamanho = 40 }: { nome: Usuario; tamanho?: number }) {
  const { acesso } = useSessao();
  const { fotoDe } = usePerfis();
  const foto = fotoDe(nome);
  const fonte = useMemo(
    () => (foto && acesso ? fonteDaFoto(acesso, foto) : null),
    [acesso, foto]
  );

  return (
    <View
      style={[
        estilos.circulo,
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          backgroundColor: CORES_USUARIO[nome],
        },
      ]}>
      <Text style={[estilos.inicial, { fontSize: tamanho * 0.42 }]}>{nome.charAt(0)}</Text>
      {fonte && (
        <Image
          source={fonte}
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
  circulo: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  inicial: { color: '#fff', fontWeight: '800' },
});
