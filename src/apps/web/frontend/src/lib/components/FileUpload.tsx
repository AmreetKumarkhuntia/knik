import { useState, useRef, DragEvent, ChangeEvent } from 'react'

export interface FileUploadProps {
  accept?: string
  multiple?: boolean
  onUpload: (files: File[]) => void
  maxSize?: number // in bytes
  className?: string
}

/**
 * Drag-and-drop zone with dashed border and file list preview.
 */
export default function FileUpload({
  accept,
  multiple = false,
  onUpload,
  maxSize,
  className = '',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files))
    }
  }

  const processFiles = (newFiles: File[]) => {
    let validFiles = newFiles
    if (maxSize) {
      validFiles = validFiles.filter(f => f.size <= maxSize)
    }
    if (!multiple && validFiles.length > 1) {
      validFiles = [validFiles[0]]
    }

    onUpload(validFiles)
    setFiles(prev => (multiple ? [...prev, ...validFiles] : validFiles))
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'py':
      case 'js':
      case 'ts':
        return { icon: 'code', bg: 'var(--warning-bg)', color: 'var(--warning)' }
      case 'md':
      case 'txt':
      case 'csv':
        return {
          icon: 'description',
          bg: 'color-mix(in srgb, var(--primary) 16%, transparent)',
          color: 'var(--aurora-300)',
        }
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'svg':
        return {
          icon: 'image',
          bg: 'color-mix(in srgb, var(--violet-500) 16%, transparent)',
          color: 'var(--violet-400)',
        }
      case 'wav':
      case 'mp3':
        return { icon: 'graphic_eq', bg: 'var(--success-bg)', color: 'var(--success)' }
      default:
        return { icon: 'draft', bg: 'var(--bg-surface-3)', color: 'var(--fg-3)' }
    }
  }

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {files.map((file, i) => {
            const { icon, bg, color } = getFileIcon(file.name)
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-surface-2)] border border-[var(--border-2)] rounded-md text-[12px] text-[var(--fg-1)]"
              >
                <div
                  className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center shrink-0"
                  style={{ background: bg, color }}
                >
                  <span className="material-symbols-outlined text-[14px]">{icon}</span>
                </div>
                <span className="font-medium tracking-[-0.005em]">{file.name}</span>
                <span className="font-mono text-[10.5px] text-[var(--fg-4)]">
                  {formatSize(file.size)}
                </span>
                <span
                  onClick={() => removeFile(i)}
                  className="material-symbols-outlined text-[14px] text-[var(--fg-4)] cursor-pointer hover:text-[var(--fg-1)] transition-colors ml-1"
                >
                  close
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`p-[22px] border-[1.5px] border-dashed rounded-lg bg-[var(--bg-surface-2)] text-[var(--fg-3)] text-[13px] text-center cursor-pointer transition-colors duration-base ${
          isDragging
            ? 'border-[var(--aurora-400)] bg-[color-mix(in_srgb,var(--primary)_4%,transparent)]'
            : 'border-[var(--border-3)] hover:border-[var(--fg-4)]'
        }`}
      >
        <div className="w-[36px] h-[36px] rounded-[10px] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] text-[var(--aurora-300)] flex items-center justify-center mx-auto mb-2">
          <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
        </div>
        <div>
          Drag & drop files here, or{' '}
          <b className="text-[var(--aurora-300)] font-normal">click to upload</b>
        </div>
        <div className="font-mono text-[10.5px] text-[var(--fg-5)] mt-1">
          {accept ? accept.split(',').join(' · ') : 'Any file'}
          {maxSize ? ` · max ${Math.floor(maxSize / 1024 / 1024)} MB each` : ''}
        </div>
        <input
          type="file"
          ref={inputRef}
          onChange={handleChange}
          accept={accept}
          multiple={multiple}
          className="hidden"
        />
      </div>
    </div>
  )
}
