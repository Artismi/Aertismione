// ============================================================
//  ARTISMI — Figma Plugin: Generate Full File
//  Crea l'intero file Figma di Artismi da zero:
//  design system, pagine, sezioni, contenuti, prototipo.
//  Run: Plugins > Development > Run from manifest
// ============================================================

// ─── DESIGN SYSTEM ──────────────────────────────────────────

const DS = {
  colors: {
    // Brand
    ink:        { r: 0.102, g: 0.102, b: 0.102 }, // #1A1A1A
    paper:      { r: 0.961, g: 0.941, b: 0.910 }, // #F5F0E8
    ice:        { r: 0.616, g: 0.831, b: 0.933 }, // #9DD4EE
    blush:      { r: 0.910, g: 0.659, b: 0.749 }, // #E8A8BF
    // Accents
    amber:      { r: 0.784, g: 0.525, b: 0.063 }, // #C8860A
    violet:     { r: 0.482, g: 0.310, b: 0.749 }, // #7B4FBF
    // Projects
    bici:       { r: 0.769, g: 0.384, b: 0.176 }, // #C4622D
    mulini:     { r: 0.357, g: 0.557, b: 0.651 }, // #5B8EA6
    torino:     { r: 0.102, g: 0.102, b: 0.180 }, // #1A1A2E
    punk:       { r: 0.102, g: 0.102, b: 0.102 }, // #1A1A1A
    ecosistema: { r: 0.290, g: 0.404, b: 0.255 }, // #4A6741
    speriment:  { r: 0.565, g: 0.565, b: 0.627 }, // #9090A0
    alice:      { r: 0.545, g: 0.302, b: 0.659 }, // #8B4DA8
  },
  // Font stacks (famiglia usata nel sito)
  fonts: {
    display:  'Fraunces',   // Titoli serif
    label:    'Bebas Neue', // Label condensed
    body:     'Courier Prime', // Corpo typewriter
    ui:       'JetBrains Mono', // Micro label
  },
  // Dimensioni frame (1440×900 desktop, 390×844 mobile)
  desktop: { w: 1440, h: 900 },
  mobile:  { w: 390,  h: 844 },
  // Spaziature
  spacing: { xs: 8, sm: 16, md: 32, lg: 64, xl: 96 },
};

// ─── CONTENUTO (da content.ts) ──────────────────────────────

const CONTENT = {
  brand: {
    name: 'ARTISMI',
    tagline: 'Artismi completa la tua attività con la narrazione che le manca.',
  },
  nav: {
    links: ['Home', 'Chi Sono', 'Servizi'],
    cta: 'Scrivimi',
  },
  hero: {
    lines: [
      'La tua attività è unica.',
      'Merita di non sembrare\nuna tra le tante.',
      'Costruiamo la narrazione\nche ti somiglia davvero.',
    ],
    subtitle: 'Artismi completa la tua attività con il linguaggio visivo che le manca.',
    ctas: ['Scopri le fatture dello stregone Sam', 'Iniziamo a narrare'],
  },
  vision: {
    problema: {
      heading: 'Il Problema',
      body: 'Oggi non basta fare bene il tuo lavoro.\nLe persone scelgono anche quello in cui si riconoscono, che possono capire.\nSe la tua attività non si racconta, non trasmette il suo vero valore.',
    },
    soluzione: {
      heading: 'La Soluzione',
      body: 'Ti accompagno in un percorso strutturato per scoprire l\'identità della tua attività.\nPoi la concretizziamo perché diventi il linguaggio con cui comunichi con il cliente, su tutti i livelli che vuoi.',
    },
  },
  services: {
    heading: 'Servizi',
    intro: "Ogni elemento che costruiamo nasce dall'identità della tua attività.",
    packages: [
      {
        label: 'Prestazioni Singole',
        type: 'Una tantum',
        items: [
          { name: 'Illustrazione', price: '120 – 350 €' },
          { name: 'Poster / Volantino', price: '100 – 280 €' },
          { name: 'Murale', price: '500 – 1.200 €' },
        ],
      },
      {
        label: 'Identità Narrativa',
        type: 'Percorso completo',
        featured: true,
        items: [
          { name: 'Identità narrativa', price: '649.99 € (Promo)' },
          { name: 'Ecosistema completo', price: '3.500 – 6.000 €' },
        ],
      },
      {
        label: 'Continuativi',
        type: 'Al mese',
        items: [
          { name: 'Social media base', price: '200 – 350 €/mese' },
          { name: 'Social media attivo', price: '400 – 650 €/mese' },
          { name: 'Manutenzione sito', price: '100 – 180 €/mese' },
        ],
      },
    ],
  },
  portfolio: {
    heading: 'Portfolio',
    projects: [
      { title: 'Bicicleria', category: 'Identità visiva completa', tagline: 'Dal murale alla vetrina, dai gadget al feed.', accent: DS.colors.bici },
      { title: 'Mulini', category: 'Illustrazione / Tesi di laurea', tagline: 'Striscia illustrata di 6 metri.', accent: DS.colors.mulini },
      { title: 'Torino Invisibile', category: '3D / Realtà Aumentata', tagline: "Opera in realtà aumentata ispirata a Calvino.", accent: DS.colors.torino },
      { title: 'Illustrazioni & Artwork', category: 'Raccolta', tagline: 'Selezione illustrazioni e artwork indipendenti.', accent: DS.colors.alice },
      { title: 'Ecosistema Boreale', category: 'Illustrazione', tagline: 'Illustrazione per Borealis / Aurora.', accent: DS.colors.ecosistema },
      { title: 'Sperimentazione Pittorica', category: 'Pittura / Archivio', tagline: 'Circa 80 fogli A3 — macchie, segni, texture.', accent: DS.colors.speriment },
    ],
  },
  about: {
    heading: 'Chi Sono',
    bio: 'Sono Andrea, designer e illustratore.\nCredo che ogni attività abbia già un\'identità — un mondo immaginario che esiste dentro le persone, gli oggetti e le storie che la abitano.',
    skills: [
      { code: 'S-01', label: 'SOFTWARE', items: ['Illustrator', 'InDesign', 'Photoshop', 'Procreate', 'Blender', 'Premiere Pro'] },
      { code: 'S-02', label: 'STAMPA & PRODUZIONE', items: ['Risografia', 'Serigrafia', 'Stampa offset', 'Plotter / vinile'] },
      { code: 'S-03', label: 'SPAZIO FISICO', items: ['Murale interno / esterno', 'Wayfinding', 'Installazione', 'Set design'] },
      { code: 'S-04', label: 'COSA CONSEGNO', items: ['Vettori editabili (.ai .pdf)', 'Font con licenza', 'Brand manual', 'Template'] },
      { code: 'S-05', label: 'PROCESSO', items: ['Brief strutturato', '3 concept iniziali', '2 round revisioni', 'Handoff completo'] },
      { code: 'S-06', label: 'OPERATIVITÀ', items: ['Italia + trasferte', 'Remoto per digital', 'Risposta entro 24h', 'Freelance / agenzia'] },
    ],
  },
  contact: {
    heading: 'Raccontami il tuo progetto.',
    lead: 'Anche se non hai ancora le idee chiare — partiamo da lì.',
    links: ['WhatsApp: +39 319 597 5752', 'apizzoglio@gmail.com', '@angea_pangea'],
  },
};

// ─── UTILITIES ──────────────────────────────────────────────

function rgb(c) { return { r: c.r, g: c.g, b: c.b }; }
function solidPaint(color, opacity = 1) {
  return [{ type: 'SOLID', color: rgb(color), opacity }];
}

async function loadFont(family, style = 'Regular') {
  try { await figma.loadFontAsync({ family, style }); } catch (e) {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  }
}

async function makeText(str, opts = {}) {
  await loadFont(opts.family || DS.fonts.body, opts.style || 'Regular');
  const t = figma.createText();
  t.fontName        = { family: opts.family || DS.fonts.body, style: opts.style || 'Regular' };
  t.characters      = str;
  t.fontSize        = opts.size || 16;
  t.fills           = solidPaint(opts.color || DS.colors.ink);
  t.textAlignHorizontal = opts.align || 'LEFT';
  if (opts.lineHeight) t.lineHeight = { value: opts.lineHeight, unit: 'PIXELS' };
  if (opts.letterSpacing) t.letterSpacing = { value: opts.letterSpacing, unit: 'PERCENT' };
  if (opts.name) t.name = opts.name;
  return t;
}

function makeRect(w, h, color, opts = {}) {
  const r = figma.createRectangle();
  r.resize(w, h);
  r.fills = color ? solidPaint(color, opts.opacity || 1) : [];
  r.cornerRadius = opts.radius || 0;
  if (opts.name) r.name = opts.name;
  return r;
}

function makeFrame(name, w, h, color) {
  const f = figma.createFrame();
  f.name = name;
  f.resize(w, h);
  f.fills = color ? solidPaint(color) : [{ type: 'SOLID', color: rgb(DS.colors.paper) }];
  return f;
}

function autoLayout(frame, dir = 'VERTICAL', spacing = 0, padding = 0) {
  frame.layoutMode = dir;
  frame.itemSpacing = spacing;
  frame.paddingTop = frame.paddingBottom = frame.paddingLeft = frame.paddingRight = padding;
  frame.primaryAxisSizingMode   = 'AUTO';
  frame.counterAxisSizingMode   = 'AUTO';
}

// ─── PAGE: 0 — COVER ────────────────────────────────────────

async function buildCover(page) {
  page.name = '00 — Cover';
  const frame = makeFrame('Cover', DS.desktop.w, DS.desktop.h, DS.colors.ink);
  page.appendChild(frame);
  frame.x = 0; frame.y = 0;

  // Big logo
  const logo = await makeText('ARTISMI', {
    family: DS.fonts.label, style: 'Regular',
    size: 180, color: DS.colors.paper,
    align: 'CENTER', name: 'Logo',
    letterSpacing: 12,
  });
  frame.appendChild(logo);
  logo.x = (DS.desktop.w - logo.width) / 2;
  logo.y = 280;

  const tag = await makeText(CONTENT.brand.tagline, {
    family: DS.fonts.body, size: 18,
    color: DS.colors.blush, align: 'CENTER', name: 'Tagline',
  });
  frame.appendChild(tag);
  tag.x = (DS.desktop.w - tag.width) / 2;
  tag.y = 500;

  // Version label
  const ver = await makeText('ARTISMI DESIGN STUDIO — FILE FIGMA v1.0 — 2026', {
    family: DS.fonts.ui, size: 11,
    color: DS.colors.paper, align: 'CENTER', name: 'Version',
  });
  ver.opacity = 0.3;
  frame.appendChild(ver);
  ver.x = (DS.desktop.w - ver.width) / 2;
  ver.y = DS.desktop.h - 60;
}

// ─── PAGE: 1 — DESIGN SYSTEM ────────────────────────────────

async function buildDesignSystem(page) {
  page.name = '01 — Design System';
  const W = DS.desktop.w;
  let currentY = 80;

  // Section title helper
  async function sectionTitle(text) {
    const t = await makeText(text, {
      family: DS.fonts.label, size: 24,
      color: DS.colors.ink, name: text,
    });
    page.appendChild(t);
    t.x = 80; t.y = currentY;
    currentY += 56;
    return t;
  }

  // ── Colors
  await sectionTitle('COLORI');
  const colorEntries = Object.entries(DS.colors);
  const swatchW = 120, swatchH = 80, gap = 16;
  let cx = 80;
  for (const [name, color] of colorEntries) {
    const swatch = makeFrame(`color/${name}`, swatchW, swatchH + 36, null);
    swatch.fills = [];
    page.appendChild(swatch);
    swatch.x = cx; swatch.y = currentY;

    const rect = makeRect(swatchW, swatchH, color, { name: `fill/${name}` });
    swatch.appendChild(rect);
    rect.cornerRadius = 8;

    const label = await makeText(name, {
      family: DS.fonts.ui, size: 10,
      color: DS.colors.ink, name: 'label',
    });
    swatch.appendChild(label);
    label.x = 0; label.y = swatchH + 8;

    cx += swatchW + gap;
    if (cx + swatchW > W - 80) { cx = 80; currentY += swatchH + 60; }
  }
  currentY += swatchH + 80;

  // ── Typography
  await sectionTitle('TIPOGRAFIA');
  const typeSamples = [
    { text: 'Fraunces — Display Serif', family: DS.fonts.display, style: 'Regular', size: 48 },
    { text: 'Bebas Neue — LABEL CONDENSED', family: DS.fonts.label, style: 'Regular', size: 36 },
    { text: 'Courier Prime — Corpo testo e paragrafi', family: DS.fonts.body, style: 'Regular', size: 18 },
    { text: 'JetBrains Mono — UI micro label', family: DS.fonts.ui, size: 13, style: 'Regular' },
  ];
  for (const s of typeSamples) {
    const t = await makeText(s.text, { family: s.family, style: s.style, size: s.size, color: DS.colors.ink });
    page.appendChild(t);
    t.x = 80; t.y = currentY;
    currentY += s.size + 32;
  }
  currentY += 40;

  // ── Spacing
  await sectionTitle('SPAZIATURA');
  let sx = 80;
  for (const [key, val] of Object.entries(DS.spacing)) {
    const box = makeRect(val, val, DS.colors.violet, { radius: 4, name: `spacing/${key}` });
    page.appendChild(box);
    box.x = sx; box.y = currentY;
    const lbl = await makeText(`${key}: ${val}px`, { family: DS.fonts.ui, size: 10, color: DS.colors.ink });
    page.appendChild(lbl);
    lbl.x = sx; lbl.y = currentY + val + 6;
    sx += val + 32;
  }
}

// ─── PAGE: 2 — HERO ─────────────────────────────────────────

async function buildHero(page) {
  page.name = '02 — Hero';
  const { w, h } = DS.desktop;

  // Desktop frame
  const frame = makeFrame('Hero — Desktop', w, h * 1.2, DS.colors.paper);
  page.appendChild(frame);

  // Navbar
  const nav = makeFrame('Navbar', w, 64, DS.colors.ink);
  frame.appendChild(nav);
  nav.x = 0; nav.y = 0;
  const navLogo = await makeText('ARTISMI', {
    family: DS.fonts.label, size: 20, color: DS.colors.paper, name: 'NavLogo',
  });
  nav.appendChild(navLogo);
  navLogo.x = 40; navLogo.y = (64 - navLogo.height) / 2;
  let navX = w - 300;
  for (const link of CONTENT.nav.links) {
    const lt = await makeText(link, { family: DS.fonts.ui, size: 12, color: DS.colors.paper });
    nav.appendChild(lt);
    lt.x = navX; lt.y = (64 - lt.height) / 2;
    navX += lt.width + 32;
  }
  const ctaBtn = makeRect(120, 36, DS.colors.amber, { radius: 4, name: 'NavCTA_BG' });
  nav.appendChild(ctaBtn);
  ctaBtn.x = w - 156; ctaBtn.y = 14;
  const ctaT = await makeText(CONTENT.nav.cta, {
    family: DS.fonts.ui, size: 12, color: DS.colors.paper, align: 'CENTER', name: 'NavCTA_Label',
  });
  nav.appendChild(ctaT);
  ctaT.x = w - 156 + (120 - ctaT.width) / 2;
  ctaT.y = 14 + (36 - ctaT.height) / 2;

  // Hero copy — 3 lines
  const startY = 160;
  const sizes = [80, 64, 56];
  const colors = [DS.colors.ink, DS.colors.ink, DS.colors.amber];
  for (let i = 0; i < CONTENT.hero.lines.length; i++) {
    const t = await makeText(CONTENT.hero.lines[i], {
      family: DS.fonts.display, style: 'Regular',
      size: sizes[i], color: colors[i],
      name: `HeroLine_${i + 1}`,
      lineHeight: sizes[i] * 1.15,
    });
    frame.appendChild(t);
    t.x = 80;
    t.y = startY + i * (sizes[i] + 24);
  }

  // Subtitle
  const sub = await makeText(CONTENT.hero.subtitle, {
    family: DS.fonts.body, size: 18, color: DS.colors.ink,
    name: 'HeroSubtitle',
  });
  frame.appendChild(sub);
  sub.x = 80; sub.y = 520;
  sub.opacity = 0.7;

  // CTA buttons
  const btns = CONTENT.hero.ctas;
  let bx = 80;
  const btnColors = [DS.colors.amber, DS.colors.ink];
  const txtColors = [DS.colors.paper, DS.colors.paper];
  for (let i = 0; i < btns.length; i++) {
    const bw = 280, bh = 52;
    const bg = makeRect(bw, bh, btnColors[i], { radius: 6, name: `HeroCTA_${i}_bg` });
    frame.appendChild(bg);
    bg.x = bx; bg.y = 600;
    const bt = await makeText(btns[i], {
      family: DS.fonts.ui, size: 13, color: txtColors[i], align: 'CENTER', name: `HeroCTA_${i}_label`,
    });
    frame.appendChild(bt);
    bt.x = bx + (bw - bt.width) / 2; bt.y = 600 + (bh - bt.height) / 2;
    bx += bw + 20;
  }

  // Scroll hint
  const scroll = await makeText('↓  ' + CONTENT.hero.lines[0].split(' ')[0].toLowerCase(), {
    family: DS.fonts.ui, size: 11, color: DS.colors.ink, name: 'ScrollHint',
  });
  frame.appendChild(scroll);
  scroll.x = 80; scroll.y = 700;
  scroll.opacity = 0.4;

  // Mobile variant
  const mob = makeFrame('Hero — Mobile', DS.mobile.w, DS.mobile.h, DS.colors.paper);
  page.appendChild(mob);
  mob.x = w + 80; mob.y = 0;

  const mHeroT = await makeText('La tua attività è unica.\nMerita di non sembrare\nuna tra le tante.', {
    family: DS.fonts.display, size: 40, color: DS.colors.ink, name: 'MobileHeroText', lineHeight: 48,
  });
  mob.appendChild(mHeroT);
  mHeroT.x = 24; mHeroT.y = 120;
}

// ─── PAGE: 3 — VISION ───────────────────────────────────────

async function buildVision(page) {
  page.name = '03 — Vision';
  const { w, h } = DS.desktop;
  const frame = makeFrame('Vision — Desktop', w, h, DS.colors.paper);
  page.appendChild(frame);

  // Two blocks side by side
  const blocks = [
    { ...CONTENT.vision.problema, bg: DS.colors.ink, fg: DS.colors.paper, accent: DS.colors.amber, x: 80 },
    { ...CONTENT.vision.soluzione, bg: DS.colors.blush, fg: DS.colors.ink, accent: DS.colors.violet, x: w / 2 + 40 },
  ];

  for (const b of blocks) {
    const bw = w / 2 - 120;
    const card = makeFrame(`Vision/${b.heading}`, bw, 480, b.bg);
    card.cornerRadius = 16;
    frame.appendChild(card);
    card.x = b.x; card.y = (h - 480) / 2;

    const heading = await makeText(b.heading, {
      family: DS.fonts.label, size: 40, color: b.accent, name: 'Heading',
    });
    card.appendChild(heading);
    heading.x = 48; heading.y = 60;

    const body = await makeText(b.body, {
      family: DS.fonts.body, size: 17, color: b.fg, name: 'Body', lineHeight: 28,
    });
    card.appendChild(body);
    body.x = 48; body.y = 140;
    body.resize(bw - 96, body.height);
    body.textAutoResize = 'HEIGHT';
  }
}

// ─── PAGE: 4 — SERVICES ─────────────────────────────────────

async function buildServices(page) {
  page.name = '04 — Servizi';
  const { w, h } = DS.desktop;
  const frame = makeFrame('Servizi — Desktop', w, h * 1.1, DS.colors.paper);
  page.appendChild(frame);

  // Section heading
  const heading = await makeText(CONTENT.services.heading, {
    family: DS.fonts.label, size: 72, color: DS.colors.ink, name: 'SectionHeading',
    letterSpacing: 4,
  });
  frame.appendChild(heading);
  heading.x = 80; heading.y = 80;

  const intro = await makeText(CONTENT.services.intro, {
    family: DS.fonts.body, size: 18, color: DS.colors.ink, name: 'ServicesIntro',
    lineHeight: 28,
  });
  frame.appendChild(intro);
  intro.x = 80; intro.y = 180;
  intro.resize(w - 400, intro.height);
  intro.textAutoResize = 'HEIGHT';

  // Three packages
  const cardW = (w - 200) / 3 - 16;
  const bgColors = [DS.colors.paper, DS.colors.ink, DS.colors.paper];
  const fgColors = [DS.colors.ink, DS.colors.paper, DS.colors.ink];
  const accentColors = [DS.colors.amber, DS.colors.amber, DS.colors.amber];
  const startY = 280;

  for (let i = 0; i < CONTENT.services.packages.length; i++) {
    const pkg = CONTENT.services.packages[i];
    const cx = 80 + i * (cardW + 24);
    const card = makeFrame(`Package/${pkg.label}`, cardW, 420, bgColors[i]);
    card.cornerRadius = 12;
    if (pkg.featured) {
      // Outline effect
      card.strokes = [{ type: 'SOLID', color: rgb(DS.colors.amber) }];
      card.strokeWeight = 2;
    }
    frame.appendChild(card);
    card.x = cx; card.y = startY;

    const label = await makeText(pkg.label, {
      family: DS.fonts.label, size: 22, color: accentColors[i], name: 'PackageLabel',
    });
    card.appendChild(label);
    label.x = 32; label.y = 32;

    const type = await makeText(pkg.type.toUpperCase(), {
      family: DS.fonts.ui, size: 10, color: fgColors[i], name: 'PackageType',
    });
    type.opacity = 0.5;
    card.appendChild(type);
    type.x = 32; type.y = 72;

    // Divider line
    const div = makeRect(cardW - 64, 1, fgColors[i], { name: 'Divider' });
    div.opacity = 0.15;
    card.appendChild(div);
    div.x = 32; div.y = 96;

    let itemY = 120;
    for (const item of pkg.items) {
      const name = await makeText(item.name, {
        family: DS.fonts.body, size: 14, color: fgColors[i], name: `Item/${item.name}`,
      });
      card.appendChild(name);
      name.x = 32; name.y = itemY;

      const price = await makeText(item.price, {
        family: DS.fonts.ui, size: 12, color: accentColors[i], name: `Price/${item.name}`,
        align: 'RIGHT',
      });
      card.appendChild(price);
      price.x = cardW - 32 - price.width; price.y = itemY;
      itemY += 48;
    }
  }
}

// ─── PAGE: 5 — PORTFOLIO ────────────────────────────────────

async function buildPortfolio(page) {
  page.name = '05 — Portfolio';
  const { w, h } = DS.desktop;

  // Map overview
  const mapFrame = makeFrame('Portfolio — Mappa', w, h, DS.colors.ink);
  page.appendChild(mapFrame);

  const heading = await makeText(CONTENT.portfolio.heading, {
    family: DS.fonts.label, size: 72, color: DS.colors.paper,
    name: 'PortfolioHeading', letterSpacing: 4,
  });
  mapFrame.appendChild(heading);
  heading.x = 80; heading.y = 60;

  // Map positions (from content.ts mapX/mapY)
  const mapPositions = [
    { title: 'Bicicleria',             mapX: 0.15, mapY: 0.30, accent: DS.colors.bici },
    { title: 'Mulini',                 mapX: 0.48, mapY: 0.22, accent: DS.colors.mulini },
    { title: 'Torino Invisibile',      mapX: 0.65, mapY: 0.42, accent: DS.colors.torino },
    { title: 'Illustrazioni & Artwork',mapX: 0.80, mapY: 0.22, accent: DS.colors.alice },
    { title: 'Ecosistema Boreale',     mapX: 0.38, mapY: 0.82, accent: DS.colors.ecosistema },
    { title: 'Sperimentazione',        mapX: 0.78, mapY: 0.82, accent: DS.colors.speriment },
  ];

  const mapArea = { x: 80, y: 160, w: w - 160, h: h - 240 };

  for (const p of mapPositions) {
    const px = mapArea.x + p.mapX * mapArea.w;
    const py = mapArea.y + p.mapY * mapArea.h;

    // Node circle
    const circle = figma.createEllipse();
    circle.resize(24, 24);
    circle.fills = solidPaint(p.accent);
    circle.name = `Node/${p.title}`;
    mapFrame.appendChild(circle);
    circle.x = px - 12; circle.y = py - 12;

    // Outer pulse ring
    const ring = figma.createEllipse();
    ring.resize(48, 48);
    ring.fills = [];
    ring.strokes = solidPaint(p.accent);
    ring.strokeWeight = 1.5;
    ring.opacity = 0.4;
    mapFrame.appendChild(ring);
    ring.x = px - 24; ring.y = py - 24;

    // Label
    const lbl = await makeText(p.title.toUpperCase(), {
      family: DS.fonts.ui, size: 10, color: DS.colors.paper, name: `Label/${p.title}`,
    });
    mapFrame.appendChild(lbl);
    lbl.x = px + 30; lbl.y = py - 6;
  }

  // Individual project detail frames (one per project)
  let detailX = 0;
  for (let i = 0; i < CONTENT.portfolio.projects.length; i++) {
    const proj = CONTENT.portfolio.projects[i];
    const detail = makeFrame(`Detail/${proj.title}`, w, h, DS.colors.paper);
    page.appendChild(detail);
    detail.x = (i + 1) * (w + 80); detail.y = 0;

    // Back button hint
    const back = await makeText('← Portfolio', { family: DS.fonts.ui, size: 12, color: DS.colors.ink, name: 'BackBtn' });
    back.opacity = 0.5;
    detail.appendChild(back);
    back.x = 80; back.y = 80;

    // Accent header strip
    const strip = makeRect(w, 8, proj.accent, { name: 'AccentStrip' });
    detail.appendChild(strip);
    strip.x = 0; strip.y = 0;

    const cat = await makeText(proj.category.toUpperCase(), {
      family: DS.fonts.ui, size: 11, color: DS.colors.ink, name: 'Category',
    });
    cat.opacity = 0.5;
    detail.appendChild(cat);
    cat.x = 80; cat.y = 140;

    const title = await makeText(proj.title, {
      family: DS.fonts.display, size: 72, color: DS.colors.ink, name: 'Title',
    });
    detail.appendChild(title);
    title.x = 80; title.y = 170;

    const tagline = await makeText(proj.tagline, {
      family: DS.fonts.body, size: 22, color: DS.colors.ink, name: 'Tagline', lineHeight: 32,
    });
    detail.appendChild(tagline);
    tagline.x = 80; tagline.y = 310;
    tagline.opacity = 0.8;

    // Image placeholder
    const imgPh = makeRect(w - 160, 380, proj.accent, { radius: 12, name: 'ImagePlaceholder' });
    imgPh.opacity = 0.12;
    detail.appendChild(imgPh);
    imgPh.x = 80; imgPh.y = 400;

    const phLabel = await makeText('[ Immagine progetto ]', {
      family: DS.fonts.ui, size: 12, color: DS.colors.ink, align: 'CENTER', name: 'PlaceholderLabel',
    });
    detail.appendChild(phLabel);
    phLabel.x = 80 + ((w - 160 - phLabel.width) / 2); phLabel.y = 400 + 180;
    phLabel.opacity = 0.3;
  }
}

// ─── PAGE: 6 — ABOUT ────────────────────────────────────────

async function buildAbout(page) {
  page.name = '06 — Chi Sono';
  const { w, h } = DS.desktop;
  const frame = makeFrame('About — Desktop', w, h, DS.colors.ink);
  page.appendChild(frame);

  // Heading
  const heading = await makeText(CONTENT.about.heading, {
    family: DS.fonts.label, size: 72, color: DS.colors.paper,
    name: 'AboutHeading', letterSpacing: 4,
  });
  frame.appendChild(heading);
  heading.x = 80; heading.y = 80;

  // Bio card
  const bioCard = makeFrame('BioCard', 560, 420, DS.colors.paper);
  bioCard.cornerRadius = 16;
  frame.appendChild(bioCard);
  bioCard.x = 80; bioCard.y = 200;

  const bio = await makeText(CONTENT.about.bio, {
    family: DS.fonts.body, size: 17, color: DS.colors.ink,
    name: 'BioText', lineHeight: 28,
  });
  bioCard.appendChild(bio);
  bio.x = 48; bio.y = 48;
  bio.resize(464, bio.height);
  bio.textAutoResize = 'HEIGHT';

  // Skills grid
  const skillsStartX = 700;
  const skillsStartY = 200;
  const skillW = 280, skillH = 140;
  const cols = 2;

  for (let i = 0; i < CONTENT.about.skills.length; i++) {
    const skill = CONTENT.about.skills[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const sx = skillsStartX + col * (skillW + 24);
    const sy = skillsStartY + row * (skillH + 16);

    const card = makeFrame(`Skill/${skill.code}`, skillW, skillH, DS.colors.paper);
    card.cornerRadius = 8;
    card.opacity = 0.08;
    frame.appendChild(card);
    card.x = sx; card.y = sy;

    const cardFront = makeFrame(`Skill/${skill.code}/Content`, skillW, skillH);
    cardFront.fills = [];
    frame.appendChild(cardFront);
    cardFront.x = sx; cardFront.y = sy;

    const code = await makeText(skill.code, {
      family: DS.fonts.ui, size: 10, color: DS.colors.amber, name: 'Code',
    });
    cardFront.appendChild(code);
    code.x = 20; code.y = 16;

    const label = await makeText(skill.label, {
      family: DS.fonts.label, size: 16, color: DS.colors.paper, name: 'Label',
    });
    cardFront.appendChild(label);
    label.x = 20; label.y = 34;

    const items = await makeText(skill.items.join(' · '), {
      family: DS.fonts.ui, size: 11, color: DS.colors.paper, name: 'Items', lineHeight: 18,
    });
    items.opacity = 0.6;
    cardFront.appendChild(items);
    items.x = 20; items.y = 60;
    items.resize(skillW - 40, items.height);
    items.textAutoResize = 'HEIGHT';
  }

  // Avatar placeholder
  const avatar = makeRect(280, 520, DS.colors.ice, { radius: 140, name: 'AvatarPlaceholder' });
  avatar.opacity = 0.2;
  frame.appendChild(avatar);
  avatar.x = w - 360; avatar.y = 180;

  const avatarLabel = await makeText('[ Avatar 3D ]', {
    family: DS.fonts.ui, size: 12, color: DS.colors.paper, align: 'CENTER', name: 'AvatarLabel',
  });
  avatarLabel.opacity = 0.3;
  frame.appendChild(avatarLabel);
  avatarLabel.x = w - 360 + (280 - avatarLabel.width) / 2;
  avatarLabel.y = 180 + 250;
}

// ─── PAGE: 7 — CONTACT ──────────────────────────────────────

async function buildContact(page) {
  page.name = '07 — Contatti';
  const { w, h } = DS.desktop;
  const frame = makeFrame('Contact — Desktop', w, h, DS.colors.ink);
  page.appendChild(frame);

  const heading = await makeText(CONTENT.contact.heading, {
    family: DS.fonts.display, size: 64, color: DS.colors.paper,
    name: 'ContactHeading', lineHeight: 72,
  });
  frame.appendChild(heading);
  heading.x = 80; heading.y = 80;
  heading.resize(700, heading.height);
  heading.textAutoResize = 'HEIGHT';

  const lead = await makeText(CONTENT.contact.lead, {
    family: DS.fonts.body, size: 20, color: DS.colors.paper, name: 'ContactLead',
  });
  lead.opacity = 0.7;
  frame.appendChild(lead);
  lead.x = 80; lead.y = 240;

  // Contact links
  let linkY = 320;
  for (const link of CONTENT.contact.links) {
    const isWA = link.startsWith('WhatsApp');
    const bg = makeRect(360, 56, isWA ? DS.colors.amber : DS.colors.paper, {
      radius: 8, name: `Link/${link}`,
    });
    if (!isWA) bg.opacity = 0.1;
    frame.appendChild(bg);
    bg.x = 80; bg.y = linkY;

    const lt = await makeText(link, {
      family: DS.fonts.ui, size: 14, color: DS.colors.paper, name: `LinkText/${link}`,
    });
    frame.appendChild(lt);
    lt.x = 80 + (360 - lt.width) / 2;
    lt.y = linkY + (56 - lt.height) / 2;
    linkY += 72;
  }

  // Form frame
  const formCard = makeFrame('ContactForm', 560, 480, DS.colors.paper);
  formCard.cornerRadius = 16;
  formCard.opacity = 0.05;
  frame.appendChild(formCard);
  formCard.x = w - 640; formCard.y = 80;

  const formCardFront = makeFrame('ContactForm/Content', 560, 480);
  formCardFront.fills = [];
  frame.appendChild(formCardFront);
  formCardFront.x = w - 640; formCardFront.y = 80;

  const fields = [
    { label: 'Nome', placeholder: 'Mario Rossi', y: 40 },
    { label: 'Tipo di progetto', placeholder: 'Identità visiva, murale, social media...', y: 140 },
    { label: 'Raccontami', placeholder: 'Ho un negozio di bici e vorrei...', y: 240, tall: true },
  ];

  for (const f of fields) {
    const fl = await makeText(f.label, {
      family: DS.fonts.ui, size: 11, color: DS.colors.paper, name: `FieldLabel/${f.label}`,
    });
    formCardFront.appendChild(fl);
    fl.x = 40; fl.y = f.y;

    const fh = f.tall ? 120 : 48;
    const fbg = makeRect(480, fh, DS.colors.paper, { radius: 6, name: `FieldBg/${f.label}` });
    fbg.opacity = 0.07;
    formCardFront.appendChild(fbg);
    fbg.x = 40; fbg.y = f.y + 22;

    const fph = await makeText(f.placeholder, {
      family: DS.fonts.body, size: 14, color: DS.colors.paper, name: `Placeholder/${f.label}`,
    });
    fph.opacity = 0.25;
    formCardFront.appendChild(fph);
    fph.x = 52; fph.y = f.y + 36;
  }

  // Submit button
  const submitBg = makeRect(480, 52, DS.colors.amber, { radius: 8, name: 'SubmitBg' });
  formCardFront.appendChild(submitBg);
  submitBg.x = 40; submitBg.y = 400;

  const submitT = await makeText('Invia messaggio', {
    family: DS.fonts.ui, size: 14, color: DS.colors.paper, align: 'CENTER', name: 'SubmitLabel',
  });
  formCardFront.appendChild(submitT);
  submitT.x = 40 + (480 - submitT.width) / 2;
  submitT.y = 400 + (52 - submitT.height) / 2;
}

// ─── PAGE: 8 — PROTOTYPE FLOW ───────────────────────────────

async function buildPrototypeFlow(page) {
  page.name = '08 — Flusso Prototipo';
  const { w, h } = DS.desktop;

  const title = await makeText('FLUSSO NAVIGAZIONE — ARTISMI', {
    family: DS.fonts.label, size: 28, color: DS.colors.ink, name: 'FlowTitle',
  });
  page.appendChild(title);
  title.x = 80; title.y = 60;

  const sections = [
    { label: 'Hero', color: DS.colors.amber },
    { label: 'Vision', color: DS.colors.violet },
    { label: 'Servizi', color: DS.colors.ink },
    { label: 'Portfolio', color: DS.colors.bici },
    { label: 'Chi Sono', color: DS.colors.ice },
    { label: 'Contatti', color: DS.colors.ink },
  ];

  const boxW = 180, boxH = 80, gap = 60;
  const startX = 80;
  const startY = 200;

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const bx = startX + i * (boxW + gap);

    const box = makeFrame(`Flow/${s.label}`, boxW, boxH, s.color);
    box.cornerRadius = 8;
    page.appendChild(box);
    box.x = bx; box.y = startY;

    const lbl = await makeText(s.label, {
      family: DS.fonts.label, size: 20, color: DS.colors.paper, align: 'CENTER', name: 'Label',
    });
    box.appendChild(lbl);
    lbl.x = (boxW - lbl.width) / 2;
    lbl.y = (boxH - lbl.height) / 2;

    // Arrow connector (except last)
    if (i < sections.length - 1) {
      const arrow = await makeText('→', {
        family: DS.fonts.body, size: 24, color: DS.colors.ink, name: `Arrow_${i}`,
      });
      page.appendChild(arrow);
      arrow.x = bx + boxW + (gap - arrow.width) / 2;
      arrow.y = startY + (boxH - arrow.height) / 2;
    }
  }

  // Navigation note
  const note = await makeText(
    'SCROLL CONTINUO — La navbar (fissa) porta direttamente a ogni sezione.\nPortfolio: click su nodo mappa → modal dettaglio progetto.',
    { family: DS.fonts.body, size: 14, color: DS.colors.ink, name: 'NavigationNote', lineHeight: 22 }
  );
  note.opacity = 0.6;
  page.appendChild(note);
  note.x = 80; note.y = 340;

  // Scroll mapping table
  const scrollData = [
    ['Scroll Range', 'Sezione'],
    ['0–100vh',    'Hero / Logo 3D'],
    ['100–200vh',  'Text intro'],
    ['200–300vh',  'Vision (Problema / Soluzione)'],
    ['300–420vh',  'Servizi'],
    ['420–550vh',  'Portfolio'],
    ['550–700vh',  'Chi Sono / Avatar'],
    ['700vh+',     'Contatti'],
  ];

  let tableY = 420;
  for (const [range, section] of scrollData) {
    const isHeader = range === 'Scroll Range';
    const row = makeRect(600, 36, isHeader ? DS.colors.ink : DS.colors.paper, {
      radius: 0, name: `TableRow/${range}`,
    });
    row.opacity = isHeader ? 1 : 0.08;
    page.appendChild(row);
    row.x = 80; row.y = tableY;

    const rangeT = await makeText(range, {
      family: DS.fonts.ui, size: isHeader ? 11 : 12,
      color: isHeader ? DS.colors.paper : DS.colors.ink, name: 'Range',
    });
    page.appendChild(rangeT);
    rangeT.x = 96; rangeT.y = tableY + (36 - rangeT.height) / 2;

    const sectionT = await makeText(section, {
      family: isHeader ? DS.fonts.ui : DS.fonts.body, size: isHeader ? 11 : 13,
      color: isHeader ? DS.colors.paper : DS.colors.ink, name: 'Section',
    });
    page.appendChild(sectionT);
    sectionT.x = 360; sectionT.y = tableY + (36 - sectionT.height) / 2;

    tableY += 40;
  }
}

// ─── MAIN ────────────────────────────────────────────────────

async function main() {
  figma.skipInvisibleInstanceChildren = true;

  // Rename the existing first page
  const existingPages = figma.root.children;
  const pageBuilders = [
    buildCover,
    buildDesignSystem,
    buildHero,
    buildVision,
    buildServices,
    buildPortfolio,
    buildAbout,
    buildContact,
    buildPrototypeFlow,
  ];

  // Create pages (reuse first, add the rest)
  const pages = [];
  pages.push(existingPages[0]); // reuse page 1
  for (let i = 1; i < pageBuilders.length; i++) {
    pages.push(figma.createPage());
  }

  // Build each page
  for (let i = 0; i < pageBuilders.length; i++) {
    figma.currentPage = pages[i];
    try {
      await pageBuilders[i](pages[i]);
      console.log(`✓ Built: ${pages[i].name}`);
    } catch (e) {
      console.error(`✗ Error in page ${i}:`, e);
    }
  }

  // Go to cover
  figma.currentPage = pages[0];

  figma.notify('✅ Artismi Figma file generato — 9 pagine, design system completo!', { timeout: 5000 });
  figma.closePlugin();
}

main().catch(err => {
  figma.notify('❌ Errore: ' + err.message, { error: true });
  figma.closePlugin();
});
