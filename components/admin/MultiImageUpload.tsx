'use client';

import { useState, useRef } from 'react';
import { uploadImage } from '@/lib/actions/upload'; // Server Action
import { supabase } from '@/lib/supabase';
import { Upload, X, Loader2, Star, AlertCircle, Trash2 } from 'lucide-react';

interface MultiImageUploadProps {
    defaultImages?: string[];
    onImagesChange: (urls: string[]) => void;
}

export default function MultiImageUpload({ defaultImages = [], onImagesChange }: MultiImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await uploadImage(formData);

            if (result.error) {
                throw new Error(result.error);
            }

            if (result.url) {
                const newImages = [...defaultImages, result.url];
                onImagesChange(newImages);
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const removeImage = (indexToRemove: number) => {
        const newImages = defaultImages.filter((_, index) => index !== indexToRemove);
        onImagesChange(newImages);
    };

    const setAsMain = (index: number) => {
        if (index === 0) return;
        const newImages = [...defaultImages];
        const [movedImage] = newImages.splice(index, 1);
        newImages.unshift(movedImage);
        onImagesChange(newImages);
    };

    const handleImageError = (url: string) => {
        console.error(`Failed to load image: ${url}`);
        setFailedImages(prev => ({ ...prev, [url]: true }));
    };

    return (
        <div className="space-y-6">
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`
                    relative w-full h-40 rounded-xl border-2 border-dashed 
                    flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                    ${isUploading
                        ? 'border-accent bg-accent/5 cursor-wait'
                        : 'border-white/20 hover:border-accent/50 hover:bg-white/5'
                    }
                `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    disabled={isUploading}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center text-accent">
                        <Loader2 className="h-10 w-10 animate-spin mb-3" />
                        <span className="text-sm font-medium animate-pulse">Uploading to Cloud...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-gray-400 group-hover:text-gray-300">
                        <div className="p-3 bg-white/5 rounded-full mb-3 group-hover:bg-white/10 transition-colors">
                            <Upload className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium">Click to upload or drag & drop</p>
                        <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, WEBP</p>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <input
                    type="url"
                    placeholder="Alternatively, paste an image URL here..."
                    className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const url = e.currentTarget.value.trim();
                            if (url) {
                                onImagesChange([...defaultImages, url]);
                                e.currentTarget.value = '';
                            }
                        }
                    }}
                />
            </div>

            {defaultImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {defaultImages.map((url, index) => (
                        <div
                            key={`${url}-${index}`}
                            className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shadow-sm"
                        >
                            {failedImages[url] ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-zinc-800 p-2 text-center">
                                    <AlertCircle className="h-8 w-8 mb-2 text-red-400" />
                                    <span className="text-xs">Failed to load</span>
                                    <p className="text-[8px] mt-1 break-all opacity-50">{url.slice(0, 30)}...</p>
                                </div>
                            ) : (
                                <img
                                    src={url}
                                    alt={`Product ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={() => handleImageError(url)}
                                />
                            )}

                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex justify-between items-end opacity-0 group-hover:opacity-100">
                                <button
                                    type="button"
                                    onClick={() => setAsMain(index)}
                                    className={`p-2 rounded-lg backdrop-blur-md transition-all ${index === 0
                                        ? 'bg-accent text-black shadow-lg shadow-accent/20'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                    title={index === 0 ? "Main Image" : "Set as Main"}
                                >
                                    <Star className={`h-4 w-4 ${index === 0 ? 'fill-current' : ''}`} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg backdrop-blur-md transition-colors"
                                    title="Delete Image"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            {index === 0 && (
                                <div className="absolute top-2 left-2 px-2.5 py-1 bg-accent/90 backdrop-blur-sm text-black text-[10px] font-bold uppercase tracking-wider rounded-md shadow-lg">
                                    Main
                                </div>
                            )}

                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white/70 text-[10px] font-mono rounded-md">
                                #{index + 1}
                            </div>

                            {/* Debug URL Overlay - Kept for troubleshooting */}
                            <p className="absolute bottom-0 left-0 right-0 bg-black/80 text-[8px] text-zinc-400 p-1 truncate z-0 opacity-0 group-hover:opacity-100 transition-opacity delay-100">{url}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
