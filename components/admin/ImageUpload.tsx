'use client';

// Force HMR Update

import { useState, useRef } from 'react';
import { uploadImage } from '@/lib/actions/upload'; // Server Action
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
    defaultImage?: string;
    onImageUpload: (url: string) => void;
}

export default function ImageUpload({ defaultImage, onImageUpload }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(defaultImage || null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        console.log('Client: Sending file to server action...', file.name);

        try {
            const result = await uploadImage(formData);
            console.log('Client: Server action result:', result);

            if (result.error) {
                throw new Error(result.error);
            }

            if (result.url) {
                setPreview(result.url);
                onImageUpload(result.url);
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error.message || 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const removeImage = () => {
        setPreview(null);
        onImageUpload('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="w-full">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleChange}
            />

            {preview ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 group">
                    <Image
                        src={preview}
                        alt="Product preview"
                        fill
                        className="object-contain bg-black/50"
                    />
                    <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`
                        relative w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
                        ${isDragging
                            ? 'border-accent bg-accent/10'
                            : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                        }
                    `}
                >
                    {isUploading ? (
                        <Loader2 className="h-8 w-8 text-accent animate-spin mb-2" />
                    ) : (
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    )}
                    <p className="text-sm font-medium text-gray-300">
                        {isUploading ? 'Uploading...' : 'Click or Drag image here'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Supports JPG, PNG, WEBP
                    </p>
                </div>
            )}
        </div>
    );
}
