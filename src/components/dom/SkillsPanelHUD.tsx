import { useStore } from '../../stores/useStore'

// Personal data from CV - FULL TEXT
const CV_DATA = {
    name: 'ANDREA PIZZOGLIO',
    contact: {
        email: 'apizzoglio@gmail.com',
        phone: '+39 3195752',
        location: 'Italia',
        birth: '10/12/2001',
        linkedin: 'www.linkedin.com/in/andrea-pizzoglio',
        instagram: 'https://www.instagram.com/angea_pangea'
    },
    experiences: [
        {
            title: 'TESI - ECOMUSEO',
            subtitle: 'Terra del Castelmagno',
            desc: 'Studio del ruolo delle macchine ad acqua come motore di sviluppo economico e sociale dell\'areale dell\'Ecomuseo Terra del Castelmagno.'
        },
        {
            title: 'TIROCINIO CURRICOLARE',
            subtitle: 'Arteforma',
            desc: 'Svolto in Arteforma, azienda che produce biciclette artigianali su misura. Completando mansioni riguardanti la manutenzione meccanica, la verniciatura, la saldatura.'
        },
        {
            title: 'SERIGRAFIA',
            subtitle: 'Laboratorio',
            desc: 'Ho lavorato in una serigrafia, sviluppando una conoscenza delle tecniche e delle macchine di stampa.'
        },
        {
            title: 'ASSISTENZA DISABILITÀ',
            subtitle: 'Volontariato',
            desc: 'Seguo una persona con una disabilità cognitiva, esperienza estremamente formativa.'
        }
    ],
    softSkills: [
        'Predisposizione al lavoro di squadra',
        'Spirito creativo e capacità rappresentative',
        'Capacità comunicative e relazionali',
        'Pensiero analitico e problem solving',
        'Capacità di ascolto attivo',
        'Buona manualità e precisione'
    ],
    software: [
        { name: 'Illustrator', level: 95 },
        { name: 'Photoshop', level: 90 },
        { name: 'InDesign', level: 85 },
        { name: 'Premiere', level: 80 },
        { name: 'Rhino 3D', level: 75 },
        { name: 'Blender', level: 70 },
        { name: 'AutoCAD', level: 70 },
        { name: 'Office', level: 85 },
        { name: 'Canva', level: 80 }
    ],
    education: [
        {
            type: 'LAUREA TRIENNALE',
            school: 'Politecnico',
            field: 'Design e Comunicazione',
            score: '99'
        },
        {
            type: 'DIPLOMA',
            school: 'Liceo Scientifico Carlo Cattaneo',
            field: 'Scienze Applicate',
            score: ''
        }
    ],
    languages: [
        { lang: 'Italiano', level: 'Madrelingua' },
        { lang: 'Inglese', level: 'Avanzato C1' }
    ]
}

// Technical corner brackets
const TechCorners = ({ color = '#F0FF00', opacity = 0.5 }: { color?: string, opacity?: number }) => (
    <>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`, opacity }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}`, opacity }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 20, height: 20, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}`, opacity }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}`, opacity }} />
    </>
)

export function SkillsPanelHUD() {
    const scrollY = useStore((state) => state.scrollY)
    const showFormazione = useStore((state) => state.showFormazione)
    const setShowFormazione = useStore((state) => state.setShowFormazione)

    const hudEnterStart = 400
    const hudEnterEnd = 700
    const hudExitStart = 1300
    const hudExitEnd = 1600

    const checkRange = (scroll: number, start: number, end: number) => {
        if (scroll < start) return 0
        if (scroll > end) return 1
        return (scroll - start) / (end - start)
    }

    const hudEnterCurve = checkRange(scrollY, hudEnterStart, hudEnterEnd)
    const hudExitCurve = 1 - checkRange(scrollY, hudExitStart, hudExitEnd)
    const opacity = hudEnterCurve * hudExitCurve

    if (opacity <= 0 || !showFormazione) return null

    const theme = {
        color: '#F0FF00',
        colorSecondary: '#00FFFF',
        font: "'JetBrains Mono', monospace"
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            fontFamily: theme.font,
            color: '#FFFFFF',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            opacity,
            transition: 'opacity 0.3s ease',
            zIndex: 20
        }}>

            {/* Exit Button */}
            <button
                onClick={() => setShowFormazione(false)}
                style={{
                    position: 'absolute',
                    top: '2rem',
                    right: '2rem',
                    pointerEvents: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    overflow: 'hidden',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    zIndex: 30
                }}
                onMouseEnter={(e) => {
                    const span = e.currentTarget.querySelector('span')
                    if (span) {
                        ; (span as HTMLElement).style.background = '#FFFFFF'
                            ; (span as HTMLElement).style.color = '#000000'
                    }
                }}
                onMouseLeave={(e) => {
                    const span = e.currentTarget.querySelector('span')
                    if (span) {
                        ; (span as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)'
                            ; (span as HTMLElement).style.color = '#FFFFFF'
                    }
                }}
            >
                <span style={{
                    position: 'relative',
                    fontFamily: theme.font,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    padding: '0.75rem 2rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(12px)',
                    color: '#FFFFFF',
                    transition: 'all 0.5s ease',
                    borderRadius: '2px',
                    boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
                    fontSize: '0.7rem',
                    fontWeight: 500
                }}>
                    Esci
                </span>

                {/* Decorative lines */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end', opacity: 0.4 }}>
                    <div style={{ width: '2rem', height: '1px', background: '#FFFFFF', transform: 'translateX(0.5rem)', transition: 'transform 0.5s ease' }} />
                    <div style={{ width: '3rem', height: '1px', background: '#FFFFFF', transition: 'all 0.5s ease' }} />
                </div>
            </button>

            <style>{`
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>

            {/* TOP CENTER - NAME */}
            <div style={{
                position: 'absolute',
                top: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    color: '#FFFFFF',
                    filter: 'drop-shadow(0 0 2px #FFFFFF) drop-shadow(0 0 8px #F0FF00)'
                }}>
                    {CV_DATA.name}
                </div>
                <div style={{
                    fontSize: '0.6rem',
                    opacity: 0.9,
                    letterSpacing: '0.3em',
                    marginTop: 5,
                    color: '#F0FF00',
                    filter: 'drop-shadow(0 0 3px #F0FF00)'
                }}>
                    DESIGNER • CREATIVE • PROGETTISTA
                </div>
            </div>

            {/* LEFT SIDE - FORMAZIONE */}
            <div style={{
                position: 'absolute',
                left: '3%',
                top: '15%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem',
                maxWidth: '42%',
                animation: 'slideInLeft 0.6s ease 0.2s forwards',
                opacity: 0,
                padding: '1.5rem',
                borderLeft: `3px solid ${theme.color}`
            }}>
                <TechCorners color={theme.color} opacity={0.6} />

                {/* ISTRUZIONE */}
                <div>
                    <div style={{
                        fontSize: '1rem',
                        fontWeight: 900,
                        marginBottom: '0.6rem',
                        letterSpacing: '0.1em',
                        color: '#FFFF00',
                        filter: 'drop-shadow(0 0 2px #FFFF00) drop-shadow(0 0 6px #FFFF00)'
                    }}>
                        ▸ ISTRUZIONE
                    </div>
                    {CV_DATA.education.map((edu, i) => (
                        <div key={i} style={{ marginBottom: '0.8rem', paddingLeft: '1.2rem', borderLeft: `2px solid ${theme.color}44` }}>
                            <div style={{
                                color: '#00FFFF',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                filter: 'drop-shadow(0 0 2px #00FFFF) drop-shadow(0 0 5px #00FFFF)'
                            }}>
                                {edu.type} {edu.score && `• ${edu.score}/110`}
                            </div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.9, marginTop: 2 }}>{edu.school}</div>
                            <div style={{ fontSize: '0.6rem', opacity: 0.7, textTransform: 'none', marginTop: 2 }}>{edu.field}</div>
                        </div>
                    ))}
                </div>

                {/* ESPERIENZE */}
                <div>
                    <div style={{
                        fontSize: '1rem',
                        fontWeight: 900,
                        marginBottom: '0.6rem',
                        letterSpacing: '0.1em',
                        color: '#FFFF00',
                        filter: 'drop-shadow(0 0 2px #FFFF00) drop-shadow(0 0 6px #FFFF00)'
                    }}>
                        ▸ ESPERIENZE
                    </div>
                    {CV_DATA.experiences.map((exp, i) => (
                        <div key={i} style={{ marginBottom: '0.8rem', paddingLeft: '1.2rem', borderLeft: `2px solid ${theme.color}44` }}>
                            <div style={{
                                color: '#00FFFF',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                filter: 'drop-shadow(0 0 2px #00FFFF) drop-shadow(0 0 5px #00FFFF)'
                            }}>
                                {exp.title}
                            </div>
                            <div style={{ fontSize: '0.55rem', opacity: 0.7, letterSpacing: '0.1em', marginTop: 2 }}>
                                {exp.subtitle}
                            </div>
                            <div style={{ fontSize: '0.6rem', opacity: 0.9, lineHeight: 1.3, textTransform: 'none', marginTop: 3 }}>
                                {exp.desc}
                            </div>
                        </div>
                    ))}
                </div>

                {/* LINGUE */}
                <div>
                    <div style={{
                        fontSize: '1rem',
                        fontWeight: 900,
                        marginBottom: '0.6rem',
                        letterSpacing: '0.1em',
                        color: '#FFFF00',
                        filter: 'drop-shadow(0 0 2px #FFFF00) drop-shadow(0 0 6px #FFFF00)'
                    }}>
                        ▸ LINGUE
                    </div>
                    {CV_DATA.languages.map((lang, i) => (
                        <div key={i} style={{ marginBottom: '0.4rem', paddingLeft: '1.2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                                <span style={{ color: '#00FFFF', filter: 'drop-shadow(0 0 6px #00FFFF)' }}>{lang.lang}</span>
                                <span style={{ opacity: 0.8 }}>{lang.level}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT SIDE - SKILLS */}
            <div style={{
                position: 'absolute',
                right: '3%',
                top: '15%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem',
                maxWidth: '44%',
                animation: 'slideInRight 0.6s ease 0.3s forwards',
                opacity: 0,
                padding: '1.5rem',
                borderRight: `3px solid ${theme.color}`
            }}>
                <TechCorners color={theme.color} opacity={0.6} />

                {/* SOFTWARE */}
                <div>
                    <div style={{
                        fontSize: '1rem',
                        fontWeight: 900,
                        marginBottom: '0.6rem',
                        letterSpacing: '0.1em',
                        textAlign: 'right',
                        color: '#FFFF00',
                        filter: 'drop-shadow(0 0 2px #FFFF00) drop-shadow(0 0 6px #FFFF00)'
                    }}>
                        SOFTWARE ◂
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.7rem',
                        textAlign: 'right'
                    }}>
                        {CV_DATA.software.map((sw, i) => (
                            <div key={i} style={{ paddingRight: '1.2rem', borderRight: `2px solid ${theme.color}44` }}>
                                <div style={{
                                    color: '#00FFFF',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    filter: 'drop-shadow(0 0 2px #00FFFF) drop-shadow(0 0 5px #00FFFF)'
                                }}>
                                    {sw.name}
                                </div>
                                <div style={{ fontSize: '0.55rem', opacity: 0.7, marginTop: 2 }}>{sw.level}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SOFT SKILLS */}
                <div>
                    <div style={{
                        fontSize: '1rem',
                        fontWeight: 900,
                        marginBottom: '0.6rem',
                        letterSpacing: '0.1em',
                        textAlign: 'right',
                        color: '#FFFF00',
                        filter: 'drop-shadow(0 0 2px #FFFF00) drop-shadow(0 0 6px #FFFF00)'
                    }}>
                        SOFT SKILLS ◂
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'right' }}>
                        {CV_DATA.softSkills.map((skill, i) => (
                            <div key={i} style={{
                                fontSize: '0.6rem',
                                paddingRight: '1.2rem',
                                borderRight: `1px solid ${theme.color}33`,
                                textTransform: 'none',
                                opacity: 0.9
                            }}>
                                {skill}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* BOTTOM CENTER - CONTACT */}
            <div style={{
                position: 'absolute',
                bottom: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '2rem',
                fontSize: '0.6rem',
                opacity: 0.8
            }}>
                <div>{CV_DATA.contact.birth}</div>
            </div>

        </div>
    )
}
