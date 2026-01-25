'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import type { HeaderSlide, HeaderSettings } from '@/lib/actions/header';
import './HeaderSlider.css';

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
        // Build the content list from slides
        const contentList = slides.map(s => {
            const text = (locale === 'ar' && s.content_ar) ? s.content_ar : s.content;
            return {
                text,
                bgColor: s.background_color,
                textColor: s.text_color
            };
        });

        // Render ONE set of items as a component
        const MarqueeSet = () => (
            <>
                {contentList.map((item, i) => (
                    <div key={i} className="flex items-center shrink-0">
                        <span
                            className={`text-sm font-medium tracking-wide px-3 py-1 rounded-full whitespace-nowrap ${item.bgColor ? 'shadow-sm' : ''}`}
                            style={{
                                backgroundColor: item.bgColor || 'transparent',
                                color: item.textColor || 'inherit'
                            }}
                        >
                            {item.text}
                        </span>
                        <span className="mx-6 opacity-50 text-[8px]">•</span>
                    </div>
                ))}
            </>
        );

        return (
            <div
                className="w-full overflow-hidden flex items-center relative z-50 border-t border-b"
                style={{
                    backgroundColor: globalBg,
                    color: globalText,
                    height: `${height}px`,
                    borderColor: globalText
                }}
            >
                {/* 
                    The trick: We have TWO identical copies of the content.
                    The animation moves the track by exactly 50% (one copy's worth).
                    When it loops, it's visually identical = seamless infinite scroll.
                */}
                <div className={`marquee-track flex items-center ${isAr ? 'marquee-rtl' : 'marquee-ltr'}`}>
                    {/* First copy */}
                    <div className="flex items-center shrink-0">
                        <MarqueeSet />
                    </div>
                    {/* Second copy (identical) */}
                    <div className="flex items-center shrink-0">
                        <MarqueeSet />
                    </div>
                </div>
            </div>
        );
    }

    // --- FADE RENDER ---
    const currentSlide = slides[currentIndex];
    const content = (locale === 'ar' && currentSlide.content_ar) ? currentSlide.content_ar : currentSlide.content;
    const activeBg = currentSlide.background_color || globalBg;
    const activeText = currentSlide.text_color || globalText;

    return (
        <motion.div
            className="w-full overflow-hidden flex items-center justify-center relative z-50 transition-colors duration-500 border-t border-b"
            animate={{
                backgroundColor: activeBg,
                color: activeText,
                borderColor: activeText
            }}
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
