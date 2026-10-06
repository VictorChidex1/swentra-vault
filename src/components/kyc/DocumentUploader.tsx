import { useCallback, useRef, useState } from 'react'
import { UploadCloudIcon, XIcon, ImageIcon } from 'lucide-react'
import { cn } from 'cn'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

interface DocumentUploaderProps {
  label: string
  file: File | null
  onFileChange: (file: File | null) => void
  className?: string
}

export function DocumentUploader({
  label,
  file,
  onFileChange,
  className,
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const processFile = useCallback(
    (f: File) => {
      setError(null)

      if (!ACCEPTED_TYPES.includes(f.type)) {
        setError('Only JPEG, PNG, or WebP images are accepted.')
        return
      }

      if (f.size > MAX_SIZE_BYTES) {
        setError('File must be under 5 MB.')
        return
      }

      // Generate preview URL
      const url = URL.createObjectURL(f)
      setPreview(url)
      onFileChange(f)
    },
    [onFileChange],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) processFile(droppedFile)
    },
    [processFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) processFile(selectedFile)
    },
    [processFile],
  )

  const handleRemove = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setError(null)
    onFileChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [preview, onFileChange])

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium text-foreground">{label}</p>

      {file && preview ? (
        /* ---- Preview State ---- */
        <div className="group relative overflow-hidden rounded-lg border border-border bg-surface">
          <img
            src={preview}
            alt={label}
            className="h-48 w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/80"
            >
              <XIcon className="size-3.5" />
              Remove
            </button>
          </div>
          <div className="flex items-center gap-2 border-t border-border px-3 py-2">
            <ImageIcon className="size-3.5 text-muted-foreground" />
            <span className="truncate text-xs text-muted-foreground">
              {file.name}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(0)} KB
            </span>
          </div>
        </div>
      ) : (
        /* ---- Drop Zone State ---- */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/30 hover:bg-surface',
          )}
        >
          <UploadCloudIcon
            className={cn(
              'size-8 transition-colors',
              dragActive ? 'text-primary' : 'text-muted-foreground',
            )}
          />
          <div className="space-y-1 text-center">
            <p className="text-sm text-foreground">
              {dragActive ? 'Drop your file here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG or WebP — max 5 MB
            </p>
          </div>
        </button>
      )}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        aria-label={label}
      />
    </div>
  )
}
