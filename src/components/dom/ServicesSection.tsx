import { useState } from 'react'
import { useStore } from '../../stores/useStore'

// CONFIGURABLE CONTENT FOR SERVICES (10 Categories)
const SERVICES_DATA = [
    {
        id: 'ill',
        title: 'ILLUSTRAZIONE',
        desc: 'Digital Art & Vectors',
        lining: 'Custom Assets',
        details: 'Creazione di illustrazioni su misura per editoria, web e brand. Disegni originali che raccontano la tua storia.',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
        accentColor: '#FF3366',
    },
    {
        id: 'vet',
        title: 'VETRINA',
        desc: 'Visual Merchandising',
        lining: 'Window Displays',
        details: 'Progettazione grafica e allestimento visivo per vetrine commerciali. Cattura l\'attenzione dei passanti dal primo sguardo.',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop',
        accentColor: '#00D0FF',
    },
    {
        id: 'ins',
        title: 'INSEGNA',
        desc: 'Storefront Identity',
        lining: 'Signage Design',
        details: 'Design di insegne luminose, a bandiera o flat. Massima visibilità e coerenza con l\'identità del tuo locale.',
        image: 'https://images.unsplash.com/photo-1555620864-7fc433c2a15c?q=80&w=1200&auto=format&fit=crop',
        accentColor: '#FFD700',
    },
    {
        id: 'smm',
        title: 'SOCIAL MEDIA',
        desc: 'Content Creation',
        lining: 'Feed Graphics',
        details: 'Grafiche accattivanti, caroselli e template per i tuoi canali social. Strategia visiva per aumentare engagement.',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200&auto=format&fit=crop',
        accentColor: '#833AB4',
    },
    {
        id: 'vid',
        title: 'VIDEOMAKING',
        desc: 'Motion Graphics',
        lining: 'Reels & Promo',
        details: 'Montaggio video, animazioni grafiche e contenuti brevi per promuovere prodotti o eventi dinamici.',
        image: 'https://images.unsplash.com/photo-1535016120720-40c746a51d47?q=80&w=1200&auto=format&fit=crop',
        accentColor: '#FC466B',
    },
    {
        id: 'web',
        title: 'SITO WEB',
        desc: 'UI/UX Design',
        lining: 'Web Layouts',
        details: 'Progettazione grafica di layout web moderni. Dall\'architettura delle informazioni al mock-up interattivo.',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
        accentColor: '#E2FF00',
    },
    {
        id: 'mur',
        title: 'MURALES',
        desc: 'Wall Graphics',
        lining: 'Street Art',
        details: 'Progettazioni grafiche in grande scala per muri interni ed esterni. Trasforma spazi anonimi in opere d\'arte.',
        image: 'https://images.unsplash.com/photo-1499803270242-467f7011d670?q=80&w=1200&auto=format&fit=crop',
        accentColor: '#00FF87',
    },
    {
        id: 'vol',
        title: 'VOLANTINI',
        desc: 'Print Design',
        lining: 'Flyers & Posters',
        details: 'Impaginazione e veste grafica per volantini, locandine, brochure. Design progettato per la stampa perfetta.',
        image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=1200&auto=format&fit=crop',
        accentColor: '#FF5E62',
    },
    {
        id: 'stg',
        title: 'STAMPE E GADGET',
        desc: 'Merchandising',
        lining: 'Stickers & Promo',
        details: 'Grafiche vettoriali pronte per la stampa di adesivi, magliette, spille e materiale promozionale per fiere.',
        image: 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?q=80&w=1200&auto=format&fit=crop',
        accentColor: '#56CCF2',
    },
    {
        id: 'cns',
        title: 'CONSULENZA',
        desc: 'Site Specific Design',
        lining: 'Identity Strategy',
        details: 'Consulenza generale per l\'identità visiva della tua attività. Progettazione partecipata e integrata nello spazio fisico.',
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
        accentColor: '#B0C4DE',
    }
]

export function ServicesSection() {
    const scrollY = useStore((state) => state.scrollY)
    const [activeIndex, setActiveIndex] = useState(0)

    // Scroll visibility logic
    const enterStart = 300
    const enterEnd = 700
    const exitStart = 1000
    const exitEnd = 1400

    const checkRange = (scroll: number, start: number, end: number) => {
        if (scroll < start) return 0
        if (scroll > end) return 1
        return (scroll - start) / (end - start)
    }

    const enterCurve = checkRange(scrollY, enterStart, enterEnd)
    const exitCurve = 1 - checkRange(scrollY, exitStart, exitEnd)
    const opacity = enterCurve * exitCurve
    const parallaxY = (scrollY - 800) * 0.1

    if (opacity <= 0) return null

    const currentService = SERVICES_DATA[activeIndex]

    const nextSlide = () => {
        setActiveIndex((prev) => (prev + 1) % SERVICES_DATA.length)
    }

    const prevSlide = () => {
        setActiveIndex((prev) => (prev - 1 + SERVICES_DATA.length) % SERVICES_DATA.length)
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: opacity > 0.5 ? 'auto' : 'none',
            opacity,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'opacity 0.2s ease-out'
        }}>

            {/* Background Texture Overlay (The wavy white background) */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=2000&auto=format&fit=crop")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.15, // Subtle to not overpower HUD
                    zIndex: -1,
                    mixBlendMode: 'screen'
                }}
            />

            {/* Main Moonish Container */}
            <div
                className="relative flex flex-col items-center justify-between w-[95vw] md:w-[85vw] max-w-7xl h-[85vh] md:h-[80vh] rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 overflow-hidden"
                style={{
                    transform: `translateY(${-parallaxY}px)`,
                    backdropFilter: 'blur(24px)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
            >
                {/* 1. TOP HEADER BAR */}
                <div className="w-full flex justify-between items-center text-white/50 font-mono text-xs uppercase tracking-widest z-10 px-4">
                    <div className="flex gap-8">
                        <span className="text-white font-bold hidden md:inline-block">ARTISMI</span>
                        <span className="hidden md:inline-block hover:text-white cursor-pointer transition-colors">Digital</span>
                        <span className="hidden md:inline-block hover:text-white cursor-pointer transition-colors">Physical</span>
                    </div>
                    <div>
                        SERVICES // 2026
                    </div>
                </div>

                {/* 2. MAIN CONTENT AREA */}
                <div className="flex-1 w-full flex flex-col md:flex-row relative z-10 my-4 md:my-0 gap-6 md:gap-0">

                    {/* GIANT NUMBER BACKGROUND */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[15rem] md:text-[25rem] font-black leading-none opacity-5 tracking-tighter select-none pointer-events-none transition-all duration-700">
                        {String(activeIndex + 1).padStart(2, '0')}
                    </div>

                    {/* LEFT SIDE: "Sticker" Card (Moonish Style Detail Panel) */}
                    <div className="w-full md:w-1/3 flex items-center justify-center relative z-20 order-2 md:order-1">
                        <div className="w-full max-w-[300px] p-6 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl transition-all duration-700">

                            {/* Accent Dot */}
                            <div
                                className="w-3 h-3 rounded-full mb-6 transition-colors duration-700 shadow-[0_0_15px_currentColor]"
                                style={{ color: currentService.accentColor, backgroundColor: currentService.accentColor }}
                            />

                            <h4 className="text-white font-black text-2xl uppercase tracking-tight mb-2">
                                {currentService.title}
                            </h4>

                            <p className="text-white/40 font-mono text-xs uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                                {currentService.desc}
                            </p>

                            <p className="text-white/70 text-sm leading-relaxed mb-6 font-medium">
                                {currentService.details}
                            </p>

                            {/* Tech Specs Block */}
                            <div className="flex flex-col gap-2 font-mono text-[10px] uppercase text-white/30 bg-black/20 p-4 rounded-xl">
                                <div className="flex justify-between">
                                    <span>Category</span>
                                    <span className="text-white/60 text-right">{currentService.lining}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Method</span>
                                    <span className="text-white/60 text-right">Site Specific</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: The Bubble / Floating Image */}
                    <div className="w-full md:w-2/3 h-[250px] md:h-full flex items-center justify-center relative order-1 md:order-2">
                        {/* The Large Sphere/Bubble Mask */}
                        <div
                            key={`img-${currentService.id}`}
                            className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full overflow-hidden shadow-2xl transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] animate-in fade-in zoom-in-95"
                            style={{
                                boxShadow: `0 30px 80px -20px ${currentService.accentColor}40`
                            }}
                        >
                            <img
                                src={currentService.image}
                                alt={currentService.title}
                                className="w-full h-full object-cover"
                            />
                            {/* Inner Glass Shadow / Shine to make it look like a bubble */}
                            <div className="absolute inset-0 rounded-full border border-white/20 shadow-[inset_0_0_50px_rgba(255,255,255,0.1)] pointer-events-none" />
                            <div className="absolute top-[10%] left-[15%] w-[30%] h-[15%] bg-white/20 blur-[20px] rounded-full transform -rotate-45 pointer-events-none" />
                        </div>

                        {/* Floating Labels over image */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 pointer-events-none">
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: currentService.accentColor }}
                            />
                            <span className="text-white font-mono text-xs uppercase tracking-widest font-bold">
                                {currentService.title}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. BOTTOM PILL NAVIGATION */}
                <div className="w-full max-w-lg mt-0 md:mt-4 p-2 rounded-full backdrop-blur-md bg-white/5 border border-white/10 flex items-center justify-between z-20">

                    <button
                        onClick={prevSlide}
                        className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all group"
                    >
                        <svg className="w-4 h-4 text-white/50 group-hover:text-white group-hover:-translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-white font-mono text-[10px] uppercase tracking-[0.2em] mb-1">
                            SERVICE {String(activeIndex + 1).padStart(2, '0')} OF {SERVICES_DATA.length}
                        </div>
                        {/* Progress Dots */}
                        <div className="flex gap-2">
                            {SERVICES_DATA.map((_, idx) => (
                                <div
                                    key={idx}
                                    className="h-1 rounded-full transition-all duration-300"
                                    style={{
                                        width: idx === activeIndex ? '16px' : '4px',
                                        backgroundColor: idx === activeIndex ? currentService.accentColor : 'rgba(255,255,255,0.2)'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={nextSlide}
                        className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all group"
                    >
                        <svg className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>

                </div>

            </div>
        </div>
    )
}
