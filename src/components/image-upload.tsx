'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      onChange(data.url)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Image upload is not configured. You can still create people without photos.')
      // Don't block the form submission, just skip the image
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative inline-block">
          <Image
            src={value}
            alt="Profile photo"
            width={120}
            height={120}
            className="rounded-lg object-cover border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Click to upload a profile photo
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF up to 5MB
          </p>
        </div>
      )}

      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            asChild
          >
            <span className="cursor-pointer">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {value ? 'Change Photo' : 'Upload Photo'}
                </>
              )}
            </span>
          </Button>
        </label>
      </div>
    </div>
  )
}