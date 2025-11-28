'use client'

import { useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadAvatar } from '@/app/profile/avatar-actions'
import { useRouter } from 'next/navigation'

interface Props {
    userId: string
    currentAvatarUrl?: string | null
    userName: string
}

export function ProfilePictureUpload({ userId, currentAvatarUrl, userName }: Props) {
    const [uploading, setUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const router = useRouter()

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)

            if (!event.target.files || event.target.files.length === 0) {
                setUploading(false)
                return
            }

            const file = event.target.files[0]

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image must be less than 2MB')
                setUploading(false)
                return
            }

            // Show preview immediately
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string)
            }
            reader.readAsDataURL(file)

            // Upload via Server Action
            const formData = new FormData()
            formData.append('avatar', file)

            const result = await uploadAvatar(formData)

            if (result.error) {
                toast.error(result.error)
                setPreviewUrl(null)
                setUploading(false)
                return
            }

            toast.success('Profile picture updated!')
            router.refresh()
            setUploading(false)

        } catch (error: any) {
            console.error('Error uploading avatar:', error)
            toast.error(error.message || 'Failed to upload profile picture')
            setPreviewUrl(null)
            setUploading(false)
        }
    }

    const displayUrl = previewUrl || currentAvatarUrl

    return (
        <div className="relative group">
            {/* Avatar Display */}
            <div className="relative h-16 w-16 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20">
                {displayUrl ? (
                    <>
                        <img
                            src={displayUrl}
                            alt={userName}
                            className={`h-full w-full object-cover ${uploading ? 'opacity-50' : ''}`}
                        />
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <Loader2 className="h-6 w-6 text-white animate-spin" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-primary">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                )}

                {/* Upload Overlay */}
                {!uploading && (
                    <label
                        htmlFor="avatar-upload"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        <Camera className="h-6 w-6 text-white" />
                    </label>
                )}
            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
            />
        </div>
    )
}
