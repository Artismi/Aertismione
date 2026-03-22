import { useStore } from '../../stores/useStore'

// 4-Point Sharp Star
const StarSharp = ((props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
        <polygon points="50,0 60,40 100,50 60,60 50,100 40,60 0,50 40,40" />
    </svg>
))

export function HeroOverlay() {
    const setIsDroneViewOpen = useStore((state) => state.setIsDroneViewOpen)
    const setNavMode = useStore((state) => state.setNavMode)
    const setTakeoff = useStore((state) => state.setTakeoff)
    const setDroneMessage = useStore((state) => state.setDroneMessage)
    const scrollY = useStore((state) => state.scrollY)
    const showFormazione = useStore((state) => state.showFormazione)
    const setShowFormazione = useStore((state) => state.setShowFormazione)
    const isServicesOpen = useStore((state) => state.isServicesOpen)

    // Helper for smooth transitions
    const checkRange = (scroll: number, start: number, end: number) => {
        if (scroll < start) return 0
        if (scroll > end) return 1
        return (scroll - start) / (end - start)
    }

    // STAGE 1: LOGO (Brand) - Visible at start, fades during transition
    const logoFadeStart = 100
    const logoFadeEnd = 500
    let logoOpacity = 1 - checkRange(scrollY, logoFadeStart, logoFadeEnd)

    // STAGE 3: HUD (Systems) - Appears as we approach avatar (scroll ~1600)
    const hudEnterStart = 1400
    const hudEnterEnd = 1600
    const hudExitStart = 2500
    const hudExitEnd = 2800

    const hudEnterCurve = checkRange(scrollY, hudEnterStart, hudEnterEnd)
    const hudExitCurve = 1 - checkRange(scrollY, hudExitStart, hudExitEnd)
    const hudOpacity = hudEnterCurve * hudExitCurve

    const handleProjectsClick = () => {
        setIsDroneViewOpen(true)
        setNavMode('drone')
        setTakeoff(true)
        setDroneMessage("LAUNCHING...")
        setTimeout(() => setDroneMessage(null), 3000)
    }

    const handleFormazioneClick = () => {
        setShowFormazione(!showFormazione)
    }

    // ACID DESIGN THEME
    const theme = {
        color: '#E2FF00',
        font: "'JetBrains Mono', monospace",
    }

    return (
        <>
            {/* CSS Animations */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100vh); }
                }
                @keyframes grain {
                    0%, 100% { transform: translate(0, 0); }
                    10% { transform: translate(-5%, -10%); }
                    20% { transform: translate(-15%, 5%); }
                    30% { transform: translate(7%, -25%); }
                    40% { transform: translate(-5%, 25%); }
                    50% { transform: translate(-15%, 10%); }
                    60% { transform: translate(15%, 0%); }
                    70% { transform: translate(0%, 15%); }
                    80% { transform: translate(3%, 35%); }
                    90% { transform: translate(-10%, 10%); }
                }
            `}</style>

            {/* Noise Texture Overlay */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                opacity: 0.03,
                zIndex: 100,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
                animation: 'grain 8s steps(10) infinite'
            }} />

            {/* Vignette Effect */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
                zIndex: 99
            }} />

            {/* Scanline Effect */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${theme.color}44, transparent)`,
                animation: 'scanline 4s linear infinite',
                opacity: hudOpacity * 0.3,
                pointerEvents: 'none',
                zIndex: 99
            }} />

            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                fontFamily: theme.font,
                color: theme.color,
                textTransform: 'uppercase',
                pointerEvents: 'none',
                zIndex: 20
            }}>

                {/* --- TOP LEFT: BRAND --- */}
                <div style={{
                    position: 'absolute',
                    top: '2rem',
                    left: '2rem',
                    opacity: logoOpacity,
                    transition: 'opacity 0.3s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                        <StarSharp width={40} height={40} style={{ animation: 'pulse 3s ease-in-out infinite' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                            <span style={{ fontSize: '1rem', fontWeight: 900 }}>ARTISMI</span>
                        </div>
                    </div>
                </div>

                {/* Bottom text - Instruction */}
                <div style={{
                    position: 'absolute',
                    bottom: '2rem',
                    left: '2rem',
                    fontSize: '0.6rem',
                    maxWidth: '150px',
                    opacity: logoOpacity * 0.7,
                    lineHeight: 1.4
                }}>
                    ALL SYSTEMS OPERATIONAL<br />
                    SCROLL TO INITIALIZE NAV
                </div>

                {/* --- RIGHT SIDE: TEXT-ONLY NAVIGATION BUTTONS (hidden when showFormazione or isServicesOpen is true) --- */}
                {!showFormazione && !isServicesOpen && (
                    <div style={{
                        position: 'absolute',
                        right: '3rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2.5rem',
                        opacity: hudOpacity,
                        transition: 'opacity 0.3s ease',
                        alignItems: 'flex-end'
                    }}>

                        {/* FORMAZIONE Button - Text Only */}
                        <button
                            onClick={handleFormazioneClick}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                color: theme.color,
                                fontFamily: theme.font,
                                fontSize: '1.3rem',
                                fontWeight: 900,
                                letterSpacing: '0.2em',
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s ease',
                                textShadow: `0 0 20px ${theme.color}66`,
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.textShadow = `0 0 10px ${theme.color}, 0 0 20px ${theme.color}66`
                                e.currentTarget.style.transform = 'translateX(-10px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.textShadow = `0 0 5px ${theme.color}`
                                e.currentTarget.style.transform = 'translateX(0)'
                            }}
                        >
                            ▸ FORMAZIONE
                        </button>

                        {/* SERVIZI Button - Text Only */}
                        <button
                            onClick={() => useStore.getState().setShowPricingDetail(true)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                color: theme.color,
                                fontFamily: theme.font,
                                fontSize: '1.3rem',
                                fontWeight: 900,
                                letterSpacing: '0.2em',
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s ease',
                                textShadow: `0 0 20px ${theme.color}66`,
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.textShadow = `0 0 30px ${theme.color}, 0 0 60px ${theme.color}66`
                                e.currentTarget.style.transform = 'translateX(-10px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.textShadow = `0 0 20px ${theme.color}66`
                                e.currentTarget.style.transform = 'translateX(0)'
                            }}
                        >
                            ▸ SERVIZI
                        </button>

                        {/* PROGETTI Button - Text Only */}
                        <button
                            onClick={handleProjectsClick}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                color: theme.color,
                                fontFamily: theme.font,
                                fontSize: '1.3rem',
                                fontWeight: 900,
                                letterSpacing: '0.2em',
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s ease',
                                textShadow: `0 0 20px ${theme.color}66`,
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.textShadow = `0 0 30px ${theme.color}, 0 0 60px ${theme.color}66`
                                e.currentTarget.style.transform = 'translateX(-10px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.textShadow = `0 0 20px ${theme.color}66`
                                e.currentTarget.style.transform = 'translateX(0)'
                            }}
                        >
                            ▸ PROGETTI
                        </button>

                    </div>
                )}

            </div>
        </>
    )
}
