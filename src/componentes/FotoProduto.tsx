import { Image, type ImageStyle } from 'expo-image';
import { useMemo } from 'react';
import type { StyleProp } from 'react-native';

import { fonteDaFoto } from '../banco/supabase';
import { useSessaoAtiva } from '../sessao';
import { useTema } from '../tema';

/**
 * Foto de um produto. `foto` pode ser:
 * - o caminho salvo no Storage (`produtos.caminho_foto`, ex.: "equipe/abc.jpg"): é baixada
 *   com o acesso atual e fica no cache do celular;
 * - uma URI local ("file://…") de uma foto recém-escolhida que ainda não foi enviada.
 */
export function FotoProduto({ foto, estilo }: { foto: string; estilo?: StyleProp<ImageStyle> }) {
  const { cores } = useTema();
  const { acesso } = useSessaoAtiva();
  const fonte = useMemo(
    () => (foto.includes('://') ? { uri: foto } : fonteDaFoto(acesso, foto)),
    [acesso, foto]
  );

  return (
    <Image
      source={fonte}
      style={[{ backgroundColor: cores.superficieSuave }, estilo]}
      contentFit="cover"
      transition={150}
      recyclingKey={foto}
      accessibilityIgnoresInvertColors
    />
  );
}
