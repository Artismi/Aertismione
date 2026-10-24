'use client'

/**
 * Chi ha chiesto al sistema meno movimento (prefers-reduced-motion) lo trova anche
 * nelle animazioni di framer-motion: niente spostamenti, restano le dissolvenze.
 */

import { MotionConfig } from 'framer-motion'

export function MotionPrefs({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
