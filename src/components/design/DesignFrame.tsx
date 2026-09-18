'use client'

import React from 'react'

interface DesignFrameProps {
  children: React.ReactNode
  title: string
}

export function DesignFrame({ children, title }: DesignFrameProps) {
  return (
    <div className="design-frame-wrapper">
      <div className="design-frame-label">
        <span className="star-4" /> {title.toUpperCase()}
      </div>
      <div className="design-frame-browser">
        {/* Browser Top Bar */}
        <div className="browser-header">
          <div className="browser-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <div className="browser-url">artismi.it/{title.toLowerCase().replace(/\s+/g, '-')}</div>
        </div>
        
        {/* The Actual Content Screen */}
        <div className="browser-content">
          {children}
        </div>
      </div>

      <style jsx>{`
        .design-frame-wrapper {
          padding: 80px 40px;
          background: #0f0716;
          border-bottom: 2px solid rgba(242, 237, 228, 0.1);
          page-break-after: always;
        }
        .design-frame-label {
          font-family: var(--font-display-var);
          font-size: 1.2rem;
          margin-bottom: 24px;
          color: #E8A8BF;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .design-frame-browser {
          width: 1440px;
          min-height: 900px;
          height: auto;
          background: #12081C;
          border: 1px solid rgba(242, 237, 228, 0.2);
          border-radius: 8px;
          overflow: visible;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6);
          display: flex;
          flex-direction: column;
          margin: 0 auto;
          /* Scale 1.0 for 1:1 design-to-code fidelity */
          transform: scale(1.0);
          transform-origin: top center;
        }
        @media print {
          .design-frame-browser {
             transform: none; /* Full size in PDF */
             border: none;
             box-shadow: none;
          }
          .design-frame-wrapper {
             padding: 0;
          }
        }
        .browser-header {
          height: 40px;
          background: #1A1A2E;
          border-bottom: 1px solid rgba(242, 237, 228, 0.1);
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 20px;
          flex-shrink: 0;
        }
        .browser-dots {
          display: flex;
          gap: 6px;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .dot-red { background: #FF5F57; }
        .dot-yellow { background: #FFBD2E; }
        .dot-green { background: #28C840; }
        .browser-url {
          flex: 1;
          background: #12081C;
          border-radius: 4px;
          height: 24px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          font-family: var(--font-mono-var);
          font-size: 0.75rem;
          color: rgba(242, 237, 228, 0.4);
        }
        .browser-content {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
