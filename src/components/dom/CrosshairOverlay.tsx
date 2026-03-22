import { useEffect, useRef } from 'react'
import { useStore } from '../../stores/useStore'

export function CrosshairOverlay() {
    const isDroneViewOpen = useStore((state) => state.isDroneViewOpen)
    const crosshairRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isDroneViewOpen) return

        const handleMouseMove = (e: MouseEvent) => {
            if (crosshairRef.current) {
                crosshairRef.current.style.left = `${e.clientX}px`
                crosshairRef.current.style.top = `${e.clientY}px`
            }
        }

        window.addEventListener('mousemove', handleMouseMove)

        // Hide system cursor
        document.body.style.cursor = 'none'

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            document.body.style.cursor = 'auto'
        }
    }, [isDroneViewOpen])

    if (!isDroneViewOpen) return null

    return (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 99999 }}>
            {/* Crosshair */}
            <div
                ref={crosshairRef}
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80px',
                    height: '80px',
                }}
            >
                {/* Outer ring */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: '2px solid rgba(0, 255, 255, 0.8)',
                        boxShadow: '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 15px rgba(0, 255, 255, 0.2)',
                    }}
                />

                {/* Inner dot */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: '8px',
                        height: '8px',
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '50%',
                        backgroundColor: '#00ffff',
                        boxShadow: '0 0 15px rgba(0, 255, 255, 1)',
                    }}
                />

                {/* Crosshair lines */}
                <div style={{ position: 'absolute', left: '50%', top: '0', width: '2px', height: '20px', transform: 'translateX(-50%)', backgroundColor: 'rgba(0, 255, 255, 0.9)' }} />
                <div style={{ position: 'absolute', left: '50%', bottom: '0', width: '2px', height: '20px', transform: 'translateX(-50%)', backgroundColor: 'rgba(0, 255, 255, 0.9)' }} />
                <div style={{ position: 'absolute', top: '50%', left: '0', width: '20px', height: '2px', transform: 'translateY(-50%)', backgroundColor: 'rgba(0, 255, 255, 0.9)' }} />
                <div style={{ position: 'absolute', top: '50%', right: '0', width: '20px', height: '2px', transform: 'translateY(-50%)', backgroundColor: 'rgba(0, 255, 255, 0.9)' }} />

                {/* Corner brackets */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '15px', height: '15px', borderLeft: '2px solid #00ffcc', borderTop: '2px solid #00ffcc' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '15px', height: '15px', borderRight: '2px solid #00ffcc', borderTop: '2px solid #00ffcc' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '15px', height: '15px', borderLeft: '2px solid #00ffcc', borderBottom: '2px solid #00ffcc' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '15px', height: '15px', borderRight: '2px solid #00ffcc', borderBottom: '2px solid #00ffcc' }} />
            </div>
        </div>
    )
}
