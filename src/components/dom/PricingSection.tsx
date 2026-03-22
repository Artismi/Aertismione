import { Html } from '@react-three/drei'
import { useStore } from '../../stores/useStore'
import { useState } from 'react'

// Positioned to the LEFT of the avatar (X = -25)
const PANEL_POS = [-25, -5, 0] as const

const SERVICES = [
    {
        title: 'Identità Visiva',
        desc: 'Branding & Design Systems',
        price: '550 €',
        details: 'Logo, palette colori, tipografia. Sistema visivo completo per comunicare la tua essenza unica.',
        items: ['Branding completo', 'Logo design', '4 Incontri personalizzati', 'Palette colori', 'Tipografia'],
        gradient: 'from-purple-500/20 via-pink-500/20 to-red-500/20'
    },
    {
        title: 'Siti Web',
        desc: 'Sviluppo & Esperienze Digitali',
        price: '800-1200 €',
        details: 'Siti web interattivi con WebGL, Three.js, React. Esperienze immersive che catturano l\'attenzione.',
        items: ['Design responsive', 'Sviluppo custom', 'Animazioni WebGL', 'SEO ottimizzato', 'Contenuti'],
        gradient: 'from-cyan-500/20 via-blue-500/20 to-purple-500/20'
    },
    {
        title: 'Servizi Creativi',
        desc: 'Design & Media Production',
        price: 'da 80 €',
        details: 'Poster, illustrazioni, social media, gadgets. Ogni progetto è un\'opera d\'arte digitale.',
        items: ['Poster & Cover', 'Social Media (450€/mo)', 'Gadget & Merch (100-200€)', 'Vetrine & Murales', 'Video editing'],
        gradient: 'from-green-500/20 via-emerald-500/20 to-teal-500/20'
    },
]

export function PricingSection() {
    const isServicesOpen = useStore((state) => state.isServicesOpen)
    const setIsServicesOpen = useStore((state) => state.setIsServicesOpen)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    if (!isServicesOpen) return null

    return (
        <group position={PANEL_POS}>
            <Html transform position={[0, 0, 0]} className="pointer-events-auto select-none">
                <div className="w-[1000px] h-[600px] relative">

                    {/* Exit Button */}
                    <button
                        onClick={() => setIsServicesOpen(false)}
                        className="absolute top-4 right-4 z-50 p-2 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white backdrop-blur-md bg-black/20 border border-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-5xl font-mono uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/40 mb-2">
                            Servizi
                        </h2>
                        <p className="text-xs font-mono uppercase tracking-widest text-white/40">
                            [ Hover per esplorare ]
                        </p>
                    </div>

                    {/* Interactive Columns */}
                    <div className="flex gap-3 w-full h-[480px]">
                        {SERVICES.map((service, i) => {
                            const isHovered = hoveredIndex === i
                            const isOtherHovered = hoveredIndex !== null && hoveredIndex !== i

                            return (
                                <div
                                    key={i}
                                    onMouseEnter={() => setHoveredIndex(i)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    className="relative overflow-hidden transition-all duration-700 ease-out cursor-pointer group"
                                    style={{
                                        flex: isHovered ? '2' : isOtherHovered ? '0.5' : '1',
                                        minHeight: '480px'
                                    }}
                                >
                                    {/* Background with gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                                    {/* Glass effect */}
                                    <div className="absolute inset-0 backdrop-blur-xl bg-black/40 border border-white/10 group-hover:border-white/30 transition-all duration-700">
                                        {/* Animated border glow */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="relative h-full flex flex-col justify-between p-6">
                                        {/* Top section - Number & Price */}
                                        <div className="flex justify-between items-start">
                                            <span className="text-5xl font-mono font-bold text-white/10 group-hover:text-white/30 transition-colors duration-700">
                                                0{i + 1}
                                            </span>
                                            <div className={`w-2 h-2 rounded-full bg-white/30 group-hover:bg-cyan-400 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.8)] transition-all duration-700`} />
                                        </div>

                                        {/* Middle section - Title (vertical when collapsed) */}
                                        <div className="flex-1 flex items-center justify-center">
                                            <h3
                                                className="font-mono uppercase tracking-wider transition-all duration-700 text-center font-bold"
                                                style={{
                                                    writingMode: isHovered ? 'horizontal-tb' : 'vertical-rl',
                                                    transform: isHovered ? 'rotate(0deg)' : 'rotate(180deg)',
                                                    fontSize: isHovered ? '1.75rem' : '1.25rem',
                                                    color: isHovered ? '#ffffff' : '#ffffff80',
                                                    textShadow: isHovered ? '0 0 30px rgba(255,255,255,0.5)' : 'none'
                                                }}
                                            >
                                                {service.title}
                                            </h3>
                                        </div>

                                        {/* Bottom section - Details (only visible on hover) */}
                                        <div
                                            className="space-y-3 transition-all duration-700"
                                            style={{
                                                opacity: isHovered ? 1 : 0,
                                                transform: isHovered ? 'translateY(0)' : 'translateY(20px)',
                                                pointerEvents: isHovered ? 'auto' : 'none'
                                            }}
                                        >
                                            <div className="h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                                            {/* Price */}
                                            <div className="text-center">
                                                <span className="text-2xl font-mono font-bold text-cyan-300">
                                                    {service.price}
                                                </span>
                                            </div>

                                            <p className="font-mono text-xs text-cyan-300/80 uppercase tracking-widest text-center">
                                                {service.desc}
                                            </p>

                                            <p className="font-mono text-xs text-white/60 leading-relaxed text-center">
                                                {service.details}
                                            </p>

                                            {/* Items list */}
                                            <div className="space-y-1 pt-2">
                                                {service.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-[10px] text-white/50 font-mono">
                                                        <div className="w-1 h-1 bg-cyan-400/50 rounded-full" />
                                                        <span>{item}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Decorative corner brackets */}
                                            <div className="absolute bottom-6 right-6 w-6 h-6 border-r-2 border-b-2 border-white/20" />
                                            <div className="absolute top-6 left-6 w-6 h-6 border-l-2 border-t-2 border-white/20" />
                                        </div>
                                    </div>

                                    {/* Scanline effect */}
                                    <div
                                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-20 transition-opacity duration-700"
                                        style={{
                                            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
                                        }}
                                    />
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 text-center text-[10px] font-mono uppercase text-white/30 tracking-widest">
                        Contattami per preventivi personalizzati
                    </div>
                </div>
            </Html>
        </group>
    )
}
