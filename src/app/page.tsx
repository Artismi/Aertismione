import SceneLoader from './SceneLoader'
import { Navbar } from '@/components/ui/Navbar'
import { Preloader } from '@/components/ui/Preloader'
import { HeroSection } from '@/components/sections/HeroSection'
import { ProblemSection } from '@/components/sections/ProblemSection'
import { ServicesNewSection } from '@/components/sections/ServicesNewSection'
import { ConfiguratorModal } from '@/components/configurator/ConfiguratorModal'
import { PortfolioSection } from '@/components/sections/PortfolioSection'
import { ContactSection } from '@/components/sections/ContactSection'
import { AboutSection } from '@/components/sections/AboutSection'

/**
 * Scroll Map — the scroll journey through the 3D world:
 *
 *  0px   – 100vh  → Logo rotates (screen 1, empty text area)
 *  100vh – 200vh  → Intro text / Hero copy (screen 2)
 *  200vh – 300vh  → Problema / Visione (camera mid-descent)
 *  300vh – 420vh  → Servizi (camera still descending)
 *  420vh – 550vh  → Portfolio placeholder
 *  550vh – 700vh  → Chi Sono / Avatar floor (camera at y≈-16)
 *  700vh+         → Contatti
 */
export default function Home() {
  return (
    <>
      <Preloader />
      <Navbar />
      <ConfiguratorModal />
      <SceneLoader />

      <section id="hero" style={{ position: 'relative', height: '200vh' }}>
        <HeroSection />
      </section>

      <section id="visione">
        <ProblemSection />
      </section>

      <section id="portfolio">
        <PortfolioSection />
      </section>

      <section id="servizi">
        <ServicesNewSection />
      </section>

      <section id="chi-sono">
        <AboutSection />
      </section>

      <section id="contatti">
        <ContactSection />
      </section>
    </>
  )
}
