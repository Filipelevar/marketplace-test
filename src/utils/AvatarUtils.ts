import { AVATAR_SIZE_PX } from '@/types/profile/ProfileTypes'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SOURCE_BYTES = 5 * 1024 * 1024

export class AvatarError extends Error {}

export async function processAvatar(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new AvatarError('Envie uma imagem PNG, JPEG ou WebP.')
  if (file.size > MAX_SOURCE_BYTES) throw new AvatarError('A imagem deve ter no máximo 5 MB.')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new AvatarError('Não foi possível ler esta imagem.')
  }

  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE_PX
  canvas.height = AVATAR_SIZE_PX
  const context = canvas.getContext('2d')
  if (!context) throw new AvatarError('Seu navegador não conseguiu processar a imagem.')
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE_PX,
    AVATAR_SIZE_PX,
  )
  bitmap.close()

  const webp = canvas.toDataURL('image/webp', 0.85)
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85)
}
