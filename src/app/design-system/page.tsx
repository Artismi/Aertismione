'use client'

import React from 'react'
import { HERO, ABOUT, SERVICES, PORTFOLIO, VISION, CONTACT } from '@/config/content'
import { HeroSection } from '@/components/sections/HeroSection'
import { ProblemSection } from '@/components/sections/ProblemSection'
import { ServicesNewSection } from '@/components/sections/ServicesNewSection'
import { AboutSection } from '@/components/sections/AboutSection'
import { ContactSection } from '@/components/sections/ContactSection'
import { ProjectPage } from '@/app/portfolio/[id]/ProjectPage'
import { IllustrationsGallery } from '@/app/portfolio/[id]/IllustrationsGallery'
import { Navbar } from '@/components/ui/Navbar'
import { DesignFrame } from '@/components/design/DesignFrame'

/**
 * DESIGN SYSTEM CATALOG — FIGMA READY
 * Restructured into "Slides" (PowerPoint style) for a desktop-accurate view.
 */
export default function DesignSystemPage() {
  return (
    <main className="design-catalog" style={{ backgroundColor: '#0f0716', color: '#F2EDE4', minHeight: '100vh' }}>
      
      {/* ─── HOME SECTIONS ────────────────────────────────────────────────── */}
      
      <DesignFrame title="Home - Hero">
        <Navbar />
        <HeroSection />
      </DesignFrame>

      <DesignFrame title="Home - Il Problema">
         <Navbar />
         <ProblemSection />
      </DesignFrame>

      <DesignFrame title="Home - About">
         <Navbar />
         <AboutSection />
      </DesignFrame>

      <DesignFrame title="Home - Servizi">
         <Navbar />
         <ServicesNewSection />
      </DesignFrame>

      <DesignFrame title="Home - Contatti">
         <Navbar />
         <ContactSection />
      </DesignFrame>

      {/* ─── PORTFOLIO PROJECTS ───────────────────────────────────────────── */}
      
      {PORTFOLIO.projects.map((project, idx) => (
        <React.Fragment key={project.id}>
          {/* Main Landing / Hero of Project */}
          <DesignFrame title={`Portfolio - ${project.title} - Hero`}>
            <Navbar />
            {project.id === 'illustrazioni' ? (
              <IllustrationsGallery project={project as any} />
            ) : (
              <ProjectPage 
                project={project as any} 
                index={idx} 
                total={PORTFOLIO.projects.length}
                prev={null}
                next={null}
              />
            )}
          </DesignFrame>
          
          {/* Additional detail frames if content is long, but for doc purposes we focus on the main entry */}
        </React.Fragment>
      ))}

      <style jsx global>{`
        /* --- 1:1 FIDELITY OVERRIDES --- */
        .design-catalog {
          background-color: #0f0716 !important;
          background-image: 
            radial-gradient(circle at 50% 0%, rgba(26, 14, 40, 0.9) 0%, transparent 60%),
            linear-gradient(to bottom, #12081C 0%, #0c0512 100%) !important;
        }

        .design-catalog .navbar {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          transform: none !important;
          opacity: 1 !important;
          visibility: visible !important;
          z-index: 1000 !important;
          background: transparent !important;
          border-bottom: 1px solid rgba(242, 237, 228, 0.05) !important;
        }

        .design-catalog .section, 
        .design-catalog .project-page {
          padding-top: 120px !important; 
          min-height: 900px !important;
          overflow: visible !important;
          background: transparent !important;
        }

        /* FORCE VISIBILITY SPECIFICS - Targeting Framer Motion inline styles */
        .design-catalog [style] {
             opacity: 1 !important;
             transform: none !important;
        }

        /* Disable parallax and transitions for clean export */
        .design-catalog * {
          transition: none !important;
          animation: none !important;
        }

        /* Hero specific fixes: Framer Motion and Layout */
        .design-catalog [class*="maskWrap"] span,
        .design-catalog [class*="titleDark"] span,
        .design-catalog [class*="titleAccent"] span {
           transform: translateY(0) !important;
           opacity: 1 !important;
        }

        /* Remove the 100vh blank spacer since 3D canvas is hidden */
        .design-catalog [class*="firstViewport"] {
           display: none !important;
        }

        /* Allow Hero text to sit naturally instead of being forced to the bottom */
        .design-catalog [class*="secondViewport"] {
           height: auto !important;
           padding-top: 0 !important;
           justify-content: flex-start !important;
        }

        /* Re-add texture for design feel */
        .design-catalog::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E");
        }
      `}</style>
    </main>
  )
}
