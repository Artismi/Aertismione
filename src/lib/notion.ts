/**
 * lib/notion.ts — Client Notion con tipizzazione
 *
 * Questo modulo gira solo lato server (Server Components, Route Handlers).
 * Non deve mai finire in un 'use client' component.
 *
 * Variabili d'ambiente richieste (aggiunte in .env.local e in Vercel):
 *   NOTION_TOKEN         — Integration Secret Key da notion.so/my-integrations
 *   NOTION_DB_PORTFOLIO  — ID del database Portfolio
 *   NOTION_DB_SERVIZI    — ID del database Servizi e Pacchetti
 *   NOTION_DB_TESTI      — ID del database Testi Sezioni
 */

import { Client } from '@notionhq/client'
import type {
  PageObjectResponse,
  DatabaseObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'

// ──────────────────────────────────────────────────
// Client singleton — istanziato solo lato server
// ──────────────────────────────────────────────────
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

// ──────────────────────────────────────────────────
// Tipi per il Portfolio
// ──────────────────────────────────────────────────
export interface PortfolioProject {
  id: string
  title: string
  category: string
  shortDesc: string
  context: string
  problem: string
  solution: string
  result: string
  coverUrl: string | null
  year: number | null
  client: string
  visible: boolean
  order: number
}

// ──────────────────────────────────────────────────
// Tipi per i Servizi
// ──────────────────────────────────────────────────
export interface Service {
  id: string
  name: string
  type: string
  description: string
  priceFrom: number
  priceTo: number
  unit: string
  includes: string
  featured: boolean
  visible: boolean
  order: number
}

// ──────────────────────────────────────────────────
// Helpers per ridurre il boilerplate
// ──────────────────────────────────────────────────
function getText(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p) return ''
  if (p.type === 'title') return p.title.map((t) => t.plain_text).join('')
  if (p.type === 'rich_text') return p.rich_text.map((t) => t.plain_text).join('')
  return ''
}

function getSelect(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (p?.type === 'select') return p.select?.name ?? ''
  return ''
}

function getNumber(page: PageObjectResponse, prop: string): number {
  const p = page.properties[prop]
  if (p?.type === 'number') return p.number ?? 0
  return 0
}

function getCheckbox(page: PageObjectResponse, prop: string): boolean {
  const p = page.properties[prop]
  if (p?.type === 'checkbox') return p.checkbox
  return false
}

function getCover(page: PageObjectResponse): string | null {
  if (page.cover?.type === 'external') return page.cover.external.url
  if (page.cover?.type === 'file') return page.cover.file.url
  return null
}

// ──────────────────────────────────────────────────
// PORTFOLIO — Fetch e mapping
// ──────────────────────────────────────────────────
export async function getPortfolio(): Promise<PortfolioProject[]> {
  const dbId = process.env.NOTION_DB_PORTFOLIO
  if (!dbId) return []

  try {
    const res = await notion.databases.query({
      database_id: dbId,
      filter: { property: 'Visibile', checkbox: { equals: true } },
      sorts: [{ property: 'Ordine', direction: 'ascending' }],
    })

    return res.results
      .filter((p): p is PageObjectResponse => 'properties' in p)
      .map((p) => ({
        id: p.id,
        title: getText(p, 'Titolo'),
        category: getSelect(p, 'Categoria'),
        shortDesc: getText(p, 'Descrizione breve'),
        context: getText(p, 'Contesto'),
        problem: getText(p, 'Problema'),
        solution: getText(p, 'Soluzione'),
        result: getText(p, 'Risultato'),
        coverUrl: getCover(p),
        year: getNumber(p, 'Anno') || null,
        client: getText(p, 'Cliente'),
        visible: getCheckbox(p, 'Visibile'),
        order: getNumber(p, 'Ordine'),
      }))
  } catch (err) {
    console.error('[Notion] getPortfolio error:', err)
    return []
  }
}

// ──────────────────────────────────────────────────
// SERVIZI — Fetch e mapping
// ──────────────────────────────────────────────────
export async function getServizi(): Promise<Service[]> {
  const dbId = process.env.NOTION_DB_SERVIZI
  if (!dbId) return []

  try {
    const res = await notion.databases.query({
      database_id: dbId,
      filter: { property: 'Visibile', checkbox: { equals: true } },
      sorts: [{ property: 'Ordine', direction: 'ascending' }],
    })

    return res.results
      .filter((p): p is PageObjectResponse => 'properties' in p)
      .map((p) => ({
        id: p.id,
        name: getText(p, 'Nome'),
        type: getSelect(p, 'Tipo'),
        description: getText(p, 'Descrizione'),
        priceFrom: getNumber(p, 'Prezzo da'),
        priceTo: getNumber(p, 'Prezzo a'),
        unit: getSelect(p, 'Unità'),
        includes: getText(p, 'Cosa include'),
        featured: getCheckbox(p, 'In evidenza'),
        visible: getCheckbox(p, 'Visibile'),
        order: getNumber(p, 'Ordine'),
      }))
  } catch (err) {
    console.error('[Notion] getServizi error:', err)
    return []
  }
}
