/**
 * RawBtn — Bottone con supporto per lettering disegnato a mano.
 *
 * Uso standard (testo):
 *   <RawBtn href="#servizi" label="Scopri i servizi" variant="primary" />
 *
 * Con lettering SVG/PNG (quando Andrea consegna i file):
 *   <RawBtn href="#servizi" asset="/lettering/scopri-servizi.svg" label="Scopri i servizi" variant="primary" />
 *
 * Quando `asset` è presente, il testo diventa visually-hidden (accessibilità) e
 * l'immagine prende tutta la superficie del bottone.
 *
 * Percorso suggerito per gli asset: /public/lettering/<slug>.svg
 */

import styles from './RawBtn.module.css'

interface RawBtnProps {
  href: string
  label: string
  variant?: 'primary' | 'secondary'
  /** Path assoluto all'asset SVG o PNG con il lettering disegnato a mano */
  asset?: string
  className?: string
  onClick?: () => void
}

export function RawBtn({ href, label, variant = 'primary', asset, className, onClick }: RawBtnProps) {
  const cls = [
    styles.btn,
    variant === 'primary' ? styles.primary : styles.secondary,
    asset ? styles.hasAsset : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <a href={href} className={cls} onClick={onClick}>
      {asset ? (
        <>
          {/* Lettering disegnato a mano come immagine */}
          <img
            src={asset}
            alt={label}
            className={styles.assetImg}
            draggable={false}
          />
          {/* Testo nascosto visually per screen reader */}
          <span className={styles.srOnly}>{label}</span>
        </>
      ) : (
        label
      )}
    </a>
  )
}
