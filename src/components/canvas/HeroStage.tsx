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
    const scrollY = useStore((state) => state.scrollY)
    const aboutSectionTop = useStore((state) => state.aboutSectionTop)
    const contactSectionTop = useStore((state) => state.contactSectionTop)

    const landingPoint = aboutSectionTop || 4500
    const contactPoint = contactSectionTop || (landingPoint + 1800)
    const avatarStart = landingPoint - 1400
    const avatarEnd = contactPoint + 1500
    const isVisible = scrollY > avatarStart && scrollY < avatarEnd

    const fadeScale = Math.max(0, Math.min(
        scrollY < landingPoint - 800
            ? (scrollY - avatarStart) / 400
            : scrollY < avatarEnd - 1200
                ? 1
                : (avatarEnd - scrollY) / 1200,
        1
    ))

    return (
        <group ref={groupRef}>
            {/* Background caustics — piscina rosata dietro il logo */}
            <CausticsPlane />

            {/* STAGE 1: Logo — co-located at y=0 */}
            <LogoModel position={[0, 0, 0]} />

            {/* STAGE 2: Avatar + Paesaggio — Inchiodato alla sezione Chi Sono */}
            <group
                position={[0, -43, 0]}
                scale={fadeScale}
                visible={isVisible}
            >
                {/* 
                  3D SCENE TEMPORANEAMENTE SOSTITUITA DA UNO SCREENSHOT 
                  in src/components/sections/AboutSection.tsx
                  Tieni i modelli disabilitati per leggerezza:
                */}
                {/* <AvatarParticles
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
                <spotLight position={[3.2, 5, 5]} angle={0.5} penumbra={1} intensity={8} color="white" /> */}
            </group>

            <Environment preset="studio" />
        </group>
    )
}
