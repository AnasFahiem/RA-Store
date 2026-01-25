'use client';

import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Loader2, ArrowRight } from 'lucide-react';
import { useRouter, Link } from '@/lib/navigation';
import { searchProducts } from '@/lib/actions/products';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils/format';

export default function Search() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Debounce query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Fetch results
    useEffect(() => {
        async function fetchResults() {
            if (debouncedQuery.length < 1) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const data = await searchProducts(debouncedQuery);
                setResults(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        fetchResults();
    }, [debouncedQuery]);

    // click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleSearch = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
    };

    // Check if query is Arabic
    const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

    return (
        <div ref={containerRef} className="relative flex items-center">
            <button
                onClick={toggleSearch}
                className="text-gray-400 hover:text-accent hover:scale-125 p-2 transition-all duration-300 relative group"
                aria-label="Search"
            >
                <SearchIcon className="h-6 w-6" />
            </button>

            {/* Search Overlay/Dropdown */}
            <div className={`
                absolute right-0 top-12 w-[350px] sm:w-[500px] bg-neutral-950 
                border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 origin-top-right z-50
                ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-4 invisible pointer-events-none'}
            `}>
                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                    <SearchIcon className="w-5 h-5 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search products..."
                        className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted-foreground text-sm"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                            <span className="text-xs">Searching...</span>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            <p className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Products</p>
                            {results.map(product => (
                                <button
                                    key={product.id}
                                    type="button"
                                    className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors group cursor-pointer outline-none focus:bg-white/10 w-full text-left"
                                    onClick={() => {
                                        setIsOpen(false);
                                        router.push(`/products/${product.id}`);
                                    }}
                                >
                                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-white/5">
                                        {product.image ? (
                                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-xs">IMG</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                                            {(isArabic(debouncedQuery) && product.name_ar) ? product.name_ar : product.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-muted-foreground">{product.category || 'Product'}</span>
                                            <span className="text-xs font-bold text-accent">{formatCurrency(product.price)}</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        results.length === 0 && query.length > 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50">
                                <SearchIcon className="w-8 h-8 mb-2 opacity-20" />
                                <span className="text-sm">No results found for "{query}"</span>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
