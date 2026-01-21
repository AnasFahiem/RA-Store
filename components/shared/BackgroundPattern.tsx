'use client';

export default function BackgroundPattern() {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.05] overflow-hidden" aria-hidden="true">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="gym-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        {/* Dumbbell */}
                        <g transform="translate(10, 10) scale(0.5)" fill="currentColor">
                            <rect x="2" y="8" width="6" height="14" rx="1" />
                            <rect x="22" y="8" width="6" height="14" rx="1" />
                            <rect x="8" y="13" width="14" height="4" rx="1" />
                        </g>
                        {/* Weight Plate */}
                        <g transform="translate(60, 40) scale(0.5)" stroke="currentColor" fill="none" strokeWidth="2">
                            <circle cx="15" cy="15" r="12" />
                            <circle cx="15" cy="15" r="4" />
                        </g>
                        {/* Kettlebell */}
                        <g transform="translate(20, 60) scale(0.5)" fill="currentColor">
                            <path d="M10 2 A 8 8 0 0 1 20 2 L 22 4 L 8 4 Z" />
                            <circle cx="15" cy="18" r="10" />
                        </g>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gym-pattern)" className="text-foreground" />
            </svg>
        </div>
    );
}
