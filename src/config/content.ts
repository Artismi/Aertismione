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
    { href: '#portfolio',  label: 'Progetti' },
    { href: '#chi-sono',   label: 'Chi Sono' },
    { href: '#contatti',   label: 'Contatti' },
  ],
  cta: 'Scrivimi',
}

/* ─── HERO ───────────────────────────────────────────────────────────────── */

export const HERO = {
  /**
   * Sotto il logo, un blocco solo che si legge in un colpo d'occhio: una promessa,
   * poi cosa fai e per chi. claim: le righe del titolo, la parola fra *asterischi*
   * va nel colore d'accento · line: cosa fai e per chi · points: etichette facoltative.
   */
  claim:  ['Diamo un *volto*', 'alla tua attività.'],
  line:   'Identità visive, illustrazione e murales per negozi, associazioni e piccole imprese.',
  points: [] as string[],
  ctas: [
    { label: 'Scopri i servizi', href: '#servizi',  variant: 'primary'   },
    { label: 'Scrivimi',         href: '#contatti', variant: 'secondary' },
  ],
  scrollHint: 'Scorri',
}

/* ─── SERVICES ───────────────────────────────────────────────────────────── */

export const SERVICES = {
  heading: 'Servizi',
  intro:   "Ogni elemento che costruiamo nasce dall'identità della tua attività. Puoi scegliere una cosa sola o un percorso completo. La differenza è che nel percorso, tutto parla la stessa lingua — e si vede.",
  savingsNote: "Se hai già un'identità visiva fatta con Artismi, ogni lavoro successivo costa meno — perché partiamo da qualcosa che esiste già.",
  cta: 'Chiedi un preventivo',
  /*
   * I cinque servizi, una colonna ciascuno, da leggere tutto d'un fiato:
   * type: l'etichetta sopra il titolo · promise: a cosa serve, in una frase
   * text: cosa succede e cosa ottieni, in poche righe · proof: un lavoro vero.
   * label: il titolo, con *la parola chiave* fra asterischi · seal: il testo che gira
   * intorno all'adesivo del foglio · paper: che foglio e' (folder, sheet, featured, grid, tag).
   * I prezzi non si mostrano.
   */
  cards: [
    {
      id:      'partecipata',
      seal:    'Insieme si progetta meglio ✦ ',
      paper:   'folder',
      type:    'Su progetto',
      label:   'Progettazione *partecipata*',
      promise: 'Le persone progettano con te, e il risultato lo sentono loro.',
      text:    'Scrivo e conduco laboratori con chi vivrà il progetto: abitanti, soci, studenti. Insieme si arriva a un risultato concreto, un oggetto, uno spazio, una guida, e a quello che non si vede: fiducia, relazioni, un gruppo che si riconosce in ciò che ha costruito.',
      proof:   'Mulini, Ecomuseo Terra del Castelmagno',
    },
    {
      id:      'stampe',
      seal:    'Disegnato a mano ✦ Fatto per durare ✦ ',
      paper:   'sheet',
      type:    'Una tantum',
      label:   'Illustrazioni, stampe e *gadget*',
      promise: 'I tuoi disegni diventano oggetti che la gente porta con sé.',
      text:    'Illustrazioni su commissione, poster, spille, adesivi, magliette, shopper: disegnati a mano e preparati per la stampa. Per un evento, per il merch, per un regalo che fa parlare di te.',
      proof:   'Bicicleria, ciclofficina',
    },
    {
      id:       'identita',
      seal:    'Riconoscibile ovunque ✦ ',
      paper:   'featured',
      type:     'Percorso completo',
      label:    'Identità *completa*',
      featured: true,
      promise:  'La tua attività riconoscibile ovunque, dal logo ai muri del negozio.',
      text:     'Nome, logo e un\'illustrazione madre da cui nasce tutto il resto: personaggi, menu, biglietti, insegna, vetrina, murales. Ricevi il sistema completo e il manuale per usarlo anche da solo; ogni lavoro dopo costa meno, perché parte da qui.',
      proof:    'Bicicleria, ciclofficina',
    },
    {
      id:      'web',
      seal:    'Online come dal vivo ✦ ',
      paper:   'grid',
      type:    'Su misura',
      label:   'Web, app e *realtà aumentata*',
      promise: 'Sullo schermo, la stessa attività che la gente incontra dal vivo.',
      text:    'Siti vetrina, pagine per prenotare o vendere, app e realtà aumentata: personaggi e ambienti 3D che compaiono su una vetrina, un muro, un luogo. Li disegno e li costruisco io partendo dalla tua identità; testi e foto li cambi da solo.',
      proof:   'Torino Invisibile, Porto Vecchio',
    },
    {
      id:      'social',
      seal:    'Ogni settimana ✦ Con la tua voce ✦ ',
      paper:   'tag',
      type:    'Al mese',
      label:   'Gestione *social*',
      promise: 'I tuoi canali vivi ogni settimana, con la tua voce.',
      text:    'Piano editoriale, contenuti illustrati, pubblicazione e risposte ai messaggi, con un resoconto a fine mese. Tu pensi alla tua attività; la tua identità continua a parlare per te.',
      proof:   'Bicicleria, ciclofficina',
    },
  ],
  // la fascia ambra in cima ai fogli, e la riga in fondo
  band:    ['Artismi — Servizi', 'Cinque modi di lavorare insieme', 'Fatto a mano ✦'],
  collect: ['Scegli', 'quello che', 'ti serve.'],
  footerNote: "Tutti i prezzi sono indicativi — ogni progetto è un'altra storia. Materiali di stampa e produzione sempre a parte.",
}

/* ─── PROGETTI ───────────────────────────────────────────────────────────── */

/**
 * Il tavolo della sezione Progetti: la cartellina del portfolio e il gamepad
 * di Porto Vecchio. Preso in mano il gamepad si va alla pagina del gioco
 * (/porto-vecchio): la barra del sito e il gioco sotto. Il gioco vive sul suo
 * sito (url) ma arriva dall'indirizzo del sito stesso (path, vedi le rewrites
 * in next.config.mjs): chi gioca resta su Artismi. Sopra il 3D della home era
 * troppo lento, li' gira da solo.
 * Il link da condividere e' artismi.it/porto-vecchio.
 */
export const PROGETTI = {
  heading: 'Progetti',
  intro:   'Sul tavolo ci sono due cose: il fascicolo con i lavori e un gioco. Prendi quello che vuoi.',
  folderLabel: 'Progetti',
  folderHint:  'Apri il fascicolo',
  folderClose: 'Chiudi il fascicolo',
  // il titolo stampato in cima al tabellone, dentro il fascicolo aperto (come l'etichetta fuori)
  boardTitle:  'Portfolio',
  game: {
    id:    'porto-vecchio',
    title: 'Porto Vecchio',
    hint:  'Videogioco · aprila',
    url:   'https://porto-vecchio.vercel.app/v7/',
    path:  '/gioco/index.html',   // lo stesso gioco, dall'indirizzo del sito
    page:  '/porto-vecchio',      // la pagina del sito con il gioco
    back:  'Torna al tavolo',
    close: 'Esci',
    loading: 'Porto Vecchio sta arrivando…',
    screen: '/progetti/porto-vecchio-lancio.webp', // la schermata di lancio del gioco, sullo schermo del Game Boy
    // Quello che il gioco scarica partendo (~18 MB): il sito lo prende in sottofondo,
    // finito di caricare se stesso, cosi' aprendo il gioco arriva dalla cache.
    // Se il gioco cambia i suoi file, quelli che mancano qui si scaricano all'apertura.
    preload: [
      'index.html',
      ...['s_Radio', 's_PropaneTank', 't_Crate', 's_Bonfire_Fire', 's_WoodLog', 't_Pallet', 's_Backpack',
        't_SackTrench_Small', 't_Pipes', 't_CardboardBoxes_1', 't_ExplodingBarrel', 't_Debris_Tires',
        't_GasTank', 't_TrashContainer'].map((n) => `assets/mj/${n}.glb`),
      ...['rurban', 'grave', 'bkit', 'food', 'arcade', 'train', 'urbano', 'stazione', 'urban', 'casa',
        'garage', 'natura', 'tortura'].map((n) => `assets/mk/kit_${n}.glb`),
      'assets/mc/Casual_2.glb', 'assets/mc/Casual.glb',
    ],
  },
}

/* ─── PORTFOLIO ──────────────────────────────────────────────────────────── */

export const PORTFOLIO = {
  heading: 'Portfolio',
  intro:   'Ogni progetto è un territorio. Clicca per saltare — trascina la pallina per spararla come una bilia.',
  legendLabel: 'Progetto',
  projects: [
    {
      id:       'bicicleria',
      mapX: 0.12, mapY: 0.20,
      thumb:    '/portfolio/_thumbs/bicicleria.jpg',
      title:    'Bicicleria',
      category: 'Identità visiva completa',
      tagline:  'Identità visiva di una ciclofficina. Progetto continuativo dal 2025.',
      short:    'Identità di una ciclofficina',   // sotto il titolo, sulla cartellina del tabellone
      // Tre capitoli in ordine di racconto: la colonna, i personaggi che ne
      // nascono, l'identità dove vengono usati. Ogni riga affianca i pezzi
      // alla stessa altezza; una «pila» impila immagini nella stessa colonna.
      sections: [
        {
          label:       'Il murale',
          sottotitolo: 'Colonna dipinta a mano',
          text:        'Una colonna al centro della ciclofficina, dipinta a mano **dal pavimento al soffitto**. Componenti meccaniche e attrezzi **prendono vita e si collegano in un unico flusso di avvenimenti** che gira su tutte le facce della colonna. Linea nera su fondo rosa.',
          // le tre facce della stessa colonna: stessa misura, in fila
          righe: [
            [
              '/portfolio/bicicleria/detail-1.jpg',
              '/portfolio/bicicleria/detail-2.jpg',
              '/portfolio/bicicleria/detail-3.jpg',
            ],
          ],
        },
        {
          label:       'I personaggi',
          sottotitolo: 'Componenti e attrezzi',
          text:        'Nascono dalle componenti meccaniche e dagli attrezzi. Il **piccione** è fuso con una **maglia della catena**: vista di lato, ha già la forma del suo corpo.',
          righe: [
            ['/portfolio/bicicleria/chiave-inglese.jpg'],
          ],
          // tutto il cast che scorre in verticale, alto quanto il capitolo
          scorrimento: '/portfolio/bicicleria/stickers-loop.png',
        },
        {
          label:       'Il branding',
          sottotitolo: 'Identità visiva · dal 2025',
          text:        "Curo l'identità visiva della ciclofficina nel suo insieme: adesivi, locandine per gli eventi, grafiche per le magliette, il cartello degli orari, il video promozionale e i contenuti per i social. Un progetto continuativo, iniziato nel 2025 e ancora in corso.",
          righe: [
            // il piccione: la festa col cappello, i suoi due banner, la maglietta
            [
              '/portfolio/bicicleria/aperidivo.png',
              { pila: ['/portfolio/bicicleria/ape-banner-1.jpg', '/portfolio/bicicleria/ape-banner-2.jpg'] },
              '/portfolio/bicicleria/maglietta-black.jpg',
            ],
            // la bottega e i social: gli oggetti del negozio, poi i due video girati lì
            [
              { pila: ['/portfolio/bicicleria/promo.png', '/portfolio/bicicleria/orario.jpg'] },
              { video: '/portfolio/bicicleria/video-promo.mp4', larghezza: 720, altezza: 1280 },
              { video: '/portfolio/bicicleria/video-social.mp4', larghezza: 719, altezza: 1280 },
            ],
          ],
        },
      ],
      accent: '#C4622D',
      links: [
        {
          label: 'Bicicleria su Instagram',
          url:   'https://www.instagram.com/bicicleria/',
          note:  'Il profilo della ciclofficina, dove escono le grafiche',
        },
      ],
      // resta per l'anteprima nei link condivisi
      mainImage: '/portfolio/bicicleria/detail-1.jpg',
    },

    {
      id:       'mulini',
      mapX: 0.37, mapY: 0.20,
      thumb:    '/portfolio/_thumbs/mulini.jpg',
      title:    'Mulini',
      category: 'Illustrazione / Tesi di laurea',
      tagline:  'Tesi di laurea in Design e Comunicazione, Politecnico di Torino, 2024.',
      short:    'Tesi di laurea, Polito 2024',   // sotto il titolo, sulla cartellina del tabellone
      // Introduzione breve, poi subito la striscia, poi la presentazione e i link.
      intro: "Tesi sul ruolo dei mulini e delle macchine ad acqua nell'Ecomuseo Terra del Castelmagno, in Valle Grana. Erano **snodi di una rete di relazioni umane ed economiche** che teneva insieme comunità e territorio. Con chi abita la valle ho ricostruito quella rete e proposto **undici spazi interconnessi**, co-progettati con la comunità; il racconto è diventato una **striscia illustrata di sei metri**, installata in loco.",
      sections: [
        {
          label:       'La presentazione',
          sottotitolo: '18 tavole della tesi',
          // tutte 16:9, in sequenza: tre per riga perché le mappe restino leggibili.
          // L'indice (slide-02) è tolto: ripete i titoli delle tavole.
          righe: [
            ['/portfolio/mulini/tesi/slide-01.jpg', '/portfolio/mulini/tesi/slide-03.jpg', '/portfolio/mulini/tesi/slide-04.jpg'],
            ['/portfolio/mulini/tesi/slide-05.jpg', '/portfolio/mulini/tesi/slide-06.jpg', '/portfolio/mulini/tesi/slide-07.jpg'],
            ['/portfolio/mulini/tesi/slide-08.jpg', '/portfolio/mulini/tesi/slide-09.jpg', '/portfolio/mulini/tesi/slide-10.jpg'],
            ['/portfolio/mulini/tesi/slide-11.jpg', '/portfolio/mulini/tesi/slide-12.jpg', '/portfolio/mulini/tesi/slide-13.jpg'],
            ['/portfolio/mulini/tesi/slide-14.jpg', '/portfolio/mulini/tesi/slide-15.jpg', '/portfolio/mulini/tesi/slide-16.jpg'],
            ['/portfolio/mulini/tesi/slide-17.jpg', '/portfolio/mulini/tesi/slide-18.jpg', '/portfolio/mulini/tesi/slide-19.jpg'],
          ],
        },
      ],
      links: [
        {
          label: 'La tesi completa su WebThesis — Politecnico di Torino',
          url:   'https://webthesis.biblio.polito.it/34064/',
        },
        {
          label: 'La presentazione della tesi',
          url:   '/portfolio/mulini/thesis.pdf',
          note:  'PDF, 68 MB',
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
      accent: '#5B8EA6',
      // la striscia di sei metri, alla piena risoluzione (WebP: 2,5 MB invece di 13)
      panoramaStrip: '/portfolio/mulini/strip.webp',
    },
    {
      id:       'torino-invisibile',
      mapX: 0.62, mapY: 0.20,
      thumb:    '/portfolio/_thumbs/torino-invisibile.jpg',
      title:    'Torino Invisibile',
      category: '3D / Realtà aumentata',
      tagline:  'Progetto PNRR, 2025 – 2026.',
      short:    'Progetto PNRR, 2025–2026',   // sotto il titolo, sulla cartellina del tabellone
      intro:    "Le città invisibili di Italo Calvino diventano un'**opera transmediale in realtà aumentata**, diffusa nello spazio urbano: ogni città del libro è ancorata a un luogo reale di Torino — Olivia al Grattacielo San Paolo, Leonia in Piazza San Carlo, Ersilia alle Porte Palatine, Valdrada in Piazza Statuto, Zaira ai Murazzi — e prende forma sullo schermo di smartphone e visori mentre il testo di Calvino accompagna la visione.",
      sections: [
        {
          label:       'Le cinque città',
          sottotitolo: 'Ambienti 3D per la realtà aumentata',
          // tre per riga, così il testo dentro le schede si legge; il sesto
          // posto lo prende il testo sul ruolo, e la griglia si chiude piena
          righe: [
            [
              '/portfolio/torino-invisibile/scene-1.png',
              '/portfolio/torino-invisibile/scene-2.png',
              '/portfolio/torino-invisibile/scene-3.png',
            ],
            [
              '/portfolio/torino-invisibile/scene-4.png',
              '/portfolio/torino-invisibile/scene-5.png',
              {
                rapporto: 9 / 16,
                blocco: [
                  {
                    label: 'Il mio ruolo',
                    text:  'Durante il **servizio civile a Kaninchen-Haus**, tra il 2025 e il 2026, ho realizzato **tutti gli ambienti 3D** dell\'opera e ho partecipato alla fase di co-creazione e produzione artistica precedente.',
                  },
                  {
                    label: 'Chi c\'è dietro',
                    text:  'Progetto di Kaninchen-Haus con la direzione artistica di ConiglioViola, vincitore del bando PNRR Transizione Digitale Organismi Culturali e Creativi, in rete con Museo Nazionale del Cinema, Circolo dei Lettori, DAMS e Accademia Albertina.',
                  },
                ],
              },
            ],
          ],
        },
      ],
      accent: '#1A1A2E',
      links: [
        {
          label: 'Torino (Città) Invisibile — il sito del progetto',
          url:   'https://torinoinvisibile.coniglioviola.com/',
          note:  "Kaninchen-Haus con la direzione artistica di ConiglioViola: la mappa e l'app in realtà aumentata",
        },
      ],
      // resta per l'anteprima nei link condivisi
      mainImage: '/portfolio/torino-invisibile/scene-1.png',
    },
    {
      id:       'alice',
      mapX: 0.87, mapY: 0.20,
      thumb:    '/portfolio/_thumbs/alice.jpg',
      title:    'Alice, un mondo di matti',
      category: 'Copertina / Illustrazione',
      tagline:  'Copertina per un singolo di Gcomemarco.',
      short:    'Copertina per Gcomemarco',   // sotto il titolo, sulla cartellina del tabellone
      intro:    'Unire Torino, **Alice nel Paese delle Meraviglie** e il **Giardino delle delizie** di Bosch: ne è nata una città rossa dove palazzi torinesi, castelli e funghi giganti ospitano i personaggi del libro.',
      // qui le immagini sono tutto: sugli schermi grandi la pagina si allarga
      largo:    true,
      sections: [
        {
          label:       'La copertina',
          sottotitolo: 'Singolo di Gcomemarco',
          text:        'Prima del colore: lo **schizzo**, poi diventato la copertina della versione unplugged, e la **linea**.',
          link: [
            { label: 'Gcomemarco su Spotify',    url: 'https://open.spotify.com/artist/6ZFzgLbdZ3FP66tlo7FwOl' },
            { label: '@gcomemarco su Instagram', url: 'https://www.instagram.com/gcomemarco/' },
          ],
          // la copertina grande; accanto, impilati, lo schizzo e la linea
          righe: [
            [
              {
                img:     '/portfolio/alice/hero.png',
                titolo:  'Alice, un mondo di matti',
                nota:    'Copertina · singolo',
                spotify: '288xQwqgOkUxc8ECMwaIx5',
              },
              { pila: ['/portfolio/alice/detail-2.png', '/portfolio/alice/detail-1.png'] },
            ],
          ],
        },
      ],
      accent: '#8B4DA8',
      // resta per l'anteprima nei link condivisi
      mainImage: '/portfolio/alice/hero.png',
    },
    {
      id:       'ridi-piangi-balli',
      mapX: 0.25, mapY: 0.50,
      thumb:    '/portfolio/_thumbs/ridi-piangi-balli.jpg',
      title:    'Ridi, piangi, balli',
      category: 'Copertina / Illustrazione',
      tagline:  'Copertina per un singolo di Gcomemarco.',
      short:    'Copertina per Gcomemarco',   // sotto il titolo, sulla cartellina del tabellone
      sections: [
        {
          label:       'La copertina',
          sottotitolo: 'Singolo di Gcomemarco',
          link: [
            { label: 'Gcomemarco su Spotify',    url: 'https://open.spotify.com/artist/6ZFzgLbdZ3FP66tlo7FwOl' },
            { label: '@gcomemarco su Instagram', url: 'https://www.instagram.com/gcomemarco/' },
          ],
          // un'immagine sola: metà pagina a lei, l'altra metà al testo
          righe: [
            [
              {
                img:     '/portfolio/ridi-piangi-balli/hero.png',
                titolo:  'Ridi, piangi, balli',
                nota:    'Copertina · singolo',
                spotify: '33WdbdLAPPmgmfi4YHEtm5',
              },
              {
                rapporto: 1,
                blocco: [
                  {
                    label: "L'illustrazione",
                    text:  'Una sala da ballo sospesa sulla notte, dove convivono chi festeggia, chi si innamora e chi piange da solo.',
                  },
                ],
              },
            ],
          ],
        },
      ],
      accent: '#E8A8BF',
      // resta per l'anteprima nei link condivisi
      mainImage: '/portfolio/ridi-piangi-balli/hero.png',
    },
    {
      // Due illustrazioni per lo stesso contest: una pagina sola.
      id:        'punk',
      mapX: 0.75, mapY: 0.50,
      thumb:    '/portfolio/_thumbs/punk-lattina.jpg',
      title:     "Punk Isn't Dead",
      category:  'Illustrazione',
      tagline:   'Contest Bonobolabo × Birrificio Mad One, 2024.',
      short:    'Contest Bonobolabo × Mad One',   // sotto il titolo, sulla cartellina del tabellone
      accent:    '#E2475E',   // sulla tavola scura il nero non si vedeva
      // qui le immagini sono tutto: sugli schermi grandi la pagina si allarga
      largo:     true,
      sections: [
        {
          label:       'La lattina e lo skate',
          sottotitolo: 'Due illustrazioni per lo stesso contest',
          text:        'Contest «Punk is not dead», promosso da Bonobolabo e dal birrificio Mad One. La lattina racconta una **riesumazione dello spirito punk**, che per poco rischiava la sussunzione da parte del mercato; lo skate ripercorre il **legame tra skate, birra** e lo spirito ribelle della cultura punk.',
          // lo skate in piedi, come l'oggetto vero: una colonna alta quanto
          // il capitolo; accanto, l'etichetta della lattina grande
          colonna: '/portfolio/punk/skate.jpg',
          righe: [
            ['/portfolio/punk/beer.jpg'],
          ],
        },
      ],
      // resta per l'anteprima nei link condivisi
      mainImage: '/portfolio/punk/beer.jpg',
    },
    {
      id:       'ciclomeccanica',
      mapX: 0.12, mapY: 0.80,
      thumb:    '/portfolio/_thumbs/ciclomeccanica.jpg',
      title:    'Campionati di Ciclomeccanica',
      category: 'Locandina / Illustrazione',
      tagline:  'Locandina per il XVI Trofeo Sheldon Brown. Torino, 5 ottobre 2024.',
      short:    'Trofeo Sheldon Brown, 2024',   // sotto il titolo, sulla cartellina del tabellone
      sections: [
        {
          label: 'La locandina',
          // la locandina e, accanto, il testo nello stesso formato
          righe: [
            [
              '/portfolio/ciclomeccanica/flyer-cover.jpg',
              {
                rapporto: 1200 / 1697,
                blocco: [
                  {
                    label: "L'evento",
                    text:  "La gara tra **ciclofficine popolari** ospitata alle Officine Creative di via Cecchi. In cinque ore le squadre rimettono in strada bici recuperate, che finiscono all'**asta benefica**.",
                  },
                  {
                    label: "L'illustrazione",
                    text:  'I pezzi della bici diventano paesaggio: il telaio attraversa la scena e la **serie sterzo** si trasforma in un UFO che illumina la Mole.',
                  },
                ],
              },
            ],
          ],
        },
      ],
      accent: '#7B9E4A',
      // resta per l'anteprima nei link condivisi
      mainImage: '/portfolio/ciclomeccanica/flyer-cover.jpg',
    },
    {
      id:        'campus-boreale',
      mapX: 0.37, mapY: 0.80,
      thumb:    '/portfolio/_thumbs/campus-boreale.jpg',
      title:     'Campus Boreale',
      category:  'Locandina / Illustrazione',
      tagline:   "Locandina per la prima apertura del Campus, l'aula studio di Borealis.",
      short:    'Apertura del Campus Borealis',   // sotto il titolo, sulla cartellina del tabellone
      accent:    '#9DD4EE',
      sections: [
        {
          label: 'La locandina',
          // la locandina e, accanto, il testo nello stesso formato
          righe: [
            [
              '/portfolio/locandina-start/hero.jpg',
              {
                rapporto: 1440 / 1800,
                blocco: [
                  {
                    label: "L'illustrazione",
                    text:  'Chi legge, chi scrive, chi lavora al computer: tavoli e sedie si staccano dal pavimento e lo studio diventa uno **spazio condiviso e leggero**.',
                  },
                ],
              },
            ],
          ],
        },
      ],
      // resta per l'anteprima nei link condivisi
      mainImage: '/portfolio/locandina-start/hero.jpg',
    },
    {
      id:       'ecosistema-boreale',
      title:    'Ecosistema Boreale',
      category: 'Illustrazione',
      thumb:    '/portfolio/_thumbs/ecosistema-boreale.jpg',
      tagline:  'Illustrazione per la call di Borealis, 2025.',
      short:    'Call di Borealis, 2025',   // sotto il titolo, sulla cartellina del tabellone
      intro:    "Per la call di Borealis rivolta a **imprese creative** e realtà a **impatto sociale** da ospitare negli spazi del centro. Un'isola dove piante, animali, strumenti musicali e da pittura convivono e mettono radici insieme.",
      // qui le immagini sono tutto: sugli schermi grandi la pagina si allarga
      largo:    true,
      sections: [
        {
          label: 'Dal disegno al colore',
          // affiancate alla stessa altezza: prima la linea, poi il colore.
          // Il colore viene dall'originale in alta risoluzione; la linea è
          // ritagliata sul suo pannello, senza la carta e la didascalia del PDF.
          righe: [
            ['/portfolio/ecosistema-boreale/linea-pulita.jpg', '/portfolio/ecosistema-boreale/colore.jpg'],
          ],
        },
      ],
      mapX: 0.62, mapY: 0.80,
      accent: '#4A6741',
      // resta per l'anteprima nei link condivisi
      mainImage: '/portfolio/ecosistema-boreale/colore.jpg',
    },
    {
      id:       'sperimentazione',
      thumb:    '/portfolio/_thumbs/sperimentazione.jpg',
      title:    'Stamperia',
      category: 'Ricerca personale',
      tagline:  'Ricerca personale, 2024 — in corso. Circa 80 fogli A3: spontaneità, ripetizione, stratificazione.',
      short:    'Ricerca personale, in corso',   // sotto il titolo, sulla cartellina del tabellone
      intro:    "Alcuni estratti di un progetto esplorativo: monotipi, macchie, segni e texture su carta. La ricerca di significato nella **spontaneità, nella ripetizione e nella stratificazione**, con procedure approssimative e sbrigative, **senza pretendere il controllo** e contemplando **l'errore come parte integrante del processo**.",
      // Prima il materiale, i fogli; poi quello che ne nasce, i video fatti con i fogli.
      sections: [
        {
          label:       'I fogli',
          sottotitolo: '22 di circa 80 · A3',
          // tre per riga perché le texture si vedano; l'ultimo foglio è solo,
          // e i due posti accanto li prende l'intento: la griglia si chiude piena
          righe: [
            ['/portfolio/sperimentazione/foglio-01.jpg', '/portfolio/sperimentazione/foglio-02.jpg', '/portfolio/sperimentazione/foglio-03.jpg'],
            ['/portfolio/sperimentazione/foglio-04.jpg', '/portfolio/sperimentazione/foglio-05.jpg', '/portfolio/sperimentazione/foglio-06.jpg'],
            ['/portfolio/sperimentazione/foglio-07.jpg', '/portfolio/sperimentazione/foglio-08.jpg', '/portfolio/sperimentazione/foglio-09.jpg'],
            ['/portfolio/sperimentazione/foglio-10.jpg', '/portfolio/sperimentazione/foglio-11.jpg', '/portfolio/sperimentazione/foglio-12.jpg'],
            ['/portfolio/sperimentazione/foglio-13.jpg', '/portfolio/sperimentazione/foglio-14.jpg', '/portfolio/sperimentazione/foglio-15.jpg'],
            ['/portfolio/sperimentazione/foglio-16.jpg', '/portfolio/sperimentazione/foglio-17.jpg', '/portfolio/sperimentazione/foglio-18.jpg'],
            ['/portfolio/sperimentazione/foglio-19.jpg', '/portfolio/sperimentazione/foglio-20.jpg', '/portfolio/sperimentazione/foglio-21.jpg'],
            [
              '/portfolio/sperimentazione/foglio-22.jpg',
              {
                // due posti da foglio (verticale, 3448×4592) più lo spazio fra loro
                rapporto: (2 * 3448) / 4592,
                spazi:    1,
                blocco: [
                  {
                    label: "L'intento",
                    text:  "Trovare il corretto equilibrio che permetta alla casualità di esprimersi ed evolversi, concedendomi per analogia di riflettere sul mistero dell'origine delle cose.",
                  },
                ],
              },
            ],
          ],
        },
        {
          label:       'I fogli in movimento',
          sottotitolo: '6 collage video',
          // 4:5, larghi più o meno quanto la loro misura vera: non si sgranano
          righe: [
            [
              { video: '/portfolio/sperimentazione/video-01.mp4', larghezza: 1080, altezza: 1350 },
              { video: '/portfolio/sperimentazione/video-02.mp4', larghezza: 368, altezza: 464 },
              { video: '/portfolio/sperimentazione/video-03.mp4', larghezza: 368, altezza: 464 },
            ],
            [
              { video: '/portfolio/sperimentazione/video-04.mp4', larghezza: 368, altezza: 464 },
              { video: '/portfolio/sperimentazione/video-05.mp4', larghezza: 368, altezza: 464 },
              { video: '/portfolio/sperimentazione/video-06.mp4', larghezza: 368, altezza: 464 },
            ],
          ],
        },
      ],
      // resta per l'anteprima nei link condivisi
      mainImage: '/portfolio/sperimentazione/foglio-01.jpg',
      mapX: 0.87, mapY: 0.80,
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
    { label: 'Instagram', href: 'https://instagram.com/giovane_kudos',       aria: 'Instagram @giovane_kudos' },
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
      items: ['Italia + trasferte', 'Remoto per digital', 'Freelance / agenzia'],
    },
  ],
}

/* ─── CONTACT ────────────────────────────────────────────────────────────── */

export const CONTACT = {
  heading: 'Raccontami il tuo progetto.',
  lead:    'Anche se non hai ancora le idee chiare — partiamo da lì.',
  /** Ottieni il tuo ID su formspree.io */
  formspreeId: 'xvgzbgzl',
  directLinks: [
    {
      label: 'WhatsApp',
      icon:  'W',
      href:  'https://wa.me/393931959752',
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
      label: '@giovane_kudos',
      icon:  'IG',
      href:  'https://instagram.com/giovane_kudos',
      aria:  'Instagram di Andrea',
    },
  ],
  form: {
    fields: [
      { id: 'name',    name: 'name',    type: 'text', label: 'Nome',             placeholder: 'Mario Rossi',                              required: true  },
      // senza l'email non si puo' rispondere: Formspree la usa come indirizzo di risposta
      { id: 'email',   name: 'email',   type: 'email', label: 'Email',           placeholder: 'mario@esempio.it',                         required: true  },
      { id: 'project', name: 'project', type: 'text', label: 'Tipo di progetto', placeholder: 'Identità visiva, murale, social media...', required: false },
    ],
    messageLabel:       'Raccontami',
    messagePlaceholder: 'Ho un negozio di bici e vorrei...',
    submitLabel:        'Invia messaggio',
    sendingLabel:       'Invio in corso…',
    // l'esito dell'invio: la parola in mono, poi la frase
    done:  { tag: '✦ Ricevuto',    text: 'Grazie! Ho il tuo messaggio, ti rispondo presto.' },
    error: { tag: '✦ Non è partito', text: 'Riprova, oppure scrivimi a apizzoglio@gmail.com.' },
  },
}
