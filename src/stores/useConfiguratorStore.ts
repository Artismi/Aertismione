import { create } from 'zustand'

export type ConfiguratorCategory = 'identity' | 'visual' | 'space' | 'gadget' | 'monthly'

export interface ServiceItem {
  id: string
  label: string
  description?: string
  min: number
  max: number
  category: ConfiguratorCategory
  note?: string
  prodMin?: number
  prodMax?: number
}

export const CONFIG_SERVICES: ServiceItem[] = [
  // IDENTITÀ
  {
    id: 'identity_narrative',
    label: 'Identità Narrativa ★',
    description: 'Logo + palette + tono di voce + brand guide e illustrazione madre',
    min: 649.99,
    max: 649.99,
    category: 'identity',
    note: 'È la base. Include percorso identità + declinazioni a scelta.'
  },
  
  // VISUAL
  {
    id: 'illustration',
    label: 'Illustrazione',
    description: 'Immagini personalizzate, personaggi, pattern.',
    min: 120,
    max: 350,
    category: 'visual'
  },
  {
    id: 'poster',
    label: 'Poster / Volantino',
    description: 'Progettazione grafica per stampa (stampa esclusa).',
    min: 100,
    max: 280,
    category: 'visual'
  },
  {
    id: 'packaging',
    label: 'Packaging / Materiale Stampato',
    description: 'Etichette, biglietti da visita, menu, brochure.',
    min: 200,
    max: 350,
    category: 'visual',
    note: 'Dipende dai pezzi e dal design.'
  },
  {
    id: 'social_template',
    label: 'Template Social Media',
    description: 'Set di 5 template per Instagram/Facebook.',
    min: 180,
    max: 300,
    category: 'visual'
  },

  // SPACE
  {
    id: 'murale',
    label: 'Murale',
    description: 'Progettazione + esecuzione pittorica.',
    min: 500,
    max: 1200,
    category: 'space',
    note: 'Materiali sempre a parte.'
  },
  {
    id: 'insegna',
    label: 'Insegna (Progettazione)',
    description: 'Grafica + coordinamento produttore.',
    min: 120,
    max: 200,
    category: 'space'
  },
  {
    id: 'vetrofania',
    label: 'Vetrofania',
    description: 'Grafica per pellicola adesiva.',
    min: 80,
    max: 150,
    category: 'space',
    prodMin: 80,
    prodMax: 150
  },
  {
    id: 'wayfinding',
    label: 'Wayfinding / Segnaletica',
    description: 'Sistema di cartelli e pannelli coordinati.',
    min: 250,
    max: 700,
    category: 'space'
  },

  // GADGET
  {
    id: 'adesivi',
    label: 'Kit Adesivi',
    min: 80,
    max: 150,
    category: 'gadget',
    prodMin: 80,
    prodMax: 120
  },
  {
    id: 'shopper',
    label: 'Shopper / Sacchetti',
    min: 80,
    max: 150,
    category: 'gadget',
    prodMin: 150,
    prodMax: 250
  },
  {
    id: 'tote',
    label: 'Tote Bag',
    min: 80,
    max: 150,
    category: 'gadget',
    prodMin: 200,
    prodMax: 300
  },
  {
    id: 'gadget_custom',
    label: 'Gadget su misura',
    min: 0,
    max: 0,
    category: 'gadget',
    note: 'Portachiavi, pins, magneti — da definire insieme.'
  },

  // MONTHLY
  {
    id: 'social_base',
    label: 'Social Media Base',
    min: 200,
    max: 350,
    category: 'monthly'
  },
  {
    id: 'social_active',
    label: 'Social Media Attivo',
    min: 400,
    max: 650,
    category: 'monthly'
  },
  {
    id: 'site_maintenance',
    label: 'Manutenzione Sito',
    min: 100,
    max: 180,
    category: 'monthly'
  }
]

export type IdentityMode = boolean | 'single' | null
// false    → parto da zero: forza identity_narrative come base
// true     → ho già un'identità: nessun forzato
// 'single' → solo prestazione singola: nessun forzato, messaggio dedicato
// null     → non ancora scelto

interface ConfiguratorState {
  currentStep: 1 | 2 | 3
  haIdentity: IdentityMode
  selectedServices: string[]
  insegnaType: 'base' | 'lum' | null
  isModalOpen: boolean

  // Actions
  setStep: (step: 1 | 2 | 3) => void
  setHaIdentity: (val: IdentityMode) => void
  toggleService: (id: string) => void
  setInsegnaType: (type: 'base' | 'lum' | null) => void
  openModal: () => void
  closeModal: () => void
  reset: () => void

  // Computed
  getTotals: () => {
    oneOffMin: number
    oneOffMax: number
    monthlyMin: number
    monthlyMax: number
    hasCustom: boolean
  }
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  currentStep: 1,
  haIdentity: null,
  selectedServices: [],
  insegnaType: null,
  isModalOpen: false,

  setStep: (currentStep) => set({ currentStep }),
  
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  
  setHaIdentity: (haIdentity) => {
    set((state) => {
      let selected = [...state.selectedServices]
      if (haIdentity === false) {
        // Parto da zero: forza identity_narrative
        if (!selected.includes('identity_narrative')) {
          selected.push('identity_narrative')
        }
      } else {
        // Ha già identità o vuole solo prestazione singola: rimuovi identity se presente
        selected = selected.filter(id => id !== 'identity_narrative')
      }
      return { haIdentity, selectedServices: selected }
    })
  },

  toggleService: (id) => set((state) => {
    // Il pacchetto identity_narrative non è deselezionabile se haIdentity è false
    if (id === 'identity_narrative' && state.haIdentity === false) return state

    const selected = state.selectedServices.includes(id)
      ? state.selectedServices.filter(s => s !== id)
      : [...state.selectedServices, id]
    return { selectedServices: selected }
  }),

  setInsegnaType: (insegnaType) => set({ insegnaType }),

  reset: () => set({ currentStep: 1, haIdentity: null as IdentityMode, selectedServices: [], insegnaType: null }),

  getTotals: () => {
    const { selectedServices, insegnaType } = get()
    let oneOffMin = 0
    let oneOffMax = 0
    let monthlyMin = 0
    let monthlyMax = 0
    let hasCustom = false

    selectedServices.forEach(id => {
      const service = CONFIG_SERVICES.find(s => s.id === id)
      if (!service) return

      if (id === 'gadget_custom') hasCustom = true

      let min = service.min
      let max = service.max

      // Logica speciale Insegna
      if (id === 'insegna') {
        if (insegnaType === 'base') {
          min += 350; max += 500
        } else if (insegnaType === 'lum') {
          min += 650; max += 900
        }
      }

      // Aggiungiamo produzione se presente (Vetrofania, Gadget)
      if (service.prodMin) min += service.prodMin
      if (service.prodMax) max += service.prodMax

      if (service.category === 'monthly') {
        monthlyMin += min
        monthlyMax += max
      } else {
        oneOffMin += min
        oneOffMax += max
      }
    })

    return { oneOffMin, oneOffMax, monthlyMin, monthlyMax, hasCustom }
  }
}))
