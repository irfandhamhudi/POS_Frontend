import React, { useState, useEffect, useRef } from 'react'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import {
  AlertTriangle,
  Image as ImageIcon,
  File as FileIcon,
  Pause,
  Play,
  Check,
  X,
} from 'lucide-react'

export interface ImageUploaderProps {
  image: string
  onChange: (value: string) => void
  onFileSelect?: (file: File | null) => void
  presets: { name: string; url: string }[]
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ image, onChange, onFileSelect, presets }) => {
  const [dragActive, setDragActive] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadFile, setUploadFile] = useState<{ name: string; size: string; preview: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!image) {
      setUploadFile(null)
      setProgress(0)
      setIsUploading(false)
      setIsPaused(false)
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current)
      }
      return
    }

    if (!uploadFile || uploadFile.preview !== image) {
      let name = 'image.png'
      let size = 'Unknown'

      if (image.startsWith('data:')) {
        name = 'uploaded_image.png'
        size = `~${Math.round(image.length * 0.75 / 1024)} KB`
      } else {
        const matchedPreset = presets.find(p => p.url === image)
        if (matchedPreset) {
          name = `${matchedPreset.name}.jpg`
          size = 'Preset Image'
        } else {
          try {
            const urlObj = new URL(image)
            const pathname = urlObj.pathname
            const lastPart = pathname.substring(pathname.lastIndexOf('/') + 1)
            if (lastPart && lastPart.includes('.')) {
              name = lastPart.substring(0, 30)
            } else {
              name = `${urlObj.hostname}_image.png`
            }
          } catch (e) {
            name = 'web_image.png'
          }
          size = 'External URL'
        }
      }

      setUploadFile({ name, size, preview: image })
      setProgress(100)
      setIsUploading(false)
      setIsPaused(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, presets])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, JPEG, WEBP).')
      return
    }

    if (file.size > 800 * 1024) {
      setErrorMsg('File is too large (Max: 800 KB). Large images exceed offline database limit.')
      return
    }

    setErrorMsg(null)
    setIsUploading(true)
    setIsPaused(false)
    setProgress(0)

    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current)
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string

      setUploadFile({
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        preview: result
      })

      let currentProgress = 0
      uploadIntervalRef.current = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 12) + 6
        if (currentProgress >= 100) {
          currentProgress = 100
          if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current)
          setIsUploading(false)
          onChange(result)
          onFileSelect?.(file)
        }
        setProgress(currentProgress)
      }, 70)
    }
    reader.readAsDataURL(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false)
      let currentProgress = progress
      uploadIntervalRef.current = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 12) + 6
        if (currentProgress >= 100) {
          currentProgress = 100
          if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current)
          setIsUploading(false)
          onChange(uploadFile?.preview || '')
        }
        setProgress(currentProgress)
      }, 70)
    } else {
      setIsPaused(true)
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current)
      }
    }
  }

  const cancelUpload = () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current)
    }
    setUploadFile(null)
    setProgress(0)
    setIsUploading(false)
    setIsPaused(false)
    onChange('')
    onFileSelect?.(null)
  }

  const handleUrlImport = () => {
    if (!urlInput.trim()) return

    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
      setErrorMsg('Please enter a valid URL starting with http:// or https://')
      return
    }

    setErrorMsg(null)
    setIsUploading(true)
    setIsPaused(false)
    setProgress(0)

    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current)
    }

    let name = 'web_image.png'
    try {
      const urlObj = new URL(urlInput)
      const pathname = urlObj.pathname
      const lastPart = pathname.substring(pathname.lastIndexOf('/') + 1)
      if (lastPart && lastPart.includes('.')) {
        name = lastPart.substring(0, 30)
      } else {
        name = `${urlObj.hostname}_image.png`
      }
    } catch (e) {
      // ignore
    }

    setUploadFile({
      name,
      size: 'External URL',
      preview: urlInput
    })

    let currentProgress = 0
    uploadIntervalRef.current = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 8
      if (currentProgress >= 100) {
        currentProgress = 100
        if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current)
        setIsUploading(false)
        onChange(urlInput)
        onFileSelect?.(null)
        setUrlInput('')
      }
      setProgress(currentProgress)
    }, 60)
  }

  const handlePresetSelect = (presetUrl: string, presetName: string) => {
    setErrorMsg(null)
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current)
    }
    setUploadFile({
      name: `${presetName}.jpg`,
      size: 'Preset Image',
      preview: presetUrl
    })
    setProgress(100)
    setIsUploading(false)
    setIsPaused(false)
    onChange(presetUrl)
    onFileSelect?.(null)
  }

  return (
    <div className="flex flex-col w-full text-xs">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border border-dashed rounded-xl p-5 flex flex-col items-center justify-center transition-all min-h-[140px] text-center relative select-none ${dragActive
          ? 'border-[#0A422D] bg-[#0A422D]/5 ring-2 ring-[#0A422D]/10 dark:bg-[#0A422D]/10'
          : 'border-border hover:border-[#0A422D] hover:bg-[#0A422D]/2 dark:hover:bg-[#0A422D]/5 bg-background'
          }`}
      >
        {dragActive ? (
          <div className="flex items-center gap-1.5 text-[#0A422D] dark:text-[#4ADE80] font-semibold animate-pulse py-4">
            <span className="opacity-40 animate-ping">&gt;</span>
            <span className="opacity-70">&gt;</span>
            <span>&gt;</span>
            <span className="mx-1">Drop your files here</span>
            <span>&lt;</span>
            <span className="opacity-75">&lt;</span>
            <span className="opacity-40 animate-ping">&lt;</span>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-[#0A422D] dark:text-[#4ADE80] flex items-center justify-center mb-2 shadow-inner">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium text-foreground">
              Drop your image here, or{' '}
              <button
                type="button"
                onClick={handleBrowseClick}
                className="text-[#0A422D] dark:text-[#4ADE80] underline font-semibold hover:text-[#0A422D]/80 cursor-pointer"
              >
                browse
              </button>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Supports: PNG, JPG, JPEG, WEBP</p>
          </>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-2 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-[10px] font-semibold mt-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {uploadFile && (
        <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background relative overflow-hidden mt-3 shadow-sm">
          {uploadFile.preview ? (
            <img
              src={uploadFile.preview}
              className="w-10 h-10 rounded-md object-cover border border-border shrink-0 bg-muted"
              alt="preview"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-md border border-border bg-muted flex items-center justify-center shrink-0">
              <FileIcon className="w-5 h-5 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex justify-between items-center gap-2">
              <span className="text-[11px] font-semibold text-foreground truncate">{uploadFile.name}</span>
            </div>
            <div className="text-[9px] text-muted-foreground mt-0.5">{uploadFile.size}</div>

            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#0A422D] dark:bg-[#4ADE80] h-full transition-all duration-150 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-muted-foreground min-w-[24px] text-right">{progress}%</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isUploading ? (
              <>
                <button
                  type="button"
                  onClick={togglePause}
                  className="p-1 hover:bg-muted rounded-full cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  title={isPaused ? 'Resume upload' : 'Pause upload'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={cancelUpload}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full cursor-pointer text-red-500 hover:text-red-600 transition-colors"
                  title="Cancel upload"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1">
                {progress === 100 && (
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 font-bold" />
                )}
                <button
                  type="button"
                  onClick={cancelUpload}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full cursor-pointer text-red-500 hover:text-red-600 transition-colors"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative my-3.5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60"></div>
        </div>
        <span className="relative bg-white dark:bg-[#1C1C19] px-2 text-[9px] font-semibold uppercase text-muted-foreground">or</span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="url-import" className="font-semibold text-foreground text-[11px]">
          Import from URL
        </label>
        <div className="flex gap-2 mt-0.5">
          <Input
            id="url-import"
            type="text"
            placeholder="Add file URL"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={isUploading}
            className="h-8.5 text-xs flex-1"
          />
          <Button
            type="button"
            onClick={handleUrlImport}
            disabled={isUploading || !urlInput.trim()}
            variant="outline"
            className="h-8.5 text-xs border border-border text-[#0A422D] hover:text-[#0A422D]/90 hover:bg-[#0A422D]/5 font-semibold px-3 cursor-pointer"
          >
            Upload
          </Button>
        </div>
      </div>

      {presets && presets.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-3 border-t border-border/40 pt-2.5">
          <p className="text-[10px] text-muted-foreground font-semibold">Or select a preset:</p>
          <div className="flex flex-wrap gap-1">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(preset.url, preset.name)}
                className={`px-2 py-0.5 border rounded text-[10px] font-semibold cursor-pointer transition-all ${image === preset.url
                  ? 'bg-[#0A422D] text-white border-[#0A422D]'
                  : 'hover:bg-muted text-muted-foreground border-border bg-background'
                  }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
