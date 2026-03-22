import { useStore } from '../../stores/useStore'

// Dummy data mirroring the canvas data
const PROJECT_DETAILS: Record<number, any> = {
    1: { title: 'Neon Flux', desc: 'Immersive light installation exploring the boundary between physical and digital spaces.', client: 'Biennale 2024' },
    2: { title: 'Void Scent', desc: 'Product design and visualization for a conceptual luxury perfume brand.', client: 'Internal' },
    3: { title: 'Cyber UI', desc: 'Diegetic interface design for a sci-fi tactical shooter game.', client: 'Indie Studio' },
    4: { title: 'Ethereal', desc: 'Motion graphics study on fluid dynamics and soft body simulation.', client: 'R&D' },
}

export function ProjectDetailOverlay() {
    const selectedProject = useStore((state) => state.selectedProject)
    const setSelectedProject = useStore((state) => state.setSelectedProject)

    if (!selectedProject) return null

    const data = PROJECT_DETAILS[selectedProject] || {}

    return (
        <div className="absolute-center z-ui w-full h-full pointer-events-auto flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all">
            <div className="max-w-2xl border border-white/20 p-8 relative bg-black">
                <button
                    className="absolute top-4 right-4 text-sm font-mono uppercase hover:text-accent"
                    onClick={() => setSelectedProject(null)}
                >
                    [Close_X]
                </button>

                <div className="text-xs font-mono mb-2 text-subtle uppercase tracking-widest">{data.client}</div>
                <h1 className="text-4xl font-mono mb-6 uppercase text-white">{data.title}</h1>
                <p className="text-lg font-mono text-gray-300 leading-relaxed">
                    {data.desc}
                </p>

                <div className="mt-8 flex gap-4">
                    {/* Placeholder gallery or links */}
                    <div className="w-24 h-24 bg-gray-900 border border-gray-800"></div>
                    <div className="w-24 h-24 bg-gray-900 border border-gray-800"></div>
                </div>
            </div>
        </div>
    )
}
