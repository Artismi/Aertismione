'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProjectPage } from './ProjectPage'

export function IllustrationsGallery({ project }: { project: any }) {
  const [idx, setIdx] = useState(0)

  // Scroll to top automatically when swiping between parallel pages
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [idx])

  const subProjects = project.subProjects || []
  if (!subProjects.length) return null

  const current = subProjects[idx]
  const total = subProjects.length

  const handlePrev = () => setIdx((i) => Math.max(0, i - 1))
  const handleNext = () => setIdx((i) => Math.min(total - 1, i + 1))

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <ProjectPage
            project={current}
            prev={null} // Nascondo i link di rotta originali
            next={null}
            index={idx}
            total={total}
          />
        </motion.div>
      </AnimatePresence>

      {/* Frecce fisse orizzontali per "sfogliare" a pagine parallele */}
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: 0,
          right: 0,
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 900
        }}
      >
        <button
          onClick={handlePrev}
          disabled={idx === 0}
          style={{
            pointerEvents: idx === 0 ? 'none' : 'auto',
            background: 'rgba(26,26,26,0.65)',
            color: '#fff',
            border: 'none',
            backdropFilter: 'blur(8px)',
            width: '48px',
            height: '80px',
            fontSize: '1.2rem',
            cursor: 'pointer',
            opacity: idx === 0 ? 0 : 0.8,
            transition: 'opacity 0.2s, background 0.2s',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(26,26,26,0.95)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(26,26,26,0.65)'}
        >
          ←
        </button>

        <button
          onClick={handleNext}
          disabled={idx === total - 1}
          style={{
            pointerEvents: idx === total - 1 ? 'none' : 'auto',
            background: 'rgba(26,26,26,0.65)',
            color: '#fff',
            border: 'none',
            backdropFilter: 'blur(8px)',
            width: '48px',
            height: '80px',
            fontSize: '1.2rem',
            cursor: 'pointer',
            opacity: idx === total - 1 ? 0 : 0.8,
            transition: 'opacity 0.2s, background 0.2s',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(26,26,26,0.95)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(26,26,26,0.65)'}
        >
          →
        </button>
      </div>
    </>
  )
}
