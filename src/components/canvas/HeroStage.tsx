'use client'

import { useRef, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useStore } from '../../stores/useStore'

import { LogoModel } from './LogoModel'
import { AvatarParticles } from './AvatarParticles'
import { BackgroundModel } from './BackgroundModel'
import { CausticsPlane } from './CausticsPlane'
import type { AvatarTarget } from './AvatarParticles'

interface HeroStageProps {
    onTrackedPoints?: (points: AvatarTarget[]) => void
}

export function HeroStage({ onTrackedPoints }: HeroStageProps = {}) {
    const groupRef = useRef<any>(null)
    const stageRef = useRef<any>(null)

    // Comparsa e scala dell'avatar si calcolano dentro il ciclo di disegno,
    // leggendo lo scroll al volo. Prima erano proprieta' React: ogni scatto di
    // scroll ricostruiva questo pezzo di scena, ed e' una delle ragioni per cui
    // il sito andava a scatti.
    useFrame(() => {
        const g = stageRef.current
        if (!g) return

        const { scrollY, aboutSectionTop, contactSectionTop } = useStore.getState()
        const landingPoint = aboutSectionTop || 4500
        const contactPoint = contactSectionTop || (landingPoint + 1800)
        const avatarStart = landingPoint - 1400
        const avatarEnd = contactPoint + 1500

        const visible = scrollY > avatarStart && scrollY < avatarEnd
        const fade = Math.max(0, Math.min(
            scrollY < landingPoint - 800
                ? (scrollY - avatarStart) / 400
                : scrollY < avatarEnd - 1200
                    ? 1
                    : (avatarEnd - scrollY) / 1200,
            1
        ))

        g.visible = visible
        g.scale.setScalar(fade)
    })

    return (
        <group ref={groupRef}>
            {/* Background caustics — piscina rosata dietro il logo */}
            <CausticsPlane />

            {/* STAGE 1: Logo — co-located at y=0 */}
            <LogoModel position={[0, 0, 0]} />

            {/* STAGE 2: Avatar + Paesaggio — Inchiodato alla sezione Chi Sono */}
            <group ref={stageRef} position={[0, -43, 0]} visible={false}>
                <AvatarParticles
                    position={[5.8, -2.0, 0]}
                    scale={5.0}
                    onTrackedPoints={onTrackedPoints}
                />

                <Suspense fallback={null}>
                    <BackgroundModel position={[0, -3.0, 0]} scale={1.2} />
                </Suspense>

                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 10, 5]} intensity={2.5} />
                <pointLight position={[5.2, 2, 2]} intensity={5} color="#00ffff" distance={10} />
                <spotLight position={[3.2, 5, 5]} angle={0.5} penumbra={1} intensity={8} color="white" />
            </group>

            <Environment preset="studio" />
        </group>
    )
}
