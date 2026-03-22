import { useStore } from '../../stores/useStore'

import TacticalUI from './TacticalUI'



export function SkillsOverlay() {
    const setIsDroneViewOpen = useStore((state) => state.setIsDroneViewOpen)
    const setNavMode = useStore((state) => state.setNavMode)
    const setTakeoff = useStore((state) => state.setTakeoff)
    const setDroneMessage = useStore((state) => state.setDroneMessage)

    // Previous opacity logic handled inside TacticalUI now, 
    // but the Progetti button needs to sit on top or be part of it.
    const scrollY = useStore((state) => state.scrollY)
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

    const handleOpenDroneView = () => {
        setIsDroneViewOpen(true)
        setNavMode('drone')
        setTakeoff(true)
        setDroneMessage("DRONE VIEW: ESPLORA I MIEI PROGETTI!")
        setTimeout(() => setDroneMessage(null), 3000)
    }

    return null

    /* 
    // Disabled as per new HUD implementation in HeroOverlay
    return (
        <>
            <TacticalUI />
            ...
        </>
    ) 
    */
}

