'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Save, ArrowLeft, Plus, X } from 'lucide-react';
import { Link } from '@/lib/navigation';
import MultiImageUpload from './MultiImageUpload';

interface ProductFormProps {
    initialData?: {
        id?: string;
        name: string;
        name_ar?: string;
        description: string;
        description_ar?: string;
        base_price: number;
        category: string;
        images: string[];
        sizes?: string[];
    };
    action: (state: any, payload: FormData) => Promise<any>;
    mode: 'create' | 'edit';
}

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-white font-bold uppercase tracking-wider rounded-md hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Save className="h-5 w-5" />
            {pending ? 'Saving...' : mode === 'create' ? 'Save Product' : 'Update Product'}
        </button>
    );
}

export default function ProductForm({ initialData, action, mode }: ProductFormProps) {
    const [state, formAction] = useActionState(action, null);
    const [sizes, setSizes] = useState<string[]>(() => {
        if (!initialData?.sizes) return [];
        if (Array.isArray(initialData.sizes)) return initialData.sizes;
        try {
            return JSON.parse(initialData.sizes as unknown as string);
        } catch {
            return [];
        }
    });

    const [newSize, setNewSize] = useState('');

    const [images, setImages] = useState<string[]>(() => {
        if (!initialData?.images) return [];
        if (Array.isArray(initialData.images)) return initialData.images;
        if (typeof initialData.images === 'string') {
            try {
                const parsed = JSON.parse(initialData.images);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                // Fallback for primitive string URL
                return (initialData.images as string).startsWith('http') ? [initialData.images] : [];
            }
        }
        return [];
    });

    const handleAddSize = () => {
        if (newSize.trim() && !sizes.includes(newSize.trim())) {
            setSizes([...sizes, newSize.trim()]);
            setNewSize('');
        }
    };

    const handleRemoveSize = (sizeToRemove: string) => {
        setSizes(sizes.filter(s => s !== sizeToRemove));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/inventory" className="p-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-3xl font-bold font-heading uppercase tracking-wide">
                    {mode === 'create' ? 'Add New Product' : 'Edit Product'}
                </h1>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-lg p-8">
                <form action={formAction} className="space-y-8">
                    {/* Data Hidden Inputs */}
                    <input type="hidden" name="sizes" value={JSON.stringify(sizes)} />
                    <input type="hidden" name="images" value={JSON.stringify(images)} />

                    {/* Basic Info & Localization */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Product Name (English)</label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    defaultValue={initialData?.name}
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-md text-white focus:outline-none focus:border-accent transition-colors"
                                    placeholder="e.g. Heavy Duty Wraps"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Product Name (Arabic)</label>
                                <input
                                    name="name_ar"
                                    type="text"
                                    defaultValue={initialData?.name_ar}
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-md text-white text-right focus:outline-none focus:border-accent transition-colors"
                                    placeholder="مثال: أربطة رفع أثقال"
                                    dir="rtl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Description (English)</label>
                                <textarea
                                    name="description"
                                    required
                                    rows={4}
                                    defaultValue={initialData?.description}
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-md text-white focus:outline-none focus:border-accent transition-colors"
                                    placeholder="Detailed product capabilities..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Description (Arabic)</label>
                                <textarea
                                    name="description_ar"
                                    rows={4}
                                    defaultValue={initialData?.description_ar}
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-md text-white text-right focus:outline-none focus:border-accent transition-colors"
                                    placeholder="وصف تفصيلي للمنتج..."
                                    dir="rtl"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Details & Media */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">Details & Media</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                                <select
                                    name="category"
                                    defaultValue={initialData?.category}
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-md text-white focus:outline-none focus:border-accent transition-colors"
                                >
                                    <option value="Accessories">Accessories</option>
                                    <option value="Apparel">Apparel</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Protection">Protection</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Base Price (EGP)</label>
                                <input
                                    name="base_price"
                                    type="number"
                                    step="0.01"
                                    required
                                    defaultValue={initialData?.base_price}
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-md text-white focus:outline-none focus:border-accent transition-colors"
                                    placeholder="299.99"
                                />
                            </div>
                        </div>

                        <label className="block text-sm font-medium text-gray-400 mb-2">Product Images</label>
                        <p className="text-xs text-gray-500 mb-4">First image will be the main cover image. Upload multiple images to show detailed views.</p>

                        <MultiImageUpload
                            defaultImages={images}
                            onImagesChange={setImages}
                        />
                    </div>


                    {/* Size Variance */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">Sizes / Variants</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Available Sizes</label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newSize}
                                    onChange={(e) => setNewSize(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                                    className="flex-1 px-4 py-2 bg-black/50 border border-white/10 rounded-md text-white focus:outline-none focus:border-accent"
                                    placeholder="Enter size (e.g. S, M, L, 42, 44)"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSize}
                                    className="px-4 py-2 bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {sizes.map((size) => (
                                    <span key={size} className="flex items-center gap-2 bg-accent/20 border border-accent/50 text-accent px-3 py-1 rounded-full text-sm">
                                        {size}
                                        <button type="button" onClick={() => handleRemoveSize(size)}>
                                            <X className="h-3 w-3 hover:text-white" />
                                        </button>
                                    </span>
                                ))}
                                {sizes.length === 0 && (
                                    <p className="text-gray-500 text-sm italic">No sizes added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {state?.error && (
                        <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-md text-red-400 text-sm">
                            {state.error}
                        </div>
                    )}

                    <div className="pt-4 border-t border-white/5 flex justify-end">
                        <SubmitButton mode={mode} />
                    </div>
                </form>
            </div >
        </div >
    );
}
