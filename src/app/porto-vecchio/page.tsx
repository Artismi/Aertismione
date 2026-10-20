import type { Metadata } from 'next'
import { PROGETTI } from '@/config/content'
import { GamePage } from './GamePage'

export const metadata: Metadata = {
  title: `${PROGETTI.game.title} — Artismi`,
  description: 'Porto Vecchio, il videogioco di Artismi Design Studio.',
}

export default function Page() {
  return <GamePage />
}
