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
      thumb:    '/portfolio/_thumbs/bicicleria.jpg',
      title:    'Bicicleria',
      category: 'Identità visiva completa',
      tagline:  'Identità visiva di una ciclofficina. Progetto continuativo dal 2025.',
      sections: [
        {
          label: 'Il murale',
          text:  'Una colonna al centro della ciclofficina, dipinta a mano dal pavimento al soffitto. Componenti meccaniche e attrezzi prendono vita e si collegano in un unico flusso di avvenimenti che gira su tutte le facce della colonna. Linea nera su fondo rosa.',
        },
        {
          label: 'Il branding',
          text:  "Curo l'identità visiva della ciclofficina nel suo insieme: adesivi, locandine per gli eventi, grafiche per le magliette, il cartello degli orari, il video promozionale e i contenuti per i social. Un progetto continuativo, iniziato nel 2025 e ancora in corso.",
        },
        {
          label: 'I personaggi',
          text:  'Nascono dalle componenti meccaniche e dagli attrezzi. Il piccione è fuso con una maglia della catena: vista di lato, ha già la forma del suo corpo.',
        },
      ],
      mapX: 0.15, mapY: 0.30,
      accent: '#C4622D',
      links: [
        {
          label: 'Bicicleria su Instagram',
          url:   'https://www.instagram.com/bicicleria/',
          note:  'Il profilo della ciclofficina, dove escono le grafiche',
        },
      ],
      mainImage: '/portfolio/bicicleria/colonna-1.jpg',
      videos: [
        '/portfolio/bicicleria/video-promo.mp4'
      ],
      marquee: '/portfolio/bicicleria/stickers-loop.png',
      gallery: [
        // il murale sulla colonna
        '/portfolio/bicicleria/colonna-2.jpg',
        '/portfolio/bicicleria/colonna-3.jpg',
        '/portfolio/bicicleria/detail-1.jpg',
        '/portfolio/bicicleria/detail-2.jpg',
        '/portfolio/bicicleria/detail-3.jpg',
        // i personaggi nati dalle componenti meccaniche
        '/portfolio/bicicleria/personaggi.jpg',
        '/portfolio/bicicleria/chiave-inglese.jpg',
        '/portfolio/bicicleria/ape-banner-1.jpg',
        '/portfolio/bicicleria/ape-banner-2.jpg',
        // stampati e grafiche per il negozio
        '/portfolio/bicicleria/orario-grafica.jpg',
        '/portfolio/bicicleria/ape-bellavita.jpg',
        '/portfolio/bicicleria/adesivi-foto.jpg',
        '/portfolio/bicicleria/promo.png',
        '/portfolio/bicicleria/aperidivo.png',
        '/portfolio/bicicleria/adesivo-1.jpg',
        '/portfolio/bicicleria/adesivo-2.jpg'
      ],
      pdfs: [
        {
          label: 'Orari Negozio',
          url:   '/portfolio/bicicleria/orario.pdf',
          pages: ['/portfolio/bicicleria/orario.jpg'],
        },
        {
          label: 'Maglietta Black',
          url:   '/portfolio/bicicleria/maglietta-black.pdf',
          pages: ['/portfolio/bicicleria/maglietta-black.jpg'],
        },
      ]
    },

    {
      id:       'mulini',
      thumb:    '/portfolio/_thumbs/mulini.jpg',
      title:    'Mulini',
      category: 'Illustrazione / Tesi di laurea',
      tagline:  'Tesi di laurea in Design e Comunicazione, Politecnico di Torino, 2024.',
      sections: [
        {
          label: 'La ricerca',
          text:  "Studio del ruolo delle macchine ad acqua come motore di sviluppo economico e sociale nell'areale dell'Ecomuseo Terra del Castelmagno. Erano poli produttivi multifunzionali, snodi di una rete di relazioni umane ed economiche ormai quasi sparita, che teneva insieme la comunità, le filiere e il territorio.",
        },
        {
          label: 'Sul campo',
          text:  "Condotta attraverso colloqui con chi abita l'areale. Ricostruisce quei legami nel contesto storico, in quello attuale e in quelli possibili: riattivare un mulino non è un intervento di restauro, ma la ricomposizione di un sistema di sostegno reciproco e di gestione collettiva delle risorse.",
        },
        {
          label: 'Il progetto',
          text:  'Uno schema sistemico rappresenta su più livelli la rete di interconnessione tra la comunità e le filiere, e sovrappone ai punti di intervento nevralgici un sistema di undici spazi interconnessi, co-progettato con la comunità.',
        },
        {
          label: 'La restituzione',
          text:  "Una striscia illustrata di sei metri, installata in loco. Tramite metafore narrative e l'escamotage del sogno come spazio privo di limitazioni, mette in condivisione le prospettive, il potenziale e le necessità che legano la riattivazione dei mulini al tessuto sociale e produttivo dell'area.",
        },
        {
          label: 'Dopo la tesi',
          text:  "La ricerca è uscita dall'università ed è entrata in MINORE, il progetto di Italia Nostra sul patrimonio culturale minore. L'ho presentata al convegno «Mulini e macchine ad acqua: un esempio di retro-futuro» a Cuneo nel febbraio 2025, e al Museo Terra del Castelmagno di Monterosso Grana durante la mostra «Di acque e di Mulini», aperta dall'aprile al giugno 2025.",
        },
      ],
      links: [
        {
          label: 'La tesi completa su WebThesis — Politecnico di Torino',
          url:   'https://webthesis.biblio.polito.it/34064/',
        },
        {
          label: 'Convegno «Mulini e macchine ad acqua: un esempio di retro-futuro»',
          url:   'https://www.italianostra.org/sezioni-e-consigli-regionali/piemonte/cuneo/minore-mulini-e-macchine-ad-acqua-un-esempio-di-retro-futuro-il-14-febbraio-evento-organizzato-da-italia-nostra/',
          note:  'Italia Nostra Cuneo, febbraio 2025',
        },
        {
          label: 'Mostra «Di acque e di Mulini»',
          url:   'https://www.terradelcastelmagno.it/mulini-e-macchine-ad-acqua-i-tesori-nascosti-del-cuneese/',
          note:  'Museo Terra del Castelmagno, Monterosso Grana, aprile – giugno 2025',
        },
        {
          label: 'Il ciclo di eventi nel Cuneese, dentro il progetto MINORE',
          url:   'https://www.italianostra.org/archivio/eventi/minore-alla-scoperta-dei-tesori-nascosti-del-cuneese-mulini-ad-acqua-protagonisti/',
          note:  'Italia Nostra, archivio eventi nazionale',
        },
        {
          label: 'I mulini sotto lo sguardo dei Babaciu',
          url:   'https://laguida.it/2025/04/14/san-pietro-monterosso-i-mulini-sotto-lo-sguardo-dei-babaciu/',
          note:  'La Guida, aprile 2025',
        },
        {
          label: 'Le macchine ad acqua della Valle Grana',
          url:   'https://www.terradelcastelmagno.it/macchine-ad-acqua/',
          note:  "Approfondimento storico dell'Ecomuseo",
        },
      ],
      mapX: 0.48, mapY: 0.22,
      accent: '#5B8EA6',
      panoramaStrip: '/portfolio/mulini/strip.png',
      pdfs: [
        {
          label: 'Presentazione della tesi',
          url:   '/portfolio/mulini/thesis.pdf',
          pages: [
            '/portfolio/mulini/tesi/slide-01.jpg',
            '/portfolio/mulini/tesi/slide-02.jpg',
            '/portfolio/mulini/tesi/slide-03.jpg',
            '/portfolio/mulini/tesi/slide-04.jpg',
            '/portfolio/mulini/tesi/slide-05.jpg',
            '/portfolio/mulini/tesi/slide-06.jpg',
            '/portfolio/mulini/tesi/slide-07.jpg',
            '/portfolio/mulini/tesi/slide-08.jpg',
            '/portfolio/mulini/tesi/slide-09.jpg',
            '/portfolio/mulini/tesi/slide-10.jpg',
            '/portfolio/mulini/tesi/slide-11.jpg',
            '/portfolio/mulini/tesi/slide-12.jpg',
            '/portfolio/mulini/tesi/slide-13.jpg',
            '/portfolio/mulini/tesi/slide-14.jpg',
            '/portfolio/mulini/tesi/slide-15.jpg',
            '/portfolio/mulini/tesi/slide-16.jpg',
            '/portfolio/mulini/tesi/slide-17.jpg',
            '/portfolio/mulini/tesi/slide-18.jpg',
            '/portfolio/mulini/tesi/slide-19.jpg',
          ],
        },
      ]
    },
    {
      id:       'torino-invisibile',
      thumb:    '/portfolio/_thumbs/torino-invisibile.jpg',
      title:    'Torino Invisibile',
      category: '3D / Realtà aumentata',
      tagline:  'Progetto PNRR, 2025 – 2026.',
      sections: [
        {
          label: "L'opera",
          text:  "Le città invisibili di Italo Calvino diventano un'opera transmediale in realtà aumentata, diffusa nello spazio urbano: ogni città del libro è ancorata a un luogo reale di Torino — Olivia al Grattacielo San Paolo, Leonia in Piazza San Carlo, Ersilia alle Porte Palatine, Valdrada in Piazza Statuto, Zaira ai Murazzi — e prende forma sullo schermo di smartphone e visori mentre il testo di Calvino accompagna la visione.",
        },
        {
          label: 'Il mio ruolo',
          text:  'Durante il servizio civile a Kaninchen-Haus, tra il 2025 e il 2026, ho realizzato tutti gli ambienti 3D dell\'opera e ho partecipato alla fase di co-creazione e produzione artistica precedente.',
        },
        {
          label: 'Chi c\'è dietro',
          text:  'Progetto di Kaninchen-Haus con la direzione artistica di ConiglioViola, vincitore del bando PNRR Transizione Digitale Organismi Culturali e Creativi, in rete con Museo Nazionale del Cinema, Circolo dei Lettori, DAMS e Accademia Albertina.',
        },
      ],
      mapX: 0.65, mapY: 0.42,
      accent: '#1A1A2E',
      links: [
        {
          label: 'Torino (Città) Invisibile — il sito del progetto',
          url:   'https://torinoinvisibile.coniglioviola.com/',
          note:  "Kaninchen-Haus con la direzione artistica di ConiglioViola: la mappa e l'app in realtà aumentata",
        },
      ],
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
      thumb:    '/portfolio/_thumbs/illustrazioni.jpg',
      title:    'Illustrazioni & Artwork Singoli',
      category: 'Raccolta / Illustrazione',
      tagline:  'Copertine per singoli musicali, locandine per eventi, illustrazioni per contest.',
      mapX: 0.80, mapY: 0.22,
      accent: '#E8A8BF',
      subProjects: [
        {
          id:       'alice',
          layout:   'centered',
          title:    'Alice, un mondo di matti',
          category: 'Copertina / Illustrazione',
          tagline:  'Copertina per un singolo di Gcomemarco.',
          sections: [
            {
              label: 'La richiesta',
              text:  'Unire Torino, Alice nel Paese delle Meraviglie e il Giardino delle delizie di Bosch.',
            },
            {
              label: "L'illustrazione",
              text:  'Ne è nata una città rossa dove palazzi torinesi, castelli e funghi giganti ospitano i personaggi del libro.',
            },
          ],
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
          title:    'Ridi, piangi, balli',
          category: 'Copertina / Illustrazione',
          tagline:  'Copertina per un singolo di Gcomemarco.',
          sections: [
            {
              label: "L'illustrazione",
              text:  'Una sala da ballo sospesa sulla notte, dove convivono chi festeggia, chi si innamora e chi piange da solo.',
            },
          ],
          accent: '#E8A8BF',
          mainImage: '/portfolio/ridi-piangi-balli/hero.png'
        },
        {
          // Sono due illustrazioni distinte, nate per lo stesso contest.
          id:        'punk-lattina',
          title:     "Punk Isn't Dead — Lattina",
          category:  'Illustrazione',
          tagline:   'Contest Bonobolabo × Birrificio Mad One, 2024.',
          accent:    '#1A1A1A',
          mainImage: '/portfolio/punk/beer.jpg',
          sections: [
            {
              label: 'Il contest',
              text:  "Contest \"Punk is not dead\", promosso da Bonobolabo e dal birrificio Mad One.",
            },
            {
              label: "L'illustrazione",
              text:  'Racconta una riesumazione dello spirito punk, che per poco rischiava la sussunzione da parte del mercato.',
            },
          ],
        },
        {
          id:        'punk-skate',
          title:     "Punk Isn't Dead — Skate",
          category:  'Illustrazione',
          tagline:   'Contest Bonobolabo × Birrificio Mad One, 2024.',
          accent:    '#1A1A1A',
          mainImage: '/portfolio/punk/skate.jpg',
          sections: [
            {
              label: 'Il contest',
              text:  "Contest \"Punk is not dead\", promosso da Bonobolabo e dal birrificio Mad One.",
            },
            {
              label: "L'illustrazione",
              text:  'Ripercorre il legame tra skate, birra e lo spirito ribelle della cultura punk.',
            },
          ],
        },
        {
          id:       'ciclomeccanica',
          layout:   'split_light',
          title:    'Campionati di Ciclomeccanica',
          category: 'Locandina / Illustrazione',
          tagline:  'Locandina per il XIV Trofeo Sheldon Brown. Torino, 5 ottobre 2024.',
          sections: [
            {
              label: "L'evento",
              text:  "La gara tra ciclofficine popolari ospitata alle Officine Creative di via Cecchi. In cinque ore le squadre rimettono in strada bici recuperate, che finiscono all'asta benefica.",
            },
            {
              label: "L'illustrazione",
              text:  'I pezzi della bici diventano paesaggio: il telaio attraversa la scena e la serie sterzo si trasforma in un UFO che illumina la Mole.',
            },
          ],
          accent: '#7B9E4A',
          mainImage: '/portfolio/ciclomeccanica/flyer-cover.jpg',
          pdfs: [
            {
              label: 'Volantino Campionati',
              url:   '/portfolio/ciclomeccanica/flyer.pdf',
              pages: ['/portfolio/ciclomeccanica/flyer-cover.jpg'],
            },
          ]
        },
        {
          id:        'campus-boreale',
          title:     'Campus Boreale',
          category:  'Locandina / Illustrazione',
          tagline:   "Locandina per la prima apertura del Campus, l'aula studio di Borealis.",
          accent:    '#9DD4EE',
          mainImage: '/portfolio/locandina-start/hero.jpg',
          sections: [
            {
              label: "L'illustrazione",
              text:  'Chi legge, chi scrive, chi lavora al computer: tavoli e sedie si staccano dal pavimento e lo studio diventa uno spazio condiviso e leggero.',
            },
          ],
        }
      ]
    },
    {
      id:       'ecosistema-boreale',
      title:    'Ecosistema Boreale',
      category: 'Illustrazione',
      thumb:    '/portfolio/_thumbs/ecosistema-boreale.jpg',
      tagline:  'Illustrazione per la call di Borealis, 2025.',
      sections: [
        {
          label: 'La richiesta',
          text:  'Per la call di Borealis rivolta a imprese creative e realtà a impatto sociale da ospitare negli spazi del centro.',
        },
        {
          label: "L'illustrazione",
          text:  "Un'isola dove piante, animali, strumenti musicali e da pittura convivono e mettono radici insieme.",
        },
        {
          label: 'Il disegno',
          text:  'In galleria anche il disegno a linea, prima del colore.',
        },
      ],
      mapX: 0.38, mapY: 0.82,
      accent: '#4A6741',
      mainImage: '/portfolio/ecosistema-boreale/hero.jpg',
      gallery: [
        '/portfolio/ecosistema-boreale/linea.jpg'
      ]
    },
    {
      id:       'sperimentazione',
      thumb:    '/portfolio/_thumbs/sperimentazione.jpg',
      title:    'Stamperia',
      category: 'Ricerca personale',
      tagline:  'Ricerca personale, 2024 — in corso. Circa 80 fogli A3: spontaneità, ripetizione, stratificazione.',
      // Sezioni su misura: una ricerca personale non ha un "problema" e una "soluzione".
      sections: [
        {
          label: 'Il progetto',
          text:  'Alcuni estratti di un progetto esplorativo, iniziato nel 2024 e tuttora in corso. Circa 80 fogli A3: monotipi, macchie, segni, texture.',
        },
        {
          label: 'La ricerca',
          text:  'Si concentra sulla ricerca di significato nella spontaneità, nella ripetizione e nella stratificazione.',
        },
        {
          label: 'Il metodo',
          text:  "Procedure approssimative e sbrigative, senza pretendere il controllo e contemplando l'errore come parte integrante del processo.",
        },
        {
          label: "L'intento",
          text:  "Trovare il corretto equilibrio che permetta alla casualità di esprimersi ed evolversi, concedendomi per analogia di riflettere sul mistero dell'origine delle cose.",
        },
      ],
      mainImage: '/portfolio/sperimentazione/foglio-01.jpg',
      // Copertina in cima alla pagina: il primo video della serie
      coverVideo:  '/portfolio/sperimentazione/video-01.mp4',
      coverPoster: '/portfolio/sperimentazione/video-01-poster.jpg',
      gallery: [
        '/portfolio/sperimentazione/foglio-01.jpg',
        '/portfolio/sperimentazione/foglio-02.jpg',
        '/portfolio/sperimentazione/foglio-03.jpg',
        '/portfolio/sperimentazione/foglio-04.jpg',
        '/portfolio/sperimentazione/foglio-05.jpg',
        '/portfolio/sperimentazione/foglio-06.jpg',
        '/portfolio/sperimentazione/foglio-07.jpg',
        '/portfolio/sperimentazione/foglio-08.jpg',
        '/portfolio/sperimentazione/foglio-09.jpg',
        '/portfolio/sperimentazione/foglio-10.jpg',
        '/portfolio/sperimentazione/foglio-11.jpg',
        '/portfolio/sperimentazione/foglio-12.jpg',
        '/portfolio/sperimentazione/foglio-13.jpg',
        '/portfolio/sperimentazione/foglio-14.jpg',
        '/portfolio/sperimentazione/foglio-15.jpg',
        '/portfolio/sperimentazione/foglio-16.jpg',
        '/portfolio/sperimentazione/foglio-17.jpg',
        '/portfolio/sperimentazione/foglio-18.jpg',
        '/portfolio/sperimentazione/foglio-19.jpg',
        '/portfolio/sperimentazione/foglio-20.jpg',
        '/portfolio/sperimentazione/foglio-21.jpg',
        '/portfolio/sperimentazione/foglio-22.jpg',
      ],
      // video-01 e' la copertina in cima alla pagina, non si ripete qui sotto.
      videos: [
        '/portfolio/sperimentazione/video-02.mp4',
        '/portfolio/sperimentazione/video-03.mp4',
        '/portfolio/sperimentazione/video-04.mp4',
        '/portfolio/sperimentazione/video-05.mp4',
        '/portfolio/sperimentazione/video-06.mp4',
      ],
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
    `Ho studiato Design e Comunicazione al Politecnico di Torino, con una tesi sul ruolo dei mulini ad acqua nell'economia dei paesi di montagna. Ho imparato lavorando: in una serigrafia, in un'officina di biciclette artigianali, in un anno di servizio civile in uno spazio culturale indipendente a Torino. Oggi porto tutto questo in <strong>Artismi Design Studio</strong>, il mio lavoro da freelance. Ho dipinto muri e fatto ricerca sul campo. Ho capito che il design che dura nasce dall'ascolto, non dalla tastiera.`,
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
  formspreeId: 'xvgzbgzl',
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
