'use client';

import { useEffect, useState, useRef } from 'react';
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
    const [contentWidth, setContentWidth] = useState(0);
    const measureRef = useRef<HTMLDivElement>(null);

    // Default settings
    const globalBg = settings?.background_color || '#5B21B6';
    const globalText = settings?.text_color || '#FFFFFF';
    const height = settings?.height || 40;
    const isActive = settings?.is_active ?? true;
    const animation = settings?.animation || 'marquee';

    const isAr = locale === 'ar';

    // Measure content width
    useEffect(() => {
        if (animation !== 'marquee' || !measureRef.current) return;

        const measure = () => {
            if (measureRef.current) {
                setContentWidth(measureRef.current.scrollWidth);
            }
        };

        setTimeout(measure, 100);
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [animation, slides]);

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

        // Repeat content many times to fill screen
        const repeatedContent = Array(20).fill(contentList).flat();

        // Animation: we move exactly by half the total width
        // The content is duplicated so when we reach -50%, it looks identical to 0%
        const animationDuration = 28.6; // Slowed to 70% speed

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
                {/* Measure the first half width */}
                <div
                    ref={measureRef}
                    className="absolute opacity-0 pointer-events-none flex items-center"
                    aria-hidden="true"
                >
                    {repeatedContent.map((item, i) => (
                        <div key={i} className="flex items-center shrink-0">
                            <span className="text-sm font-medium tracking-wide px-3 py-1 whitespace-nowrap">
                                {item.text}
                            </span>
                            <span className="mx-6 opacity-50 text-[8px]">•</span>
                        </div>
                    ))}
                </div>

                {/* Animated track */}
                <motion.div
                    className="flex items-center whitespace-nowrap"
                    style={{ width: 'max-content' }}
                    animate={{
                        x: isAr
                            ? [0, contentWidth / 2]   // Arabic: move right (content appears from left)
                            : [0, -contentWidth / 2]  // English: move left (content appears from right)
                    }}
                    transition={{
                        x: {
                            duration: animationDuration,
                            ease: "linear",
                            repeat: Infinity,
                            repeatType: "loop"
                        }
                    }}
                >
                    {/* First copy */}
                    {repeatedContent.map((item, i) => (
                        <div key={`a-${i}`} className="flex items-center shrink-0">
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
                    {/* Second copy (identical - for seamless loop) */}
                    {repeatedContent.map((item, i) => (
                        <div key={`b-${i}`} className="flex items-center shrink-0">
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
                </motion.div>
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
