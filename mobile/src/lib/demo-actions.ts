import { Alert } from 'react-native'
import {
  getMediaLibraryPermissionsAsync,
  launchImageLibraryAsync,
} from 'expo-image-picker'

export async function pickDemoPhotos() {
  try {
    const result = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
    })
    return result.canceled ? [] : result.assets
  } catch {
    const permission = await getMediaLibraryPermissionsAsync().catch(() => null)
    if (permission?.status === 'denied') {
      throw Error(
        'O acesso às fotos está bloqueado. Verifique a permissão do Expo Go em Ajustes.',
      )
    }
    throw Error(
      'Não foi possível abrir a biblioteca. Tente selecionar uma foto disponível no aparelho.',
    )
  }
}

export function confirmDemoAction(
  title: string,
  detail: string,
  confirmLabel: string,
  action: () => Promise<void>,
) {
  Alert.alert(title, detail, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: confirmLabel,
      style: 'destructive',
      onPress: () => {
        void action().catch((error: unknown) =>
          Alert.alert(
            'Operação indisponível',
            error instanceof Error ? error.message : 'Tente novamente.',
          ),
        )
      },
    },
  ])
}
