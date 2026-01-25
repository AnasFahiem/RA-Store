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
    const locale = useLocale();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Default settings
    const globalBg = settings?.background_color || '#5B21B6';
    const globalText = settings?.text_color || '#FFFFFF';
    const height = settings?.height || 40;
    const isActive = settings?.is_active ?? true;
    const animation = settings?.animation || 'marquee';

    const isAr = locale === 'ar';

    // --- EFFECT FOR FADE ANIMATION ---
    useEffect(() => {
        if (animation !== 'fade' || slides.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [animation, slides.length]);

    if (!isActive || slides.length === 0) return null;

    // --- MARQUEE RENDER ---
    if (animation === 'marquee') {
        const contentList = slides.map(s => {
            const text = (locale === 'ar' && s.content_ar) ? s.content_ar : s.content;
            return {
                text,
                bgColor: s.background_color, // optional override
                textColor: s.text_color      // optional override
            };
        });

        const repeatedList = [...contentList, ...contentList, ...contentList, ...contentList];

        const animProps = isAr
            ? { x: ['0%', '-50%'] }
            : { x: ['-50%', '0%'] };

        return (
            <div
                className="w-full overflow-hidden flex items-center relative z-50"
                style={{
                    backgroundColor: globalBg,
                    color: globalText,
                    height: `${height}px`
                }}
            >
                <div className="absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />

                <motion.div
                    className="flex items-center gap-12 whitespace-nowrap px-4"
                    animate={animProps}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 20 + (slides.length * 2),
                    }}
                    style={{ width: "fit-content" }}
                >
                    {repeatedList.map((item, i) => (
                        <div key={i} className="flex items-center">
                            <span
                                className={`text-sm font-medium tracking-wide px-3 py-1 rounded-full ${item.bgColor ? 'shadow-sm' : ''}`}
                                style={{
                                    backgroundColor: item.bgColor || 'transparent',
                                    color: item.textColor || 'inherit'
                                }}
                            >
                                {item.text}
                            </span>
                            {/* Dot separator only if background not set, otherwise gap is enough? Let's keep dot but transparent if bg set? */}
                            {/* Actually, if pills are used, dots might look weird. Let's keep dots but make them subtle. */}
                            {!item.bgColor && <span className="mx-6 opacity-50 text-[8px]">•</span>}
                        </div>
                    ))}
                </motion.div>
            </div>
        );
    }

    // --- FADE RENDER ---
    const currentSlide = slides[currentIndex];
    const content = (locale === 'ar' && currentSlide.content_ar) ? currentSlide.content_ar : currentSlide.content;

    // For fade, we animate the container background too if specific color is set
    const activeBg = currentSlide.background_color || globalBg;
    const activeText = currentSlide.text_color || globalText;

    return (
        <motion.div
            className="w-full overflow-hidden flex items-center justify-center relative z-50 transition-colors duration-500"
            animate={{ backgroundColor: activeBg, color: activeText }}
            style={{
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
        </motion.div>
    );
}
