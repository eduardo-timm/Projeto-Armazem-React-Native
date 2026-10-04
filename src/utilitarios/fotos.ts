import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Linking } from 'react-native';

import { alertar } from './alerta';

export type OrigemFoto = 'camera' | 'galeria';

/** Maior lado da foto enviada. Suficiente para ver o produto e leve para a internet do celular. */
const LADO_MAXIMO = 1024;

/**
 * Abre a câmera ou a galeria, deixa recortar em quadrado e devolve a foto já reduzida
 * (JPEG local, pronto para `enviarFoto`). Devolve null se o usuário cancelar.
 * A conversão para JPEG também resolve fotos HEIC do iPhone (o bucket só aceita JPEG).
 */
export async function escolherFoto(origem: OrigemFoto): Promise<string | null> {
  // A galeria usa o seletor do sistema e não precisa de permissão; a câmera precisa.
  if (origem === 'camera' && !(await temPermissaoCamera())) return null;

  const opcoes: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  };
  const resultado =
    origem === 'camera'
      ? await ImagePicker.launchCameraAsync(opcoes)
      : await ImagePicker.launchImageLibraryAsync(opcoes);
  if (resultado.canceled || !resultado.assets[0]) return null;

  const { uri, width, height } = resultado.assets[0];
  const contexto = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > LADO_MAXIMO) {
    contexto.resize(width >= height ? { width: LADO_MAXIMO } : { height: LADO_MAXIMO });
  }
  const imagem = await contexto.renderAsync();
  const salva = await imagem.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });
  return salva.uri;
}

async function temPermissaoCamera() {
  const permissao = await ImagePicker.requestCameraPermissionsAsync();
  if (permissao.granted) return true;
  alertar(
    'Sem acesso à câmera',
    'Permita o acesso à câmera nos ajustes do celular para tirar a foto.',
    permissao.canAskAgain
      ? [{ text: 'OK' }]
      : [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
        ]
  );
  return false;
}
