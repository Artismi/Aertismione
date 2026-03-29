/**
 * ============================================================
 *  ARTISMI — File di configurazione contenuti
 * ============================================================
 *
 *  TESTI DEFINITIVI — Documento di lavoro Marzo 2026
 *  Redatto da Andrea Pizzoglio in collaborazione con Claude.
 *
 *  Modifica questo file per aggiornare qualsiasi contenuto
 *  senza toccare i componenti React.
 * ============================================================
 */

/* ─── BRAND ──────────────────────────────────────────────────────────────── */

export const BRAND = {
  name:    'ARTISMI',
  tagline: 'Artismi completa la tua attività con la narrazione che le manca.',
  siteTitle:       'Artismi Design Studio',
  metaDescription: 'Identità visive, illustrazione, murales e social media per negozi, associazioni e piccole imprese.',
}

/* ─── NAVBAR ─────────────────────────────────────────────────────────────── */

export const NAV = {
  links: [
    { href: '#hero',       label: 'Home' },
    { href: '#visione',    label: 'Visione' },
    { href: '#servizi',    label: 'Servizi' },
    { href: '#preventivo', label: 'Preventivo' }, // Aggiunto link configuratore
    { href: '#portfolio',  label: 'Portfolio' },
    { href: '#chi-sono',   label: 'Chi Sono' },
    { href: '#contatti',   label: 'Contatti' },
  ],
  cta: 'Scrivimi',
}

/* ─── HERO ───────────────────────────────────────────────────────────────── */

export const HERO = {
  /**
   * 3 frasi separate — 3 movimenti: affermazione → problema → invito.
   * Non comprimere in una riga sola.
   */
  lines: [
    'La tua attività è unica.',
    'Merita di non sembrare\nuna tra le tante.',
    'Costruiamo insieme qualcosa\nche ti somiglia davvero.',
  ],
  accentLineIndex: 2,
  subtitle: 'Artismi completa la tua attività con la narrazione che le manca.',
  ctas: [
    { label: 'Scopri i servizi', href: '#servizi',  variant: 'primary'   },
    { label: 'Scrivimi',         href: '#contatti', variant: 'secondary' },
  ],
  scrollHint: 'Scorri',
}

/* ─── VISIONE (Problema / Soluzione) ─────────────────────────────────────── */

export const VISION = {
  blocks: [
    {
      id:      'problema',
      heading: 'Il Problema',
      accent:  'yellow',
      body:    `Oggi non basta fare bene il tuo lavoro.\nLe persone scelgono anche quello in cui si riconoscono, che possono capire.\nSe la tua attività non si racconta, non trasmette il suo vero valore.`,
    },
    {
      id:      'soluzione',
      heading: 'La Soluzione',
      accent:  'warm',
      body:    `Ti accompagno in un percorso strutturato per scoprire l'identità della tua attività.\nPoi la concretizziamo perché diventi il linguaggio con cui comunichi con il cliente, su tutti i livelli che vuoi.`,
    },
  ],
}

/* ─── SERVICES ───────────────────────────────────────────────────────────── */

export const SERVICES = {
  heading: 'Servizi',
  intro:   "Ogni elemento che costruiamo nasce dall'identità della tua attività. Puoi scegliere una cosa sola o un percorso completo. La differenza è che nel percorso, tutto parla la stessa lingua — e si vede.",
  savingsNote: "Se hai già un'identità visiva fatta con Artismi, ogni lavoro successivo costa meno — perché partiamo da qualcosa che esiste già.",
  cta: 'Chiedi un preventivo',
  packages: [
    {
      id:    'singole',
      label: 'Prestazioni Singole',
      type:  'Una tantum',
      items: [
        { name: 'Illustrazione',      price: '120 – 350 €' },
        { name: 'Poster / Volantino', price: '100 – 280 €' },
        { name: 'Murale',             price: '500 – 1.200 €' },
      ],
    },
    {
      id:       'identita',
      label:    'Identità Narrativa',
      type:     'Percorso completo',
      featured: true,
      items: [
        { name: 'Identità narrativa',  price: '649.99 € (Promo)' },
        { name: 'Ecosistema completo', price: '3.500 – 6.000 €' },
      ],
      note: 'Il sistema è tuo — trasferibile, autonomo, applicabile da chiunque. Ogni lavoro successivo parte da qui.',
    },
    {
      id:    'continuativi',
      label: 'Continuativi',
      type:  'Al mese',
      items: [
        { name: 'Social media base',   price: '200 – 350 €/mese' },
        { name: 'Social media attivo', price: '400 – 650 €/mese' },
        { name: 'Manutenzione sito',   price: '100 – 180 €/mese'  },
      ],
    },
  ],
  footerNote: "Tutti i prezzi sono indicativi — ogni progetto è un'altra storia. Materiali di stampa e produzione sempre a parte.",
}

/* ─── PORTFOLIO ──────────────────────────────────────────────────────────── */

export const PORTFOLIO = {
  heading: 'Portfolio',
  intro:   'Ogni progetto è un territorio. Clicca per saltare — trascina la pallina per spararla come una bilia.',
  legendLabel: 'Progetto',
  projects: [
    {
      id:       'bicicleria',
      title:    'Bicicleria',
      category: 'Identità visiva completa',
      tagline:  'Dal murale alla vetrina, dai gadget al feed.',
      context:  'La Bicicleria è una ciclofficina. Un posto fatto di mani, ruote, comunità e passione artigianale. Un mondo già ricco — che non aveva ancora una voce visiva capace di raccontarlo.',
      problem:  "Un'attività unica nel suo genere, con una storia e un immaginario fortissimi, che comunicava poco e in modo disomogeneo. Chi entrava in negozio viveva un'esperienza autentica. Chi la cercava online non trovava niente di tutto questo.",
      solution: "Un percorso completo di identità narrativa. Ascolto del contesto, co-progettazione, costruzione dell'immaginario visivo. L'illustrazione madre fonde meccanica, movimento e carattere — e diventa il sistema da cui tutto deriva: il murale sulla colonna interna, la vetrina, le illustrazioni, i gadget, i social.",
      result:   'Chi entra in negozio e chi arriva online vede la stessa anima. L\'identità vive su tutti i livelli — dal muro al feed — con la stessa voce.',
      mapX: 0.15, mapY: 0.30,
      accent: '#C4622D',
      mainImage: '/portfolio/bicicleria/detail-1.jpg',
      videos: [
        '/portfolio/bicicleria/video-promo.mp4'
      ],
      marquee: '/portfolio/bicicleria/stickers-loop.png',
      gallery: [
        '/portfolio/bicicleria/detail-2.jpg',
        '/portfolio/bicicleria/detail-3.jpg',
        '/portfolio/bicicleria/promo.png',
        '/portfolio/bicicleria/aperidivo.png',
        '/portfolio/bicicleria/adesivo-1.jpg',
        '/portfolio/bicicleria/adesivo-2.jpg'
      ],
      pdfs: [
        { label: 'Orari Negozio', url: '/portfolio/bicicleria/orario.pdf' },
        { label: 'Maglietta Black', url: '/portfolio/bicicleria/maglietta-black.pdf' }
      ]
    },

    {
      id:       'mulini',
      title:    'Mulini',
      category: 'Illustrazione / Tesi di laurea',
      tagline:  'Striscia illustrata di 6 metri sul passato e futuro delle macchine ad acqua.',
      context:  "Tesi di laurea in Design e Comunicazione al Politecnico di Torino. La ricerca studia il ruolo sociale ed economico delle macchine ad acqua nell'area dell'Ecomuseo Terra del Castelmagno — mulini, fucine, segherie attivi fino agli anni Sessanta.",
      problem:  "Come restituire una ricerca complessa — fatta di storie, prospettive contrastanti e visioni di futuro — a una comunità che quella ricerca l'ha vissuta? Un report accademico non basta.",
      solution: "Una striscia illustrata di 6 metri che usa il sogno come spazio narrativo. 11 spazi interconnessi raccontano la riattivazione dei mulini attraverso metafore visive, personaggi, oggetti e situazioni — mettendo in dialogo le prospettive contrastanti della popolazione.",
      result:   'Una ricerca che torna alle persone che l\'hanno generata, in un formato che possono vedere, leggere e sentire proprio. Tesi con lode.',
      mapX: 0.48, mapY: 0.22,
      accent: '#5B8EA6',
      panoramaStrip: '/portfolio/mulini/strip.png',
      pdfs: [
        { label: 'Presentazione', url: '/portfolio/mulini/thesis.pdf' }
      ]
    },
    {
      id:       'torino-invisibile',
      title:    'Torino Invisibile',
      category: '3D / Produzione multimediale',
      tagline:  "Contributo alla produzione di un'opera in realtà aumentata ispirata a Calvino.",
      context:  "Torino Invisibile è un progetto multimediale di Kaninchen-Haus e ConiglioViola — vincitore di un bando PNRR per la transizione digitale. L'idea: trasformare Le città invisibili di Italo Calvino in un'opera d'arte pubblica da fruire in realtà aumentata attraverso gli spazi urbani.",
      problem:  "Tradurre in immagini tridimensionali le città immaginarie di Calvino — mantenendo la qualità letteraria dell'originale e rendendole fruibili su dispositivi mobili e Oculus nello spazio pubblico.",
      solution: "Andrea ha contribuito alla produzione come parte del servizio civile presso Borealis: modellazione 3D delle scene, composizione degli ambienti, assegnazione di materiali e texture, preparazione delle card identitarie del progetto.",
      result:   "Scene tridimensionali pronte per la realtà aumentata, distribuite nei luoghi reali. Una città dentro la città — visibile solo a chi sa dove guardare.",
      mapX: 0.65, mapY: 0.42,
      accent: '#1A1A2E',
      mainImage: '/portfolio/torino-invisibile/scene-1.png',
      gallery: [
        '/portfolio/torino-invisibile/scene-2.png',
        '/portfolio/torino-invisibile/scene-3.png',
        '/portfolio/torino-invisibile/scene-4.png',
        '/portfolio/torino-invisibile/scene-5.png'
      ]
    },
    {
      id:       'illustrazioni',
      title:    'Illustrazioni & Artwork Singoli',
      category: 'Raccolta / Illustrazione',
      tagline:  'Selezione di illustrazioni personali, locandine e artwork indipendenti.',
      context:  'Raccolta di lavori illustrativi che esplorano diversi linguaggi e applicazioni.',
      problem:  'Unire mondi diversi — come l\'immaginario di Alice, l\'energia punk indipendente, e l\'inclusione sociale della ciclomeccanica — in un unico spazio.',
      solution: 'Scorri questa sezione per esplorare ogni singolo progetto. Ognuno mantiene il suo layout e lo stile visivo unico con cui è stato concepito.',
      result:   'Stampa, contest, e commissioni private.',
      mapX: 0.80, mapY: 0.22,
      accent: '#E8A8BF',
      subProjects: [
        {
          id:       'alice',
          layout:   'centered',
          title:    'Alice Un Mondo di Matti',
          category: 'Illustrazione',
          tagline:  "Illustrazione personalizzata ispirata all'universo di Alice nel Paese delle Meraviglie.",
          context:  "Una commissione privata — un'illustrazione su misura che parte da un immaginario letterario noto e lo reinterpreta con il linguaggio visivo di Andrea.",
          problem:  "Tradurre lo spirito originale di Carroll — meraviglioso e disturbante insieme — in un'immagine che sia personale e non una citazione.",
          solution: 'Un mondo visionario e leggermente disturbante, coerente con lo spirito originale di Carroll — personaggi ibridi, proporzioni impossibili, colori inaspettati.',
          result:   'Commissione privata consegnata.',
          accent: '#8B4DA8',
          mainImage: '/portfolio/alice/hero.png',
          gallery: [
            '/portfolio/alice/detail-1.png',
            '/portfolio/alice/detail-2.png'
          ]
        },
        {
          id:       'ridi-piangi-balli',
          layout:   'centered',
          title:    'Ridi Piangi Balli',
          category: 'Illustrazione',
          tagline:  'Illustrazione personalizzata su tre stati emotivi — un ritratto visivo.',
          context:  'Una commissione privata. Tre parole come punto di partenza — ridi, piangi, balli — tre facce di una stessa persona da raccontare in un\'unica immagine.',
          problem:  "Tre emozioni da tenere insieme in una composizione sola, senza gerarchia, senza ordine imposto.",
          solution: "Un'illustrazione che non descrive — interpreta. Le tre emozioni convivono nella stessa composizione.",
          result:   'Commissione privata consegnata.',
          accent: '#E8A8BF',
          mainImage: '/portfolio/ridi-piangi-balli/hero.png'
        },
        {
          id:       'punk',
          layout:   'dual',
          title:    "Punk Isn't Dead",
          category: 'Illustrazione',
          tagline:  'Contest Bonobolabo × Birrificio Mad One.',
          context:  'Contest di illustrazione indipendente.',
          problem:  'Comunicare energia punk in un formato stampabile senza perdere autenticità.',
          solution: "Una per la lattina di birra — la resurrezione dello spirito punk, caotica e visionaria. Una per la tavola da skate — il legame tra cultura dello skate, birra artigianale e ribellione. Personaggi ibridi, colori acidi, energia instabile.",
          result:   'Selezione contest. Ristampa richiesta.',
          accent: '#1A1A1A',
          gallery: [
            '/portfolio/punk/beer.jpg',
            '/portfolio/punk/skate.jpg'
          ]
        },
        {
          id:       'ciclomeccanica',
          layout:   'split_light',
          title:    'Campionati di Ciclomeccanica',
          category: 'Grafica / Illustrazione',
          tagline:  'Volantino pro bono per i Campionati di Ciclomeccanica.',
          context:  "I Campionati di Ciclomeccanica mettono insieme riuso, riciclo, competenze meccaniche e inclusione sociale. Andrea conosce quel mondo dall'interno.",
          problem:  'Nessuna comunicazione visiva per un evento che meritava visibilità.',
          solution: "Una narrazione illustrata in cui attrezzi e componenti meccaniche prendono vita — una città diversa, con la mobilità sostenibile al centro. Realizzato gratuitamente per sostenere un'iniziativa in cui crede.",
          result:   'Distribuzione nella rete ciclistica. Evento sold out.',
          accent: '#7B9E4A',
          pdfs: [
            { label: 'Volantino Campionati', url: '/portfolio/ciclomeccanica/flyer.pdf' }
          ]
        }
      ]
    },
    {
      id:       'ecosistema-boreale',
      title:    'Ecosistema Boreale',
      category: 'Illustrazione',
      tagline:  "Illustrazione per una call del centro culturale Borealis nel quartiere Aurora.",
      context:  "Borealis è il centro culturale di Kaninchen-Haus nel quartiere Aurora di Torino — uno spazio che mescola arte, comunità e innovazione sociale. Andrea ci lavora dentro con il servizio civile.",
      problem:  "Raccontare l'ecosistema immaginario di Borealis — un mondo vivo, fatto di connessioni, energie e presenze diverse che coabitano.",
      solution: "Un'illustrazione che racconta l'ecosistema immaginario di Borealis. Il linguaggio visivo di Andrea incontra i valori del posto.",
      result:   'Illustrazione consegnata per la call di Borealis / Kaninchen-Haus.',
      mapX: 0.38, mapY: 0.82,
      accent: '#4A6741',
      mainImage: '/portfolio/ecosistema-boreale/hero-web.jpg'
    },
    {
      id:       'sperimentazione',
      title:    'Sperimentazione Pittorica',
      category: 'Pittura / Archivio',
      tagline:  'Circa 80 fogli A3 — macchie, segni, texture da esplorare liberamente.',
      context:  'Non commissioni, non progetti. Fogli A3, inchiostro, colore, gesto. Circa 80 lavori accumulati nel tempo — ogni foglio è un esperimento autonomo.',
      problem:  "Un archivio personale che non ha una forma pubblica.",
      solution: "I fogli sono sparsi su una superficie morbida — come un tavolo da lavoro. Si scorrono, si sfiorano, si scoprono. Nessuna griglia, nessun ordine imposto.",
      result:   'Archivio aperto, esplorabile liberamente.',
      mapX: 0.78, mapY: 0.82,
      accent: '#9090A0',
    },
  ],
}

/* ─── ABOUT ──────────────────────────────────────────────────────────────── */

export const ABOUT = {
  heading: 'Chi Sono',
  bio: [
    `Sono <strong>Andrea</strong>, designer e illustratore.`,
    `Credo che ogni attività abbia già un'identità — un mondo immaginario che esiste dentro le persone, gli oggetti e le storie che la abitano. Il mio lavoro è ascoltarlo e dargli forma visiva.`,
    `Non parto da un foglio bianco. Parto da te, dal tuo spazio, da chi lo vive. Attraverso un percorso strutturato di ascolto e co-progettazione, tiriamo fuori quello che c'è già — e lo rendiamo un linguaggio visivo che puoi usare ovunque.`,
    `Ho studiato al Politecnico di Torino, ho imparato lavorando: in una serigrafia, in un'officina di biciclette artigianali, in comunità e spazi pubblici. Ho dipinto muri e fatto ricerca sul campo. Ho capito che il design che dura nasce dall'ascolto, non dalla tastiera.`,
    `Vado in bici, sono scout da quando avevo dieci anni. Mi piace vedere il mondo lentamente. Probabilmente si vede nel lavoro.`,
  ],
  socials: [
    { label: 'Instagram', href: 'https://instagram.com/angea_pangea',       aria: 'Instagram @angea_pangea' },
    { label: 'LinkedIn',  href: 'https://linkedin.com/in/andrea-pizzoglio', aria: 'LinkedIn di Andrea'      },
  ],
  skillsButton: { open: 'ABILITÀ +', close: 'CHIUDI' },
  skills: [
    {
      code:  'S-01', label: 'SOFTWARE', color: '#C4622D',
      items: ['Illustrator', 'InDesign', 'Photoshop', 'Procreate', 'Blender', 'Premiere Pro'],
    },
    {
      code:  'S-02', label: 'STAMPA & PRODUZIONE', color: '#2B5F8E',
      items: ['Risografia', 'Serigrafia', 'Stampa offset', 'Plotter / vinile'],
    },
    {
      code:  'S-03', label: 'SPAZIO FISICO', color: '#4A6741',
      items: ['Murale interno / esterno', 'Wayfinding', 'Installazione', 'Set design'],
    },
    {
      code:  'S-04', label: 'COSA CONSEGNO', color: '#7B9E4A',
      items: ['Vettori editabili (.ai .pdf)', 'Font con licenza', 'Brand manual', 'Template pronti uso'],
    },
    {
      code:  'S-05', label: 'PROCESSO', color: '#C4622D',
      items: ['Brief strutturato', '3 concept iniziali', '2 round revisioni', 'Handoff completo'],
    },
    {
      code:  'S-06', label: 'OPERATIVITÀ', color: '#1A1A1A',
      items: ['Italia + trasferte', 'Remoto per digital', 'Risposta entro 24 h', 'Freelance / agenzia'],
    },
  ],
}

/* ─── CONTACT ────────────────────────────────────────────────────────────── */

export const CONTACT = {
  heading: 'Raccontami il tuo progetto.',
  lead:    'Anche se non hai ancora le idee chiare — partiamo da lì.',
  note:    'Rispondo entro 24 ore.',
  /** Ottieni il tuo ID su formspree.io */
  formspreeId: 'REPLACE_WITH_YOUR_ID',
  directLinks: [
    {
      label: 'WhatsApp',
      icon:  'W',
      href:  'https://wa.me/393195975752',
      aria:  'Scrivi su WhatsApp',
      /** WhatsApp è il metodo di contatto principale */
      primary: true,
    },
    {
      label: 'apizzoglio@gmail.com',
      icon:  '@',
      href:  'mailto:apizzoglio@gmail.com',
      aria:  'Scrivi via email',
    },
    {
      label: '@angea_pangea',
      icon:  'IG',
      href:  'https://instagram.com/angea_pangea',
      aria:  'Instagram di Andrea',
    },
  ],
  form: {
    fields: [
      { id: 'name',    name: 'name',    type: 'text', label: 'Nome',             placeholder: 'Mario Rossi',                              required: true  },
      { id: 'project', name: 'project', type: 'text', label: 'Tipo di progetto', placeholder: 'Identità visiva, murale, social media...', required: false },
    ],
    messageLabel:       'Raccontami',
    messagePlaceholder: 'Ho un negozio di bici e vorrei...',
    submitLabel:        'Invia messaggio',
  },
}
