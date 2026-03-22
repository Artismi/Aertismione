
import { useStore } from '../../stores/useStore'

const DATA = {
    header: {
        id: 'IPA-CT2-PC41-BK',
        season: 'SPRING / SUMMER 2024',
        collection: 'CHAPTER-2-ROUGHNECK'
    },
    experience: [
        { title: 'TIROCINIO', loc: 'ARTEFORMA', desc: 'Meccanica, verniciatura, saldatura, grafica.' },
        { title: 'SERIGRAFIA', loc: 'LAB', desc: 'Tecniche di stampa, preparazione telai.' },
        { title: 'ASSISTENZA', loc: 'VOLONTARIATO', desc: 'Supporto disabilità cognitiva.' },
        { title: 'SCOUTING', loc: 'AGESCI', desc: 'Educatore, volontariato, aiuto reciproco.' },
    ],
    education: [
        { type: 'LAUREA', school: 'POLITECNICO', score: '99', field: 'Design e Comunicazione' },
        { type: 'DIPLOMA', school: 'L.S. CARLO CATTANEO', score: '76', field: 'Scienze Applicate' }
    ],
    software: ['Illustrator', 'Photoshop', 'Indesign', 'Premiere Pro', 'Rhinoceros 3D', 'Blender', 'Autocad', 'Office'],
    softSkills: [
        'Lavoro di Squadra', 'Problem Solving', 'Ascolto Attivo', 'Comunicazione', 'Manualità', 'Spirito Creativo'
    ],
    contact: {
        email: 'apizzoglio@gmail.com',
        birth: '10/12/2001'
    }
}

export default function TacticalUI() {
    const scrollY = useStore((state) => state.scrollY)

    // Fade in around scrollY 1200-1500, fade out after 2500
    const startFade = 1200
    const endFade = 1500
    const fadeOutStart = 2500

    let opacity = 0
    if (scrollY > startFade && scrollY < fadeOutStart) {
        opacity = Math.min(1, (scrollY - startFade) / (endFade - startFade))
    } else if (scrollY >= fadeOutStart) {
        opacity = Math.max(0, 1 - (scrollY - fadeOutStart) / 500)
    }

    const pointerEvents = opacity > 0.1 ? 'auto' : 'none'

    return (
        <div
            className="fixed inset-0 z-ui font-mono text-white select-none overflow-hidden"
            style={{ opacity, pointerEvents: pointerEvents as any, transition: 'opacity 0.3s' }}
        >
            {/* --- GRID BACKGROUND --- */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
                <defs>
                    <pattern id="grid-small" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-small)" />
            </svg>

            {/* --- MAIN LAYOUT --- */}
            <div className="absolute inset-4 border border-white/30 flex flex-col justify-between p-4 pointer-events-none">

                {/* HEADER */}
                <header className="flex justify-between items-start border-b border-white/20 pb-2 mb-4 relative">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter">LOOK.04</h1>
                        <div className="text-xs text-white/60 mt-1">IP.AXIS.INDUSTRIAL.STUDIO // {DATA.header.collection}</div>
                    </div>
                    <div className="text-right">
                        <div className="border border-white/40 px-2 py-1 text-xs inline-block bg-black/40 backdrop-blur-sm">
                            {DATA.header.id}
                        </div>
                        <div className="text-[10px] mt-1 text-white/50">{DATA.header.season}</div>
                    </div>

                    {/* Corner decorations */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-white" />
                </header>

                {/* MIDDLE SECTION (Cols) */}
                <div className="flex-1 flex justify-between items-stretch">

                    {/* LEFT COL: Experience & Soft Skills */}
                    <div className="w-1/4 min-w-[250px] flex flex-col gap-6 pointer-events-auto">

                        {/* EXPERIENCE MODULE */}
                        <div className="bg-black/40 backdrop-blur-md border-l-2 border-white/50 p-6 relative group">
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-white" /> ESPERIENZE
                            </h3>
                            <div className="space-y-4">
                                {DATA.experience.map((job, i) => (
                                    <div key={i} className="relative pl-3 border-l border-white/20">
                                        <div className="text-xs font-bold text-cyan-400">{job.title}</div>
                                        <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">{job.loc}</div>
                                        <div className="text-[10px] leading-tight opacity-50">{job.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SOFT SKILLS MODULE */}
                        <div className="bg-black/40 backdrop-blur-md border-l-2 border-white/50 p-6">
                            <h3 className="text-2xl font-bold mb-4">SOFTSKILLS</h3>
                            <div className="flex flex-wrap gap-2">
                                {DATA.softSkills.map((skill, i) => (
                                    <span key={i} className="text-xs border border-white/30 px-2 py-1 hover:bg-white/20 transition-colors">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* CENTER: AVATAR FRAME (Visual only) */}
                    <div className="flex-1 relative mx-4 pointer-events-none">
                        {/* Crosshairs centering the avatar */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[80%] border border-white/10">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/60" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/60" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/60" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/60" />

                            {/* Central cross */}
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10" />
                            <div className="absolute top-0 left-1/2 h-full w-[1px] bg-white/10" />
                        </div>
                    </div>

                    {/* RIGHT COL: Software & Education */}
                    <div className="w-1/4 min-w-[250px] flex flex-col gap-6 pointer-events-auto text-right">

                        {/* SOFTWARE MODULE */}
                        <div className="bg-black/40 backdrop-blur-md border-r-2 border-white/50 p-4">
                            <h3 className="text-xl font-bold mb-3 flex items-center justify-end gap-2">
                                SOFTWARE <span className="w-2 h-2 bg-white" />
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {DATA.software.map((sw, i) => (
                                    <div key={i} className="bg-white/5 p-1 hover:bg-white/20 transition-colors">
                                        {sw}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* EDUCATION MODULE */}
                        <div className="bg-black/40 backdrop-blur-md border-r-2 border-white/50 p-4">
                            <h3 className="text-xl font-bold mb-3">ISTRUZIONE</h3>
                            <div className="space-y-3">
                                {DATA.education.map((edu, i) => (
                                    <div key={i}>
                                        <div className="text-cyan-400 font-bold text-xs">{edu.type} - {edu.score}</div>
                                        <div className="text-[10px] text-white/80">{edu.school}</div>
                                        <div className="text-[10px] text-white/50">{edu.field}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CONTACT MINI-MODULE */}
                        <div className="mt-auto pt-4 border-t border-white/20">
                            <div className="text-xs opacity-80">{DATA.contact.email}</div>
                            <div className="text-[10px] opacity-50">{DATA.contact.birth}</div>
                        </div>

                    </div>

                </div>

                {/* FOOTER */}
                <footer className="flex justify-between items-end border-t border-white/20 pt-2 mt-4 relative">
                    <div className="text-[10px] max-w-[300px] opacity-60">
                        FUNCTIONAL CLOTHING FOR TOMORROW HUMANS WORKING IN POLLUTED FUTURE ENVIRONMENTS
                    </div>

                    {/* Barcode Element */}
                    <div className="flex flex-col items-end">
                        <div className="flex items-end h-8 gap-[2px]">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="bg-white" style={{
                                    width: Math.random() > 0.5 ? '2px' : '4px',
                                    height: `${Math.random() * 100}%`
                                }} />
                            ))}
                        </div>
                        <div className="text-[10px] tracking-[0.2em] mt-1">IP.AXIS.INDUSTRIAL</div>
                    </div>

                    {/* Corner decorations */}
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-white" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white" />
                </footer>
            </div>
        </div>
    )
}
