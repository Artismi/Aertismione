import SceneLoader from './SceneLoader'
import { Navbar } from '@/components/ui/Navbar'
import { Preloader } from '@/components/ui/Preloader'
import { HeroSection } from '@/components/sections/HeroSection'
import { ServicesNewSection } from '@/components/sections/ServicesNewSection'
import { ConfiguratorModal } from '@/components/configurator/ConfiguratorModal'
import { PortfolioSection } from '@/components/sections/PortfolioSection'
import { ContactSection } from '@/components/sections/ContactSection'
import { AboutSection } from '@/components/sections/AboutSection'
import { SmoothScroll } from '@/components/ui/SmoothScroll'
import { MarblePage } from '@/components/ui/MarblePage'
import { HomeShell } from '@/components/ui/HomeShell'

/**
 * La discesa nel mondo 3D (Table3D, dietro la pagina), con lo scroll morbido:
 *
 *  Hero (con Visione)    → in aria, con il logo e lo shader rosa
 *  Progetti              → la camera scende e si ferma sul banco da lavoro
 *  Servizi, Chi sono,    → la camera scende oltre il bordo, il banco esce in alto;
 *  Contatti                 da Servizi in giu' un velo viola continuo, senza buchi
 *
 * Aprendo un lavoro la home resta montata sotto la sua pagina (HomeShell, app/@modal):
 * tornando il mondo 3D e' gia' pronto.
 *
 */
export default function Home() {
  return (
    <HomeShell>
      <SmoothScroll />
      <Preloader />
      <Navbar />
      <ConfiguratorModal />
      <SceneLoader />
      {/* la bilia sulla pagina, fra la i del logo e il banco */}
      <MarblePage />

      <section id="hero" style={{ position: 'relative' }}>
        <HeroSection />
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
    </HomeShell>
  )
}
