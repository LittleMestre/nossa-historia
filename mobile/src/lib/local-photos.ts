import { Directory, File, FileMode, Paths } from 'expo-file-system'
import type { ImagePickerAsset } from 'expo-image-picker'
import type { Photo } from './model'
import { localId } from './local-repository'
import { demoData } from './demo'

const directory = () => new Directory(Paths.document, 'nossa-historia-photos')
const safeName = /^photo-[a-z0-9-]+\.[a-z0-9]{2,8}$/
const bundled = new Map(demoData.photos.map((p) => [p.id, p.asset]))
export function resolvePhoto(p: Photo): Photo {
  if (!p.storage_path) return { ...p, asset: bundled.get(p.id) }
  const legacy = !p.storage_path.startsWith('local/')
  const name = legacy ? p.storage_path : p.storage_path.slice(6)
  if (!safeName.test(name)) return p
  const dir = legacy
    ? new Directory(Paths.document, 'nossa-historia-demo-photos')
    : directory()
  return { ...p, url: new File(dir, name).uri }
}

export function verifyStoredPhoto(photo: Photo) {
  const resolved = resolvePhoto(photo)
  if (resolved.asset) return
  if (resolved.url) {
    const file = new File(resolved.url)
    if (file.exists && file.size > 0) return
  }
  throw Error('O arquivo desta fotografia não está disponível no aparelho.')
}

function imageExtension(file: File) {
  if (!file.exists || !file.size || file.size > 20 * 1024 * 1024)
    throw Error('Escolha uma fotografia disponível no aparelho de até 20 MB.')
  const handle = file.open(FileMode.ReadOnly)
  try {
    const b = handle.readBytesSync(Math.min(16, file.size))
    const ascii = (offset: number, n: number) =>
      String.fromCharCode(...b.slice(offset, offset + n))
    if (b[0] === 255 && b[1] === 216 && b[2] === 255) return 'jpg'
    if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v))
      return 'png'
    if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'webp'
    if (
      ascii(4, 4) === 'ftyp' &&
      ['heic', 'heix', 'mif1', 'hevc'].includes(ascii(8, 4))
    )
      return 'heic'
    throw Error('Escolha uma imagem JPEG, PNG, WebP ou HEIC.')
  } finally {
    handle.close()
  }
}
export async function copyPhotos(assets: ImagePickerAsset[], event: string) {
  const dir = directory()
  const photos: Photo[] = []
  if (assets.length) dir.create({ intermediates: true, idempotent: true })
  for (const asset of assets) {
    const source = new File(asset.uri)
    const id = localId('photo')
    const name = id + '.' + imageExtension(source)
    const destination = new File(dir, name)
    await source.copy(destination)
    if (!destination.exists || destination.size !== source.size)
      throw Error('Falha ao copiar a fotografia.')
    photos.push({
      id,
      event_id: event,
      storage_path: 'local/' + name,
      description: null,
    })
  }
  return photos
}

// Called only outside an import, with references from every family, including trash.
export function cleanPhotoFiles(paths: Set<string>) {
  try {
    const dir = directory()
    if (dir.exists)
      for (const f of dir.list()) {
        if (
          f instanceof File &&
          safeName.test(f.name) &&
          !paths.has('local/' + f.name)
        )
          f.delete()
      }
  } catch {
    /* Retry at next opening. */
  }
}
