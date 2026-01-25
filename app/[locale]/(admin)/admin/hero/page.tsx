'use client';

import { useState, useEffect } from 'react';
import { getHeroSlides, addHeroSlide, deleteHeroSlide, updateHeroSlideOrder } from '@/lib/actions/hero';
import {
    getHeaderSlides,
    getAllHeaderSlides,
    addHeaderSlide,
    deleteHeaderSlide as deleteHeaderSlideAction,
    getHeaderSettings,
    updateHeaderSettings,
    type HeaderSlide,
    type HeaderSettings
} from '@/lib/actions/header';
import ImageUpload from '@/components/admin/ImageUpload';
import Image from 'next/image';
import { Trash2, ArrowUp, ArrowDown, Plus, Save } from 'lucide-react';
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
    const router = useRouter();

    // Hero Slider State
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Header Slider State
    const [headerSlides, setHeaderSlides] = useState<HeaderSlide[]>([]);
    const [headerSettings, setHeaderSettings] = useState<HeaderSettings | null>(null);
    const [newHeaderContent, setNewHeaderContent] = useState('');
    const [newHeaderContentAr, setNewHeaderContentAr] = useState('');
    const [headerLoading, setHeaderLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [heroData, headerSlidesData, headerSettingsData] = await Promise.all([
                getHeroSlides(),
                getAllHeaderSlides(), // Get all including inactive if needed, but for now just all
                getHeaderSettings()
            ]);
            setHeroSlides(heroData);
            setHeaderSlides(headerSlidesData);
            setHeaderSettings(headerSettingsData);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
            setHeaderLoading(false);
        }
    }

    // --- Hero Slider Handlers ---

    const handleImageUpload = async (url: string) => {
        if (!url) return;
        setUploading(true);
        try {
            const result = await addHeroSlide(url);
            if (result.success) {
                loadData();
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

    const handleDeleteHero = async (id: string) => {
        if (!confirm(t('confirmDelete'))) return;
        try {
            await deleteHeroSlide(id);
            setHeroSlides(heroSlides.filter(s => s.id !== id));
            router.refresh();
        } catch (error) {
            console.error('Failed to delete slide', error);
            alert(t('failedDelete'));
        }
    };

    const moveHeroSlide = async (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === heroSlides.length - 1)
        ) return;

        const newSlides = [...heroSlides];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];

        setHeroSlides(newSlides);

        const updates = newSlides.map((slide, idx) => ({
            id: slide.id,
            sort_order: idx + 1
        }));

        await updateHeroSlideOrder(updates);
        router.refresh();
    };

    // --- Header Slider Handlers ---

    const handleAddHeaderSlide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHeaderContent) return;

        try {
            const result = await addHeaderSlide(newHeaderContent, newHeaderContentAr);
            if (result.success) {
                setNewHeaderContent('');
                setNewHeaderContentAr('');
                const updatedSlides = await getAllHeaderSlides();
                setHeaderSlides(updatedSlides);
                router.refresh();
            }
        } catch (error) {
            console.error('Error adding header slide:', error);
        }
    };

    const handleDeleteHeader = async (id: string) => {
        if (!confirm(t('confirmDelete'))) return;
        try {
            await deleteHeaderSlideAction(id);
            setHeaderSlides(headerSlides.filter(s => s.id !== id));
            router.refresh();
        } catch (error) {
            console.error('Failed to delete header slide', error);
        }
    };

    const handleUpdateSettings = async () => {
        if (!headerSettings) return;
        try {
            await updateHeaderSettings({
                background_color: headerSettings.background_color,
                text_color: headerSettings.text_color,
                is_active: headerSettings.is_active
            });
            alert('Settings saved!');
            router.refresh();
        } catch (error) {
            console.error('Failed to update settings', error);
        }
    };

    if (loading) return <div className="p-8 text-center">{t('loading')}</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">

            {/* --- Hero Slider Section --- */}
            <div>
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

                            {heroSlides.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    {t('noSlides')}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {heroSlides.map((slide, index) => (
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
                                                    onClick={() => moveHeroSlide(index, 'up')}
                                                    disabled={index === 0}
                                                    className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    title={t('moveUp')}
                                                >
                                                    <ArrowUp className="w-5 h-5 text-white" />
                                                </button>
                                                <button
                                                    onClick={() => moveHeroSlide(index, 'down')}
                                                    disabled={index === heroSlides.length - 1}
                                                    className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    title={t('moveDown')}
                                                >
                                                    <ArrowDown className="w-5 h-5 text-white" />
                                                </button>
                                                <div className="w-px h-6 bg-white/10 mx-2" />
                                                <button
                                                    onClick={() => handleDeleteHero(slide.id)}
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

            {/* divider */}
            <hr className="border-white/10" />

            {/* --- Header Slider Section --- */}
            <div>
                <h1 className="text-3xl font-bold mb-8 text-white font-heading">Header Slider (Top Bar)</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Settings & Add Section */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Settings */}
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <h2 className="text-xl font-bold mb-4 text-white">Settings</h2>
                            {headerSettings && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Background Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={headerSettings.background_color}
                                                onChange={(e) => setHeaderSettings({ ...headerSettings, background_color: e.target.value })}
                                                className="h-10 w-16 rounded bg-transparent border border-white/20 p-1"
                                            />
                                            <input
                                                type="text"
                                                value={headerSettings.background_color}
                                                onChange={(e) => setHeaderSettings({ ...headerSettings, background_color: e.target.value })}
                                                className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Text Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={headerSettings.text_color}
                                                onChange={(e) => setHeaderSettings({ ...headerSettings, text_color: e.target.value })}
                                                className="h-10 w-16 rounded bg-transparent border border-white/20 p-1"
                                            />
                                            <input
                                                type="text"
                                                value={headerSettings.text_color}
                                                onChange={(e) => setHeaderSettings({ ...headerSettings, text_color: e.target.value })}
                                                className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="activeCheck"
                                            checked={headerSettings.is_active}
                                            onChange={(e) => setHeaderSettings({ ...headerSettings, is_active: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                                        />
                                        <label htmlFor="activeCheck" className="text-white">Active</label>
                                    </div>
                                    <button
                                        onClick={handleUpdateSettings}
                                        className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white py-2 px-4 rounded-md transition-colors font-medium"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Settings
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Add Slide Form */}
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <h2 className="text-xl font-bold mb-4 text-white">Add Header Slide</h2>
                            <form onSubmit={handleAddHeaderSlide} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Content (English)</label>
                                    <input
                                        type="text"
                                        required
                                        value={newHeaderContent}
                                        onChange={(e) => setNewHeaderContent(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-accent"
                                        placeholder="Free shipping..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Content (Arabic)</label>
                                    <input
                                        type="text"
                                        value={newHeaderContentAr}
                                        onChange={(e) => setNewHeaderContentAr(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-accent text-right"
                                        placeholder="شحن مجاني..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-md transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Slide
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Slides List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10 h-full">
                            <h2 className="text-xl font-bold mb-4 text-white">Header Slides</h2>
                            {headerSlides.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    No header slides yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {headerSlides.map((slide) => (
                                        <div key={slide.id} className="flex items-center justify-between bg-black/20 p-4 rounded-lg border border-white/5">
                                            <div className="space-y-1">
                                                <p className="text-white font-medium">{slide.content}</p>
                                                {slide.content_ar && <p className="text-gray-400 text-sm dir-rtl">{slide.content_ar}</p>}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteHeader(slide.id)}
                                                className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-500 rounded-full transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
