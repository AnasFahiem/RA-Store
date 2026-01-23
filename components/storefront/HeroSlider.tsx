'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import heroBg from '../../public/hero-bg.jpg';

interface HeroSlide {
    id: string;
    image_url: string;
    sort_order: number;
}

interface HeroSliderProps {
    slides: HeroSlide[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
    const t = useTranslations('Home');
    const [showIntro, setShowIntro] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isSliderActive, setIsSliderActive] = useState(false);

    // Default to a placeholder if no slides exist, but try to use the first slide (which should be the seeded default)
    const safeSlides = slides.length > 0 ? slides : [{ id: 'default', image_url: heroBg.src, sort_order: 1 }];

    // Intro timer
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowIntro(false);
            // Start slider slightly after text starts fading to avoid too much happening at once, 
            // or immediately. Let's start it immediately after intro state change so it feels responsive.
            setIsSliderActive(true);
        }, 10000); // 10 seconds

        return () => clearTimeout(timer);
    }, []);

    // Slider interval
    useEffect(() => {
        if (!isSliderActive || safeSlides.length <= 1) return;

        // Immediately move to next slide? No, wait for interval.
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % safeSlides.length);
        }, 5000); // 5 seconds per slide

        return () => clearInterval(interval);
    }, [isSliderActive, safeSlides.length]);

    return (
        <section className="relative bg-black text-white overflow-hidden h-[90vh] flex items-center justify-center">

            {/* Background Layer - Always Active */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode='popLayout'>
                    <motion.div
                        key={safeSlides[currentSlide].id || currentSlide} // Key by ID to trigger animation on change
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }} // Smooth crossfade
                        className="absolute inset-0"
                    >
                        <Image
                            src={safeSlides[currentSlide].image_url}
                            alt="Hero Background"
                            fill
                            className="object-cover"
                            priority
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Gradient Overlay - Static */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none" />
            </div>

            {/* Intro Content Layer - Fades out / Slides up */}
            <AnimatePresence>
                {showIntro && (
                    <motion.div
                        className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-12 text-center"
                        initial={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }} // Slide up and fade out
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h1 className="text-6xl md:text-8xl font-bold font-heading uppercase tracking-tighter leading-none mb-6">
                                {t('heroTitlePre')} <br />
                                <span className="text-accent">{t('heroTitleAccent')}</span>
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="mt-4 text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto font-light"
                        >
                            {t('heroSubtitle')}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Link
                                href="/bundler"
                                className="px-8 py-4 bg-accent text-white text-lg font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
                            >
                                {t('buildBundle')}
                            </Link>
                            <Link
                                href="/products"
                                className="px-8 py-4 border-2 border-white text-white text-lg font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
                            >
                                {t('shopAll')}
                            </Link>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
