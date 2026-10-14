import { useId, useRef, useState, type ChangeEvent } from 'react'
import { ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@/types/auth/AuthTypes'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { useRemoveAvatar, useUploadAvatar } from '@/hooks/useProfile'
import { AvatarError, processAvatar } from '@/utils/AvatarUtils'

export function AvatarField({ user }: { user: User }) {
  const inputId = useId()
  const messageId = useId()
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const upload = useUploadAvatar()
  const remove = useRemoveAvatar()
  const busy = processing || upload.isPending || remove.isPending

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    setProcessing(true)
    try {
      const dataUrl = await processAvatar(file)
      upload.mutate(dataUrl, {
        onSuccess: () => toast.success('Avatar atualizado.'),
        onError: (uploadError) => setError(getApiErrorMessage(uploadError)),
      })
    } catch (processError) {
      setError(processError instanceof AvatarError ? processError.message : 'Não foi possível processar a imagem.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-2" role="group" aria-labelledby={`${inputId}-label`}>
      <span id={`${inputId}-label`} className="text-[15px]">
        Avatar
      </span>
      <div className="flex flex-wrap items-center gap-6">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={`Avatar de ${user.displayName}`} width={50} height={50} className="size-[50px] rounded-full object-cover" />
        ) : (
          <span className="grid size-[50px] place-items-center rounded-full border border-border bg-secondary text-primary">
            <ImageIcon aria-hidden className="size-6" />
            <span className="sr-only">Sem avatar</span>
          </span>
        )}
        <input
          ref={fileInput}
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-describedby={messageId}
          onChange={(event) => void onFileChange(event)}
          className="sr-only"
        />
        <Button type="button" onClick={() => fileInput.current?.click()} disabled={busy} className="px-6">
          {busy ? 'Enviando...' : 'Alterar'}
        </Button>
        {user.avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() =>
              remove.mutate(undefined, {
                onSuccess: () => toast.success('Avatar removido.'),
                onError: (removeError) => setError(getApiErrorMessage(removeError)),
              })
            }
          >
            Remover
          </Button>
        )}
      </div>
      <p id={messageId} aria-live="polite" className="text-xs text-muted-foreground">
        {error ? <span className="text-coral">{error}</span> : 'PNG, JPEG ou WebP de até 5 MB. A imagem é recortada em 256 × 256.'}
      </p>
    </div>
  )
}
