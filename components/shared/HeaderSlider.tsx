'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import type { HeaderSlide, HeaderSettings } from '@/lib/actions/header';

interface HeaderSliderProps {
    slides: HeaderSlide[];
    settings: HeaderSettings | null;
}

export default function HeaderSlider({ slides, settings }: HeaderSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const locale = useLocale();

    // Defaults if settings are missing
    const backgroundColor = settings?.background_color || '#5B21B6';
    const textColor = settings?.text_color || '#FFFFFF';
    const height = settings?.height || 40;
    const isActive = settings?.is_active ?? true;

    useEffect(() => {
        if (slides.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, [slides.length]);

    if (!isActive || slides.length === 0) return null;

    const currentSlide = slides[currentIndex];
    const content = locale === 'ar' && currentSlide.content_ar ? currentSlide.content_ar : currentSlide.content;

    return (
        <div
            className="w-full overflow-hidden flex items-center justify-center relative z-50"
            style={{
                backgroundColor,
                color: textColor,
                height: `${height}px`
            }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute w-full text-center px-4"
                >
                    <p className="text-sm font-medium tracking-wide">
                        {content}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
