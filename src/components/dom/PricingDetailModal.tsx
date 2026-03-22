import { useStore } from '../../stores/useStore'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function PricingDetailModal() {
    const showPricingDetail = useStore((state) => state.showPricingDetail)
    const setShowPricingDetail = useStore((state) => state.setShowPricingDetail)
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (modalRef.current) {
            if (showPricingDetail) {
                gsap.to(modalRef.current, { opacity: 1, duration: 0.3, pointerEvents: 'auto' })
            } else {
                gsap.to(modalRef.current, { opacity: 0, duration: 0.3, pointerEvents: 'none' })
            }
        }
    }, [showPricingDetail])

    if (!showPricingDetail) return null

    return (
        <div
            ref={modalRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            style={{ opacity: 0, pointerEvents: 'none' }}
        >
            <div className="relative w-[90vw] max-w-6xl h-[85vh] bg-black/95 border border-accent/30 rounded-lg overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-accent/20">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                        <h2 className="text-3xl font-mono uppercase font-bold text-white tracking-wider">
                            Listino <span className="text-accent">&</span> Servizi
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowPricingDetail(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(100%-80px)] p-8">
                    <div className="space-y-12 max-w-4xl mx-auto">

                        {/* IDENTITÀ VISIVA */}
                        <section className="border border-accent/20 bg-white/5 p-8 rounded-lg">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-mono uppercase font-bold text-accent mb-2">Identità Visiva</h3>
                                    <p className="text-sm text-gray-400 font-mono">Per attività, spazi e progetti strutturati</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-white font-mono">550 €</div>
                                    <div className="text-xs text-gray-500 font-mono mt-1">Costo indicativo</div>
                                </div>
                            </div>

                            <p className="text-gray-300 font-mono mb-6 leading-relaxed">
                                Quando si lavora su un'attività, uno spazio o un progetto continuativo, il punto di partenza è l'identità visiva.
                                È ciò che permette di comunicare in modo chiaro e di mantenere coerenza nel tempo.
                            </p>

                            <p className="text-gray-300 font-mono mb-6 leading-relaxed">
                                L'identità viene sviluppata attraverso un percorso di coprogettazione, utile a definire insieme forma e narrazione.
                            </p>

                            <div className="bg-black/50 p-6 rounded border border-white/10">
                                <h4 className="text-sm font-mono uppercase text-accent mb-4">Il percorso comprende:</h4>
                                <ul className="space-y-2">
                                    {[
                                        '4 incontri di coprogettazione',
                                        'definizione di valori, tono e pubblico',
                                        'concept e direzione visiva',
                                        'identità grafica illustrata',
                                        'colori, tipografie e sistema visivo base',
                                        'prime applicazioni (social e stampa)'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center text-gray-300 font-mono text-sm">
                                            <span className="w-1.5 h-1.5 bg-accent rounded-full mr-3"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* LAVORI SINGOLI */}
                        <section className="border border-accent/20 bg-white/5 p-8 rounded-lg">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-mono uppercase font-bold text-accent mb-2">Lavori Singoli</h3>
                                    <p className="text-sm text-gray-400 font-mono">Per persone, artisti e interventi puntuali</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-white font-mono">da 80 €</div>
                                    <div className="text-xs text-gray-500 font-mono mt-1">Costo indicativo</div>
                                </div>
                            </div>

                            <p className="text-gray-300 font-mono mb-6 leading-relaxed">
                                Se il progetto è un intervento specifico (un disegno, un poster, un murales, un artwork),
                                è possibile lavorare anche senza sviluppare un'identità completa.
                            </p>

                            <div className="bg-black/50 p-6 rounded border border-white/10">
                                <h4 className="text-sm font-mono uppercase text-accent mb-4">Artismi realizza:</h4>
                                <ul className="space-y-2">
                                    {[
                                        'illustrazioni e disegni originali',
                                        'poster, flyer e materiali stampati',
                                        'artwork e copertine',
                                        'contenuti grafici per social media'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center text-gray-300 font-mono text-sm">
                                            <span className="w-1.5 h-1.5 bg-accent rounded-full mr-3"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* SPAZIO E SUPERFICI */}
                        <section className="border border-accent/20 bg-white/5 p-8 rounded-lg">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-mono uppercase font-bold text-accent mb-2">Spazio e Superfici</h3>
                                    <p className="text-sm text-gray-400 font-mono">Progettazione per luoghi fisici</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-white font-mono">Preventivo</div>
                                    <div className="text-xs text-gray-500 font-mono mt-1">Su misura</div>
                                </div>
                            </div>

                            <p className="text-gray-300 font-mono mb-6 leading-relaxed">
                                Artismi lavora anche nello spazio fisico, progettando immagini pensate per dialogare con i luoghi.
                            </p>

                            <div className="bg-black/50 p-6 rounded border border-white/10">
                                <ul className="space-y-2">
                                    {[
                                        'vetrine e vetrofanie',
                                        'insegne',
                                        'murales artistici e site-specific'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center text-gray-300 font-mono text-sm">
                                            <span className="w-1.5 h-1.5 bg-accent rounded-full mr-3"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-gray-400 font-mono text-xs mt-4 italic">
                                    Per interventi su spazi e luoghi è sempre prevista una fase progettuale, anche minima,
                                    per garantire coerenza e qualità del risultato.
                                </p>
                            </div>
                        </section>

                        {/* GADGET */}
                        <section className="border border-accent/20 bg-white/5 p-8 rounded-lg">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-mono uppercase font-bold text-accent mb-2">Gadget e Materiali</h3>
                                    <p className="text-sm text-gray-400 font-mono">Personalizzati</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-white font-mono">da 100 €</div>
                                    <div className="text-xs text-gray-500 font-mono mt-1">Solo progettazione</div>
                                </div>
                            </div>

                            <p className="text-gray-300 font-mono mb-6 leading-relaxed">
                                Progettazione grafica di materiali e oggetti personalizzati, realizzati in collaborazione con fornitori esterni.
                            </p>

                            <div className="bg-black/50 p-6 rounded border border-white/10 mb-4">
                                <h4 className="text-sm font-mono uppercase text-accent mb-3">Esempi:</h4>
                                <p className="text-gray-300 font-mono text-sm">
                                    t-shirt, stampe, spille, bicchieri, borse, cappelli, stendardi, bandiere e altri supporti su richiesta
                                </p>
                            </div>

                            <div className="bg-black/50 p-6 rounded border border-white/10">
                                <h4 className="text-sm font-mono uppercase text-accent mb-4">Artismi cura:</h4>
                                <ul className="space-y-2">
                                    {[
                                        'concept e grafica',
                                        'adattamento ai supporti',
                                        'coordinamento della produzione'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center text-gray-300 font-mono text-sm">
                                            <span className="w-1.5 h-1.5 bg-accent rounded-full mr-3"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-gray-400 font-mono text-xs mt-4 italic">
                                    I costi di produzione sono esclusi
                                </p>
                            </div>
                        </section>

                        {/* SOCIAL MEDIA */}
                        <section className="border border-accent/20 bg-white/5 p-8 rounded-lg">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-mono uppercase font-bold text-accent mb-2">Social Media Management</h3>
                                    <p className="text-sm text-gray-400 font-mono">Con videomaking incluso</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-white font-mono">450 €/mese</div>
                                    <div className="text-xs text-gray-500 font-mono mt-1">Min. 3 mesi</div>
                                </div>
                            </div>

                            <p className="text-gray-300 font-mono mb-6 leading-relaxed">
                                Oggi i contenuti video sono fondamentali per ottenere visibilità.
                                Per questo il videomaking è parte integrante della gestione social.
                            </p>

                            <div className="bg-black/50 p-6 rounded border border-white/10">
                                <h4 className="text-sm font-mono uppercase text-accent mb-4">Il servizio comprende:</h4>
                                <ul className="space-y-2">
                                    {[
                                        'impostazione visiva',
                                        'riprese video settimanali',
                                        'montaggio di contenuti brevi',
                                        'pubblicazione e programmazione',
                                        'coerenza con l\'immagine del progetto'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center text-gray-300 font-mono text-sm">
                                            <span className="w-1.5 h-1.5 bg-accent rounded-full mr-3"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* SITI WEB */}
                        <section className="border border-accent/20 bg-white/5 p-8 rounded-lg">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-mono uppercase font-bold text-accent mb-2">Siti Web</h3>
                                    <p className="text-sm text-gray-400 font-mono">Progettazione e Realizzazione</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-white font-mono">800-1200 €</div>
                                    <div className="text-xs text-gray-500 font-mono mt-1">Costo indicativo</div>
                                </div>
                            </div>

                            <p className="text-gray-300 font-mono mb-6 leading-relaxed">
                                Siti web su misura, coerenti con l'identità visiva del progetto.
                            </p>

                            <div className="bg-black/50 p-6 rounded border border-white/10">
                                <ul className="space-y-2">
                                    {[
                                        'Design e struttura',
                                        'Sviluppo responsive',
                                        'Integrazione contenuti'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center text-gray-300 font-mono text-sm">
                                            <span className="w-1.5 h-1.5 bg-accent rounded-full mr-3"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    )
}
