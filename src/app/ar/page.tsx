import type { Metadata } from 'next'
import Link from 'next/link'
import QRCode from 'qrcode'
import { AR, BRAND } from '@/config/content'
import { ArViewer } from './ArViewer'
import styles from './ar.module.css'

export const metadata: Metadata = {
  title: `${AR.label} — ${BRAND.siteTitle}`,
  description: AR.lead,
  alternates: { canonical: AR.url },
}

export default async function Page() {
  // Il QR mostrato a chi apre la pagina dal computer: generato qui, sul server,
  // dallo stesso indirizzo di content.ts — nessuno script in piu' nel browser.
  const qr = await QRCode.toString(AR.url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    color: { dark: '#1A1A1A', light: '#F5F0E8' },
  })

  return (
    <main className={styles.root}>
      <header className={styles.top}>
        <Link href="/" className={styles.back}>← {AR.back}</Link>
        <span className={styles.label}>{AR.label}</span>
      </header>

      <section className={styles.intro}>
        <h1 className={styles.heading}>{AR.heading}</h1>
        <p className={styles.lead}>{AR.lead}</p>
      </section>

      <ArViewer
        src={AR.model}
        alt={AR.alt}
        button={AR.button}
        hint={AR.hint}
        qr={
          <aside className={styles.qr}>
            <div className={styles.qrCode} dangerouslySetInnerHTML={{ __html: qr }} />
            <div>
              <h2 className={styles.qrTitle}>{AR.qrTitle}</h2>
              <p className={styles.qrText}>{AR.qrText}</p>
              <a className={styles.qrDownload} href="/ar/qr-ar.svg" download="artismi-qr-ar.svg">
                {AR.qrDownload}
              </a>
            </div>
          </aside>
        }
      />
    </main>
  )
}
