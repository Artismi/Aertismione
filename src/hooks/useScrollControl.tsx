import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../stores/useStore'

// Define sections with their scroll positions and names
interface Section {
    name: string
    scrollY: number
    snapRange: number // Range within which to snap to this section
}

const SECTIONS: Section[] = [
    { name: 'hero', scrollY: 0, snapRange: 200 },
    { name: 'services', scrollY: 800, snapRange: 300 }, // Camera at y=-8, Services centered
    { name: 'avatar', scrollY: 1600, snapRange: 400 },  // Camera at y=-16, Avatar body centered
]

export function useScrollControl(totalHeight = 2000) {
    const setScrollY = useStore((state) => state.setScrollY)
    const setIsScrolling = useStore((state) => state.setIsScrolling)

    // Internal refs for physics
    const targetScroll = useRef(0)
    const currentScroll = useRef(0)
    const isDown = useRef(false)
    const velocityRef = useRef(0)
    const lastScrollTime = useRef(Date.now())
    const snapTimeout = useRef<number | null>(null)

    // Find the nearest section
    const findNearestSection = (scroll: number): Section | null => {
        let nearest: Section | null = null
        let minDistance = Infinity

        for (const section of SECTIONS) {
            const distance = Math.abs(scroll - section.scrollY)
            if (distance < section.snapRange && distance < minDistance) {
                minDistance = distance
                nearest = section
            }
        }

        return nearest
    }

    // Check if we're in an empty area (between sections)
    const isInEmptyArea = (scroll: number): boolean => {
        for (const section of SECTIONS) {
            const distance = Math.abs(scroll - section.scrollY)
            if (distance < section.snapRange) {
                return false
            }
        }
        return true
    }

    // Calculate scroll speed multiplier based on position
    const getScrollMultiplier = (scroll: number): number => {
        if (isInEmptyArea(scroll)) {
            return 2.5 // Faster in empty areas
        }
        return 1.0 // Normal speed near sections
    }

    // Wheel event handler
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()

            // Clear any pending snap
            if (snapTimeout.current) {
                clearTimeout(snapTimeout.current)
                snapTimeout.current = null
            }

            // Calculate velocity
            const now = Date.now()
            const timeDelta = Math.max(1, now - lastScrollTime.current)
            velocityRef.current = e.deltaY / timeDelta
            lastScrollTime.current = now

            // Apply scroll with multiplier
            const multiplier = getScrollMultiplier(targetScroll.current)
            const scrollDelta = e.deltaY * multiplier

            targetScroll.current += scrollDelta
            targetScroll.current = Math.max(0, Math.min(targetScroll.current, totalHeight))

            isDown.current = true
            setIsScrolling(true)

            // Reset isScrolling and trigger snap after delay
            clearTimeout((window as any).scrollTimeout)
                ; (window as any).scrollTimeout = setTimeout(() => {
                    isDown.current = false
                    setIsScrolling(false)

                    // Snap to nearest section if within range
                    const nearestSection = findNearestSection(targetScroll.current)
                    if (nearestSection) {
                        snapTimeout.current = window.setTimeout(() => {
                            targetScroll.current = nearestSection.scrollY
                        }, 100)
                    }
                }, 200)
        }

        window.addEventListener('wheel', handleWheel, { passive: false })
        return () => {
            window.removeEventListener('wheel', handleWheel)
            if (snapTimeout.current) {
                clearTimeout(snapTimeout.current)
            }
        }
    }, [totalHeight, setIsScrolling])

    // Animation Loop for Smooth Damping with stabilization
    useFrame((_state, delta) => {
        // Calculate distance to target
        const distance = Math.abs(targetScroll.current - currentScroll.current)

        // Adaptive damping: slower when close to target for stability
        let dampFactor = 10
        if (distance < 50) {
            dampFactor = 5 // Slower damping for fine control
        } else if (distance > 500) {
            dampFactor = 15 // Faster damping for large movements
        }

        const damp = 1 - Math.exp(-dampFactor * delta)
        const scrollDelta = (targetScroll.current - currentScroll.current) * damp

        // Apply scroll with minimum threshold to prevent micro-movements
        if (Math.abs(scrollDelta) > 0.01) {
            currentScroll.current += scrollDelta
        } else {
            currentScroll.current = targetScroll.current
        }

        // Update global store
        setScrollY(currentScroll.current)
    })

    return currentScroll.current
}

