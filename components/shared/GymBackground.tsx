'use client';

import { useEffect, useState } from 'react';
import { Dumbbell, Disc, Activity, Zap } from 'lucide-react';

export default function GymBackground() {
    const [icons, setIcons] = useState<{ id: number; x: number; y: number; rotate: number; scale: number; Icon: any }[]>([]);

    useEffect(() => {
        // Generate random icons with collision detection
        const iconTypes = [Dumbbell, Disc, Activity, Zap];
        const count = 15; // Slightly reduced count for better spacing
        const newIcons: { id: number; x: number; y: number; rotate: number; scale: number; Icon: any }[] = [];
        const minDistance = 18; // Minimum % distance between icons

        let attempts = 0;
        const maxAttempts = 1000;

        while (newIcons.length < count && attempts < maxAttempts) {
            attempts++;
            const x = Math.random() * 90 + 5; // Keep away from extreme edges (5-95%)
            const y = Math.random() * 90 + 5;

            // Check collision with existing icons
            const hasCollision = newIcons.some(icon => {
                const dx = icon.x - x;
                const dy = icon.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance < minDistance;
            });

            if (!hasCollision) {
                newIcons.push({
                    id: newIcons.length,
                    x,
                    y,
                    rotate: Math.random() * 360,
                    scale: 0.8 + Math.random() * 0.5, // 0.8 to 1.3
                    Icon: iconTypes[Math.floor(Math.random() * iconTypes.length)],
                });
            }
        }
        setIcons(newIcons);
    }, []);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {icons.map(({ id, x, y, rotate, scale, Icon }) => (
                <div
                    key={id}
                    className="absolute text-foreground transition-colors duration-300"
                    style={{
                        top: `${y}%`,
                        left: `${x}%`,
                        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
                    }}
                >
                    <Icon strokeWidth={1.5} className="w-16 h-16 sm:w-24 sm:h-24 opacity-10 dark:opacity-20" />
                </div>
            ))}

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/40 to-background/90" />
        </div>
    );
}
