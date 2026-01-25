'use client';

import { useState, useEffect } from 'react';
import { getHeroSlides, addHeroSlide, deleteHeroSlide, updateHeroSlideOrder } from '@/lib/actions/hero';
import ImageUpload from '@/components/admin/ImageUpload';
import Image from 'next/image';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface HeroSlide {
    id: string;
    image_url: string;
    sort_order: number;
    active: boolean;
}

export default function AdminHeroPage() {
    const t = useTranslations('Admin');
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadSlides();
    }, []);

    async function loadSlides() {
        try {
            const data = await getHeroSlides();
            setSlides(data);
        } catch (error) {
            console.error('Failed to load slides', error);
        } finally {
            setLoading(false);
        }
    }

    const handleImageUpload = async (url: string) => {
        if (!url) return;
        setUploading(true);
        try {
            const result = await addHeroSlide(url);
            if (result.success) {
                // Refresh slides
                await loadSlides();
                router.refresh();
            } else {
                alert(t('failedAdd'));
            }
        } catch (error) {
            console.error('Error adding slide:', error);
            alert(t('failedAdd'));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('confirmDelete'))) return;
        try {
            await deleteHeroSlide(id);
            setSlides(slides.filter(s => s.id !== id));
            router.refresh();
        } catch (error) {
            console.error('Failed to delete slide', error);
            alert(t('failedDelete'));
        }
    };

    const moveSlide = async (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === slides.length - 1)
        ) return;

        const newSlides = [...slides];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];

        // Update local state temporarily
        setSlides(newSlides);

        // Update orders in DB
        // Simple re-index based on new position
        const updates = newSlides.map((slide, idx) => ({
            id: slide.id,
            sort_order: idx + 1
        }));

        await updateHeroSlideOrder(updates);
        router.refresh();
    };

    if (loading) return <div className="p-8 text-center">{t('loading')}</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-white font-heading">{t('heroSlider')}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                        <h2 className="text-xl font-bold mb-4 text-white">{t('addNewSlide')}</h2>
                        <ImageUpload
                            onImageUpload={handleImageUpload}
                        />
                        {uploading && <p className="text-sm text-accent mt-2">{t('addingSlide')}</p>}
                    </div>
                </div>

                {/* Slides List */}
                <div className="lg:col-span-2">
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                        <h2 className="text-xl font-bold mb-4 text-white">{t('currentSlides')}</h2>

                        {slides.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                {t('noSlides')}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {slides.map((slide, index) => (
                                    <div key={slide.id} className="flex items-center gap-4 bg-black/20 p-4 rounded-lg border border-white/5">
                                        <div className="relative w-32 aspect-video rounded-md overflow-hidden bg-gray-800">
                                            <Image
                                                src={slide.image_url}
                                                alt={`Slide ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <p className="font-mono text-sm text-gray-400">{t('order', { order: slide.sort_order })}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => moveSlide(index, 'up')}
                                                disabled={index === 0}
                                                className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                title={t('moveUp')}
                                            >
                                                <ArrowUp className="w-5 h-5 text-white" />
                                            </button>
                                            <button
                                                onClick={() => moveSlide(index, 'down')}
                                                disabled={index === slides.length - 1}
                                                className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                title={t('moveDown')}
                                            >
                                                <ArrowDown className="w-5 h-5 text-white" />
                                            </button>
                                            <div className="w-px h-6 bg-white/10 mx-2" />
                                            <button
                                                onClick={() => handleDelete(slide.id)}
                                                className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-500 rounded-full transition-colors"
                                                title={t('delete')}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
