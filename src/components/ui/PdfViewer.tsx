'use client'

import styles from './PdfViewer.module.css'

interface PdfViewerProps {
  url: string
  label: string
}

export function PdfViewer({ url, label }: PdfViewerProps) {
  // We append '#toolbar=0&navpanes=0&scrollbar=0' to hide the ugly browser PDF UI 
  // and force it to look perfectly integrated as a seamless scrollable document.
  const viewerUrl = `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`

  return (
    <div className={styles.wrapper}>
      <h4 className={styles.viewerTitle}>{label}</h4>
      <div className={styles.scrollContainer}>
        <object
          data={viewerUrl}
          type="application/pdf"
          className={styles.documentObject}
          aria-label={label}
        >
          <div className={styles.error}>
            Il tuo browser non supporta la visualizzazione PDF integrata. 
            <a href={url} target="_blank" rel="noreferrer" style={{marginLeft: '8px', color: 'var(--accent)', textDecoration: 'underline'}}>
              Scarica il file
            </a>
          </div>
        </object>
      </div>
    </div>
  )
}
