export default function MatrixSymmetricalFrame() {
    return (
        <div className="fixed inset-0 z-[200] pointer-events-none select-none overflow-hidden font-mono">
            <svg className="w-full h-full absolute inset-0">
                <defs>
                    <linearGradient id="matrix-base" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#001a00" />
                        <stop offset="15%" stopColor="#003b00" />
                        <stop offset="85%" stopColor="#003b00" />
                        <stop offset="100%" stopColor="#001a00" />
                    </linearGradient>

                    <linearGradient id="rubber-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0a0a0a" />
                        <stop offset="20%" stopColor="#1a1a1a" />
                        <stop offset="80%" stopColor="#1a1a1a" />
                        <stop offset="100%" stopColor="#0a0a0a" />
                    </linearGradient>

                    <radialGradient id="screw-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#00FF41" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#000" />
                    </radialGradient>

                    <pattern id="grip-texture" x="0" y="0" width="10" height="4" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="100%" height="2" fill="#000" opacity="0.9" />
                        <rect x="0" y="2" width="100%" height="1" fill="#00FF41" opacity="0.1" />
                    </pattern>

                    <mask id="screen-mask-wide">
                        <rect width="100%" height="100%" fill="white" />
                        <rect
                            rx="24" fill="black"
                            style={{
                                x: '22px',
                                y: '22px',
                                width: 'calc(100% - 44px)',
                                height: 'calc(100% - 44px)'
                            }}
                        />
                    </mask>
                </defs>

                <g mask="url(#screen-mask-wide)">
                    {/* Base Background */}
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#matrix-base)" />

                    {/* Top Bar - Split into rect and paths to avoid % in d attribute */}
                    <rect x="0" y="0" width="100%" height="60" fill="#000" />
                    <g style={{ transform: 'translate(0, 60px)' }}>
                        {/* Left corner curve */}
                        <path d="M 0 0 Q 0 10 10 10 H 90 Q 100 10 100 0 Z" fill="#000" />
                        {/* Right corner curve (flipped or mirrored if needed, but here we just repeat or use a wide path) */}
                        <g style={{ transform: 'translateX(100%)' }}>
                            <path d="M 0 0 Q 0 10 -10 10 H -90 Q -100 10 -100 0 Z" fill="#000" />
                        </g>
                    </g>

                    {/* Bottom Bar */}
                    <rect width="100%" height="60" fill="#000" style={{ y: 'calc(100% - 60px)' }} />
                    <g style={{ transform: 'translateY(calc(100% - 60px))' }}>
                        <path d="M 0 0 Q 0 -10 10 -10 H 90 Q 100 -10 100 0 Z" fill="#000" />
                        <g style={{ transform: 'translateX(100%)' }}>
                            <path d="M 0 0 Q 0 -10 -10 -10 H -90 Q -100 -10 -100 0 Z" fill="#000" />
                        </g>
                    </g>

                    {/* Inner Glow Border */}
                    <g opacity="0.4">
                        <rect
                            rx="36" fill="none" stroke="#00FF41" strokeWidth="2"
                            style={{
                                x: '6.5px',
                                y: '6.5px',
                                width: 'calc(100% - 13px)',
                                height: 'calc(100% - 13px)'
                            }}
                        />
                    </g>

                    {/* Left Grip */}
                    <g style={{ transform: 'translateY(calc(50% - 70px))' }}>
                        <path d="M 0 0 H 12 Q 16 0 16 4 V 136 Q 16 140 12 140 H 0 Z" fill="url(#rubber-grad)" />
                        <path d="M 0 4 H 12 V 136 H 0 Z" fill="url(#grip-texture)" opacity="0.5" />
                    </g>

                    {/* Right Grip */}
                    <g style={{ transform: 'translate(calc(100% - 16px), calc(50% - 70px))' }}>
                        <path d="M 16 0 H 4 Q 0 0 0 4 V 136 Q 0 140 4 140 H 16 Z" fill="url(#rubber-grad)" />
                        <path d="M 4 4 H 16 V 136 H 4 Z" fill="url(#grip-texture)" opacity="0.5" />
                    </g>
                </g>

                {/* Screws */}
                <circle cy="70" r="5" fill="url(#screw-grad)" stroke="#00FF41" strokeWidth="0.5" style={{ cx: '32px' }} />
                <circle cy="70" r="5" fill="url(#screw-grad)" stroke="#00FF41" strokeWidth="0.5" style={{ cx: 'calc(100% - 32px)' }} />
                <circle r="5" fill="url(#screw-grad)" stroke="#00FF41" strokeWidth="0.5" style={{ cx: '32px', cy: 'calc(100% - 70px)' }} />
                <circle r="5" fill="url(#screw-grad)" stroke="#00FF41" strokeWidth="0.5" style={{ cx: 'calc(100% - 32px)', cy: 'calc(100% - 70px)' }} />

                {/* Screen Bezel */}
                <rect
                    rx="24" fill="none" stroke="#00FF41" strokeWidth="1" opacity="0.3"
                    style={{
                        x: '22px',
                        y: '22px',
                        width: 'calc(100% - 44px)',
                        height: 'calc(100% - 44px)'
                    }}
                />
            </svg>
        </div>
    );
}
