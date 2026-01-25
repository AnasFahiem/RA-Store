'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils'; // Assuming cn utility exists, usually does in shadcn/ui setups

interface Props {
    mainImage?: string;
    itemImages: string[];
    bundleName: string;
}

export default function BundleImageGallery({ mainImage, itemImages, bundleName }: Props) {
    // Combine main image (if exists) and item images into one list
    // Or keep them separate if the design is specifically: Main Big Image + Strip of item images
    // User requested: "products' images of the bundel should be visible like the product view"
    // Screenshot showed: Main Image on left, thumbnails on right? Or Main Image and thumbnails below?
    // Screenshot 1: 2 images side-by-side with border.
    // Screenshot 2: Main image + small thumbnails below.

    // Strategy:
    // 1. All distinct images in a list.
    // 2. Default to `mainImage` or first item image.
    // 3. Thumbnails below.

    // Filter duplicates and valid images
    const allImages = [mainImage, ...itemImages].filter(Boolean) as string[];
    const uniqueImages = Array.from(new Set(allImages));

    const [selectedImage, setSelectedImage] = useState<string>(uniqueImages[0] || '/placeholder.jpg');

    if (uniqueImages.length === 0) {
        return (
            <div className="aspect-square relative bg-gray-100 dark:bg-zinc-900 rounded-2xl overflow-hidden border border-border">
                <Image src="/placeholder.jpg" alt={bundleName} fill className="object-cover" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div
                className="aspect-square relative bg-gray-50 dark:bg-zinc-900/50 rounded-2xl overflow-hidden border border-border group cursor-zoom-in"
                onMouseMove={(e) => {
                    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - left) / width) * 100;
                    const y = ((e.clientY - top) / height) * 100;
                    e.currentTarget.style.setProperty('--zoom-origin', `${x}% ${y}%`);
                }}
            >
                <Image
                    src={selectedImage}
                    alt={bundleName}
                    fill
                    className="object-contain p-4 transition-transform duration-200 ease-out group-hover:scale-[2]"
                    style={{ transformOrigin: 'var(--zoom-origin, 50% 50%)' } as any}
                    priority
                />
            </div>

            {/* Thumbnails */}
            {uniqueImages.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {uniqueImages.map((img, idx) => (
                        <button
                            key={img}
                            type="button"
                            onClick={() => setSelectedImage(img)}
                            className={cn(
                                "relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                                selectedImage === img
                                    ? "border-accent ring-2 ring-accent/20"
                                    : "border-transparent hover:border-gray-300 dark:hover:border-white/50"
                            )}
                        >
                            <Image src={img} alt={`View ${idx + 1}`} fill className="object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
