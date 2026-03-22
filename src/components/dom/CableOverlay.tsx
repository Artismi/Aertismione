import React, { useEffect, useRef, useState } from 'react';

// --- TYPES ---
interface Point { x: number; y: number }

interface CableOverlayProps {
    buttonPositions: Record<string, Point>;
    avatarPointsRef: React.MutableRefObject<any[]>;
    activeRoute: string | null;
    transmissionNonce: number;
    onArrive: (menuId: string) => void;
}

// --- CONFIGURATION ---
const ANIMATION_DURATION = 1100;
const STAGGER_DELAY = 90;
const MAX_BULLETS = 3;

const PACKET_LOOKAHEAD = 50;
const PACKET_OFFSET_SIDE = 20;
const BEAM_LENGTH = 16;
const BEAM_WIDTH_BASE = 2.0;

const COLORS = {
    beamCore: '#FFFFFF',
    beamGlow: '#E0FFFF',
    particle: '#FF69B4',
    packetBorder: '#FFFFFF',
    packetBg: 'rgba(0, 0, 0, 0.9)',
    code: '#D050FF',
    tether: 'rgba(255, 255, 255, 0.4)',
    interconnect: 'rgba(255, 255, 255, 0.6)'
};

// --- UTILS ---
const getRandomizedBezier = (start: Point, end: Point) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const noiseMagnitude = Math.min(dist * 0.5, 120);

    const cp1x = start.x + dx * 0.33 + (Math.random() - 0.5) * noiseMagnitude;
    const cp1y = start.y + dy * 0.33 + (Math.random() - 0.5) * noiseMagnitude;
    const cp2x = start.x + dx * 0.66 + (Math.random() - 0.5) * noiseMagnitude;
    const cp2y = start.y + dy * 0.66 + (Math.random() - 0.5) * noiseMagnitude;

    return `M ${start.x},${start.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${end.x},${end.y}`;
};

const generateCodeLines = (count: number) => {
    return Array.from({ length: count }).map(() =>
        Math.random().toString(16).substring(2, 6).toUpperCase()
    );
};

export default function CableOverlay({
    buttonPositions,
    avatarPointsRef,
    activeRoute,
    transmissionNonce,
    onArrive
}: CableOverlayProps) {

    const bulletRefs = useRef(
        Array.from({ length: MAX_BULLETS }).map(() => ({
            path: null as SVGPathElement | null,
            beam: null as SVGPathElement | null,
            packetGroup: null as SVGGElement | null,
            tether: null as SVGLineElement | null,
            codeBlock: null as SVGTextElement | null,
        }))
    );


    const particleContainerRef = useRef<SVGGElement>(null);
    const animRef = useRef<number>(0);

    const activeBulletsRef = useRef<Array<{
        active: boolean;
        startTime: number;
        pathLength: number;
        codeScroll: number;
        completed: boolean;
    }>>([]);

    const physicsState = useRef({
        particles: Array.from({ length: 60 }).map(() => ({
            x: 0, y: 0, vx: 0, vy: 0, life: 0, scale: 0, active: false
        })),
    });

    const [codeLines] = useState(() => generateCodeLines(8));
    const routeRef = useRef<string | null>(null);

    // Initialize bullets when route changes
    useEffect(() => {
        if (activeRoute && buttonPositions[activeRoute]) {
            const start = buttonPositions[activeRoute];
            const target = avatarPointsRef.current.find(p => p.id === 'center');

            if (start && target) {
                routeRef.current = activeRoute;
                const now = performance.now();

                activeBulletsRef.current = Array.from({ length: 3 }).map((_, i) => {
                    const d = getRandomizedBezier(start, target);
                    if (bulletRefs.current[i].path) {
                        bulletRefs.current[i].path!.setAttribute('d', d);
                    }
                    return {
                        active: true,
                        startTime: now + (i * STAGGER_DELAY),
                        pathLength: 0,
                        codeScroll: Math.random() * -50,
                        completed: false
                    };
                });
            }
        }
    }, [activeRoute, transmissionNonce, buttonPositions, avatarPointsRef]);

    // Main animation loop
    useEffect(() => {
        const animate = (now: number) => {
            let anyActive = false;
            const currentFramePositions: Record<number, { x: number, y: number, opacity: number } | null> = { 0: null, 1: null, 2: null };

            activeBulletsRef.current.forEach((bullet, index) => {
                if (!bullet.active || bullet.completed) return;
                if (now < bullet.startTime) { anyActive = true; return; }

                const refs = bulletRefs.current[index];
                if (refs.path && refs.beam && refs.packetGroup) {
                    anyActive = true;
                    if (bullet.pathLength === 0) bullet.pathLength = refs.path.getTotalLength();

                    const rawProgress = Math.min((now - bullet.startTime) / ANIMATION_DURATION, 1.0);
                    const ease = 1 - Math.pow(1 - rawProgress, 3);
                    const currentDist = bullet.pathLength * ease;
                    const isVaporizing = rawProgress > 0.85;

                    const pCenter = refs.path.getPointAtLength(currentDist);
                    currentFramePositions[index] = {
                        x: pCenter.x,
                        y: pCenter.y,
                        opacity: isVaporizing ? (1 - (rawProgress - 0.85) / 0.15) : 1
                    };

                    // Update beam (wedge of light)
                    const pTail = refs.path.getPointAtLength(Math.max(0, currentDist - BEAM_LENGTH));
                    const pHead = refs.path.getPointAtLength(Math.min(bullet.pathLength, currentDist + PACKET_LOOKAHEAD));

                    // Calculate perpendicular for wedge shape
                    const dx = pHead.x - pTail.x;
                    const dy = pHead.y - pTail.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const perpX = -dy / len;
                    const perpY = dx / len;

                    const widthAtTail = BEAM_WIDTH_BASE;
                    const widthAtHead = BEAM_WIDTH_BASE * 3;

                    const p1 = { x: pTail.x + perpX * widthAtTail, y: pTail.y + perpY * widthAtTail };
                    const p2 = { x: pTail.x - perpX * widthAtTail, y: pTail.y - perpY * widthAtTail };
                    const p3 = { x: pHead.x - perpX * widthAtHead, y: pHead.y - perpY * widthAtHead };
                    const p4 = { x: pHead.x + perpX * widthAtHead, y: pHead.y + perpY * widthAtHead };

                    refs.beam.setAttribute('d', `M ${p1.x},${p1.y} L ${p2.x},${p2.y} L ${p3.x},${p3.y} L ${p4.x},${p4.y} Z`);
                    refs.beam.style.opacity = String(currentFramePositions[index]!.opacity * 0.8);

                    // Update packet position
                    const pPacket = refs.path.getPointAtLength(Math.min(bullet.pathLength, currentDist + PACKET_OFFSET_SIDE));
                    refs.packetGroup.setAttribute('transform', `translate(${pPacket.x}, ${pPacket.y})`);
                    refs.packetGroup.style.opacity = String(currentFramePositions[index]!.opacity);

                    // Update code scroll
                    bullet.codeScroll += 2;
                    if (refs.codeBlock) {
                        refs.codeBlock.setAttribute('y', String(bullet.codeScroll % 100));
                    }

                    // Spawn particles
                    if (Math.random() < 0.3) {
                        const particle = physicsState.current.particles.find(p => !p.active);
                        if (particle) {
                            particle.x = pCenter.x;
                            particle.y = pCenter.y;
                            particle.vx = (Math.random() - 0.5) * 4;
                            particle.vy = (Math.random() - 0.5) * 4;
                            particle.life = 1.0;
                            particle.scale = Math.random() * 0.5 + 0.5;
                            particle.active = true;
                        }
                    }

                    if (rawProgress >= 1.0) {
                        bullet.completed = true;
                        if (index === 0 && routeRef.current) onArrive(routeRef.current);
                    }
                }
            });

            // Update particles
            physicsState.current.particles.forEach(p => {
                if (!p.active) return;
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                if (p.life <= 0) p.active = false;
            });

            if (anyActive) animRef.current = requestAnimationFrame(animate);
        };

        animRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animRef.current);
    }, [buttonPositions, activeRoute, transmissionNonce, onArrive]);

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
            <defs>
                {/* Glow filter for beam */}
                <filter id="beamGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Gradient for wedge */}
                <linearGradient id="wedgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: COLORS.beamCore, stopOpacity: 0.2 }} />
                    <stop offset="50%" style={{ stopColor: COLORS.beamGlow, stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: COLORS.beamCore, stopOpacity: 1 }} />
                </linearGradient>
            </defs>

            {/* Invisible paths for animation */}
            {bulletRefs.current.map((_, i) => (
                <path
                    key={`path-${i}`}
                    ref={el => { bulletRefs.current[i].path = el }}
                    fill="none"
                    stroke="none"
                />
            ))}

            {/* Beams (wedges of light) */}
            {bulletRefs.current.map((_, i) => (
                <path
                    key={`beam-${i}`}
                    ref={el => { bulletRefs.current[i].beam = el }}
                    fill="url(#wedgeGradient)"
                    stroke={COLORS.beamCore}
                    strokeWidth="0.5"
                    filter="url(#beamGlow)"
                    opacity="0"
                />
            ))}

            {/* Data packets */}
            {bulletRefs.current.map((_, i) => (
                <g
                    key={`packet-${i}`}
                    ref={el => { bulletRefs.current[i].packetGroup = el }}
                    opacity="0"
                >
                    {/* Packet container */}
                    <rect
                        x="-15"
                        y="-12"
                        width="30"
                        height="24"
                        fill={COLORS.packetBg}
                        stroke={COLORS.packetBorder}
                        strokeWidth="1"
                        rx="2"
                    />

                    {/* Scrolling code */}
                    <clipPath id={`clip-${i}`}>
                        <rect x="-13" y="-10" width="26" height="20" />
                    </clipPath>

                    <text
                        ref={el => { bulletRefs.current[i].codeBlock = el }}
                        x="-12"
                        y="0"
                        fontSize="6"
                        fontFamily="monospace"
                        fill={COLORS.code}
                        clipPath={`url(#clip-${i})`}
                    >
                        {codeLines.map((line, idx) => (
                            <tspan key={idx} x="-12" dy="7">{line}</tspan>
                        ))}
                    </text>
                </g>
            ))}

            {/* Particles */}
            <g ref={particleContainerRef}>
                {physicsState.current.particles.map((p, i) => (
                    p.active && (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={p.scale * 2}
                            fill={COLORS.particle}
                            opacity={p.life}
                        />
                    )
                ))}
            </g>
        </svg>
    );
}
