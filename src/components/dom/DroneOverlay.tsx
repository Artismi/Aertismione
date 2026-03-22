import { useStore } from '../../stores/useStore'

export function DroneOverlay() {
    const navMode = useStore((state) => state.navMode)
    const setNavMode = useStore((state) => state.setNavMode)
    const score = useStore((state) => state.score)
    const health = useStore((state) => state.health)
    const wave = useStore((state) => state.wave)

    const droneMessage = useStore((state) => state.droneMessage)
    const setScrollY = useStore((state) => state.setScrollY)
    const setHasExitedDrone = useStore((state) => state.setHasExitedDrone)

    if (navMode !== 'drone') return null

    const handleExit = () => {
        setNavMode('scroll')
        setHasExitedDrone(true)
        // Auto-scroll back to a safe point (e.g. skills section)
        setScrollY(1200)
    }

    return (
        <div className="drone-hud fixed inset-0 pointer-events-none z-ui flex flex-col justify-between p-8 font-mono uppercase text-white overflow-hidden">
            {/* Entry Message Overlay */}
            {droneMessage && (
                <div className="absolute inset-x-0 top-1/3 flex justify-center z-50">
                    <div className="bg-black/80 backdrop-blur-xl border-y-2 border-[#00fff2] px-12 py-8 text-3xl tracking-[0.4em] font-black text-center shadow-[0_0_30px_rgba(0,255,242,0.3)] animate-glitch">
                        {droneMessage}
                    </div>
                </div>
            )}

            {/* Controls Tooltip */}
            <div className="absolute top-24 right-8 bg-black/80 border-r-4 border-[#00fff2] p-4 text-[11px] tracking-widest text-[#00fff2] animate-fade-out pointer-events-none shadow-2xl">
                <div className="mb-2 opacity-40 text-[9px]">[ DRONE_OS_v4.2 ]</div>
                <div className="flex justify-between gap-4"><span>MOVE</span> <span className="text-white">MOUSE / WASD</span></div>
                <div className="flex justify-between gap-4"><span>SCAN</span> <span className="text-white">SPACE / CLICK</span></div>
            </div>

            {/* Top Bar */}
            <div className="flex justify-between items-start">
                <div className="text-2xl font-black tracking-tighter bg-black/60 p-4 border-l-4 border-[#00fff2] backdrop-blur-md">
                    <span className="text-xs opacity-50 block mb-1">DATA_HARVEST</span>
                    {score.toString().padStart(6, '0')}
                </div>

                <div className="bg-black/60 p-4 border-r-4 border-red-500 backdrop-blur-md">
                    <span className="text-xs opacity-50 block mb-2 text-right">SYSTEM_INTEGRITY</span>
                    <div className="flex gap-1.5 justify-end">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-3 h-6 ${i < health ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex justify-between items-end">
                <div className="text-lg font-bold tracking-widest bg-[#00fff2]/5 p-4 border-b-2 border-[#00fff2]/30 backdrop-blur-sm">
                    <span className="text-[10px] opacity-40 block">CURRENT_SECTOR</span>
                    {wave}
                </div>

                <button
                    onClick={handleExit}
                    className="pointer-events-auto bg-black hover:bg-[#00fff2] border-2 border-[#00fff2] px-6 py-4 flex flex-col items-center gap-1 transition-all group shadow-lg hover:shadow-[#00fff2]/40"
                >
                    <span className="text-xl group-hover:text-black group-hover:scale-110 transition-transform">⎖</span>
                    <span className="text-[9px] font-black group-hover:text-black">EXIT_DRONE_VIEW</span>
                </button>
            </div>

            {/* Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 pointer-events-none opacity-60">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-[#00fff2]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-[#00fff2]" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-[1px] bg-[#00fff2]" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-[1px] bg-[#00fff2]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-red-500 rounded-full" />
            </div>
        </div>
    )
}
