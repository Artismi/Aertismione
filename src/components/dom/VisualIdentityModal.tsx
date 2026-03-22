import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

interface VisualIdentityModalProps {
    isOpen: boolean
    onClose: () => void
}

const SECTIONS = [
    {
        title: "Identità Visiva",
        subtitle: "Per attività, spazi e progetti strutturati",
        price: "550 €",
        description: "Quando si lavora su un’attività, uno spazio o un progetto continuativo, il punto di partenza è l’identità visiva. È ciò che permette di comunicare in modo chiaro e di mantenere coerenza nel tempo. L’identità viene sviluppata attraverso un percorso di coprogettazione.",
        details: [
            "4 incontri di coprogettazione",
            "Definizione di valori, tono e pubblico",
            "Concept e direzione visiva",
            "Identità grafica illustrata",
            "Colori, tipografie e sistema visivo base",
            "Prime applicazioni (social e stampa)"
        ]
    },
    {
        title: "Lavori Singoli",
        subtitle: "Per persone, artisti e interventi puntuali",
        price: "da 80 – 100 €",
        description: "Se il progetto è un intervento specifico (un disegno, un poster, un murales, un artwork), è possibile lavorare anche senza sviluppare un’identità completa.",
        details: [
            "Illustrazioni e disegni originali",
            "Poster, flyer e materiali stampati",
            "Artwork e copertine",
            "Contenuti grafici per social media"
        ]
    },
    {
        title: "Spazio e Superfici",
        subtitle: "Interventi fisici",
        price: "Su preventivo",
        description: "Artismi lavora anche nello spazio fisico, progettando immagini pensate per dialogare con i luoghi. Per interventi su spazi e luoghi è sempre prevista una fase progettuale.",
        details: [
            "Vetrine e vetrofanie",
            "Insegne",
            "Murales artistici e site-specific"
        ]
    },
    {
        title: "Gadget e Materiali",
        subtitle: "Progettazione grafica su supporti",
        price: "100 – 200 € (progettazione)",
        description: "Progettazione grafica di materiali e oggetti personalizzati, realizzati in collaborazione con fornitori esterni. Costi di produzione esclusi.",
        details: [
            "Concept e grafica",
            "Adattamento ai supporti",
            "Coordinamento della produzione",
            "Esempi: t-shirt, stampe, spille, bicchieri",
        ]
    },
    {
        title: "Social Media Management",
        subtitle: "Con videomaking incluso",
        price: "450 € / mese",
        note: "(minimo 3 mesi)",
        description: "Oggi i contenuti video sono fondamentali per ottenere visibilità. Per questo il videomaking è parte integrante della gestione social.",
        details: [
            "Impostazione visiva",
            "Riprese video settimanali",
            "Montaggio di contenuti brevi",
            "Pubblicazione e programmazione",
            "Coerenza con l’immagine del progetto"
        ]
    },
    {
        title: "Siti Web",
        subtitle: "Progettazione e realizzazione",
        price: "800 – 1.200 €",
        description: "Artismi realizza siti web su misura, coerenti con l’identità visiva del progetto.",
        details: [
            "Progettazione grafica e struttura",
            "Sviluppo e layout responsive",
            "Integrazione contenuti testuali e immagini",
            "Eventuale collegamento a social/newsletter"
        ]
    }
]

export function VisualIdentityModal({ isOpen, onClose }: VisualIdentityModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const [shouldRender, setShouldRender] = useState(isOpen)

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true)
            // Animate In
            const timer = setTimeout(() => {
                if (modalRef.current && contentRef.current) {
                    gsap.to(modalRef.current, { opacity: 1, duration: 0.3 })
                    gsap.fromTo(contentRef.current,
                        { scale: 0.9, opacity: 0 },
                        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.2)' }
                    )
                }
            }, 10)
            return () => clearTimeout(timer)
        } else {
            // Animate Out
            if (modalRef.current && contentRef.current) {
                gsap.to(modalRef.current, { opacity: 0, duration: 0.3 })
                gsap.to(contentRef.current, {
                    scale: 0.9,
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => setShouldRender(false)
                })
            } else {
                setShouldRender(false)
            }
        }
    }, [isOpen])

    if (!shouldRender) return null

    return (
        <div
            ref={modalRef}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm opacity-0 pointer-events-auto"
            onClick={onClose}
        >
            <div
                ref={contentRef}
                className="relative w-full max-w-6xl bg-black/90 border border-white/20 rounded-lg shadow-2xl overflow-hidden my-4 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-black/95 backdrop-blur shrink-0">
                    <div>
                        <h2 className="text-3xl font-mono text-white tracking-tighter uppercase">Listino Servizi</h2>
                        <p className="text-gray-400 font-mono text-sm">Design, Identità e Comunicazione</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
                    >
                        {/* Close Icon SVG */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar">
                    {SECTIONS.map((section, index) => (
                        <div
                            key={index}
                            className="flex flex-col h-full bg-white/5 border border-white/10 rounded-md p-6 hover:border-accent/50 transition-colors duration-300"
                        >
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-accent font-mono uppercase leading-tight mb-2 h-12 flex items-center">{section.title}</h3>
                                <p className="text-xs text-gray-400 font-mono uppercase border-b border-white/10 pb-2">{section.subtitle}</p>
                            </div>

                            <div className="flex-grow">
                                <p className="text-sm text-gray-300 mb-4 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">
                                    {section.description}
                                </p>

                                <ul className="space-y-2 mb-6">
                                    {section.details.map((item, i) => (
                                        <li key={i} className="flex items-start text-xs text-gray-400 font-mono">
                                            <span className="mr-2 text-accent mt-1">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-4 mt-auto border-t border-white/10">
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-gray-500 font-mono uppercase">Costo indicativo</span>
                                    <span className="text-2xl font-bold text-white font-mono">{section.price}</span>
                                    {section.note && (
                                        <span className="text-xs text-gray-400 italic">{section.note}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
