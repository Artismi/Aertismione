import { useStore } from '../../stores/useStore'

export function DroneViewModal() {
    const isDroneViewOpen = useStore((state) => state.isDroneViewOpen)
    const setIsDroneViewOpen = useStore((state) => state.setIsDroneViewOpen)
    const setNavMode = useStore((state) => state.setNavMode)
    const setTakeoff = useStore((state) => state.setTakeoff)
    const setHasExitedDrone = useStore((state) => state.setHasExitedDrone)

    const handleClose = () => {
        setIsDroneViewOpen(false)
        setNavMode('scroll')
        setTakeoff(false)
        setHasExitedDrone(true)
    }

    if (!isDroneViewOpen) return null

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black"
            style={{
                width: '100vw',
                height: '100vh',
                pointerEvents: 'auto'
            }}
        >
            {/* Exit Button */}
            <button
                onClick={handleClose}
                className="absolute top-8 right-8 z-[10000] group flex items-center gap-3 overflow-hidden"
                style={{ pointerEvents: 'auto' }}
            >
                <span className="relative z-10 font-mono uppercase tracking-[0.2em] px-8 py-3 border border-white/30 bg-white/5 backdrop-blur-md text-white group-hover:bg-white group-hover:text-black transition-all duration-500 rounded-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    Esci
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                </span>

                {/* Decorative lines */}
                <div className="flex flex-col gap-1 items-end opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-8 h-[1px] bg-white transform translate-x-2 group-hover:translate-x-0 transition-transform duration-500"></div>
                    <div className="w-12 h-[1px] bg-white transition-all duration-500"></div>
                </div>
            </button>
        </div>
    )
}
