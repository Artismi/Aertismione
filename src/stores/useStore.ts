import { create } from 'zustand'

interface AppState {
    scrollY: number
    setScrollY: (y: number) => void
    currentSection: number
    setCurrentSection: (section: number) => void
    isScrolling: boolean
    setIsScrolling: (isScrolling: boolean) => void
    navMode: 'scroll' | 'drone'
    setNavMode: (mode: 'scroll' | 'drone') => void
    selectedProject: number | null
    setSelectedProject: (id: number | null) => void
    aboutSectionTop: number
    setAboutSectionTop: (top: number) => void
    contactSectionTop: number
    setContactSectionTop: (top: number) => void

    // HUD & Game State
    score: number
    addScore: (points: number) => void
    health: number
    damage: (amount: number) => void
    wave: string
    setWave: (name: string) => void
    isFiring: boolean
    setIsFiring: (isFiring: boolean) => void
    lasers: { id: number, pos: [number, number, number], dir: [number, number, number] }[]
    addLaser: (laser: { id: number, pos: [number, number, number], dir: [number, number, number] }) => void
    removeLaser: (id: number) => void

    // New DroneView States
    takeoff: boolean
    setTakeoff: (takeoff: boolean) => void
    droneMessage: string | null
    setDroneMessage: (msg: string | null) => void
    hasExitedDrone: boolean
    setHasExitedDrone: (exited: boolean) => void
    isDroneViewOpen: boolean
    setIsDroneViewOpen: (isOpen: boolean) => void
    takeoffProgress: number
    setTakeoffProgress: (progress: number) => void

    // Aiming system
    aimPosition: [number, number, number]
    setAimPosition: (pos: [number, number, number]) => void
    shipPosition: [number, number, number]
    setShipPosition: (pos: [number, number, number]) => void

    // HUD visibility
    showFormazione: boolean
    setShowFormazione: (show: boolean) => void
    showPricingDetail: boolean
    setShowPricingDetail: (show: boolean) => void
    isServicesOpen: boolean
    setIsServicesOpen: (isOpen: boolean) => void
}

export const useStore = create<AppState>((set) => ({
    scrollY: 0,
    setScrollY: (y) => set({ scrollY: y }),
    currentSection: 0,
    setCurrentSection: (section) => set({ currentSection: section }),
    isScrolling: false,
    setIsScrolling: (isScrolling) => set({ isScrolling }),
    navMode: 'scroll',
    setNavMode: (mode) => set({ navMode: mode }),
    selectedProject: null,
    setSelectedProject: (id) => set({ selectedProject: id }),
    aboutSectionTop: 0,
    setAboutSectionTop: (top) => set({ aboutSectionTop: top }),
    contactSectionTop: 0,
    setContactSectionTop: (top) => set({ contactSectionTop: top }),

    // HUD & Game State Defaults
    score: 0,
    addScore: (points) => set((state) => ({ score: state.score + points })),
    health: 4,
    damage: (amount) => set((state) => ({ health: Math.max(0, state.health - amount) })),
    wave: 'PORTFOLIO SHOWCASE',
    setWave: (name) => set({ wave: name }),
    isFiring: false,
    setIsFiring: (isFiring) => set({ isFiring }),
    lasers: [],
    addLaser: (laser) => set((state) => ({ lasers: [...state.lasers, laser] })),
    removeLaser: (id) => set((state) => ({ lasers: state.lasers.filter(l => l.id !== id) })),

    // DroneView States Implementation
    takeoff: false,
    setTakeoff: (takeoff) => set({ takeoff }),
    droneMessage: null,
    setDroneMessage: (msg) => set({ droneMessage: msg }),
    hasExitedDrone: false,
    setHasExitedDrone: (exited) => set({ hasExitedDrone: exited }),
    isDroneViewOpen: false,
    setIsDroneViewOpen: (isOpen) => set({ isDroneViewOpen: isOpen }),
    takeoffProgress: 0,
    setTakeoffProgress: (progress) => set({ takeoffProgress: progress }),

    // Aiming system
    aimPosition: [0, -38, -20],
    setAimPosition: (pos) => set({ aimPosition: pos }),
    shipPosition: [0, -38, 0],
    setShipPosition: (pos) => set({ shipPosition: pos }),

    // HUD visibility
    showFormazione: false,
    setShowFormazione: (show) => set({ showFormazione: show }),
    showPricingDetail: false,
    setShowPricingDetail: (show) => set({ showPricingDetail: show }),
    isServicesOpen: false,
    setIsServicesOpen: (isOpen) => set({ isServicesOpen: isOpen }),
}))
