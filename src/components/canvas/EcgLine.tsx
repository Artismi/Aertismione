import { Html } from '@react-three/drei'
import { useRef } from 'react'

/**
 * EcgLine — SVG ECG embedded in the 3D scene at logo position.
 *
 * The SVG is rendered via drei's <Html> at 3D coordinate [0,0,0],
 * so it moves in perfect sync with the logo (which sits at the same origin).
 *
 * Visual concept:
 * - A horizontal line that reads like a medical ECG.
 * - A clean gap at the center leaves the logo to breathe.
 * - Subtle CSS glitch/tremor animation makes it feel like a live signal.
 */
export function EcgLine() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <Html
      center
      style={{
        /* The Html element itself is centered on [0,0,0] — the logo's origin */
        width: '100vw',
        height: '0px',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {/* Inject keyframe animations into the document head */}
      <style>{`
        @keyframes ecg-tremble {
          0%   { transform: translateY(0px) scaleY(1); }
          20%  { transform: translateY(-0.5px) scaleY(1.004); }
          40%  { transform: translateY(0.8px) scaleY(0.997); }
          55%  { transform: translateY(-0.3px) scaleY(1.002); }
          70%  { transform: translateY(0.6px) scaleY(0.999); }
          85%  { transform: translateY(-0.4px) scaleY(1.003); }
          100% { transform: translateY(0px) scaleY(1); }
        }

        @keyframes ecg-flicker {
          0%, 100% { opacity: 1; }
          92%       { opacity: 1; }
          93%       { opacity: 0.6; }
          94%       { opacity: 1; }
          96%       { opacity: 0.85; }
          97%       { opacity: 1; }
        }

        @keyframes ecg-drift {
          0%   { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -400; }
        }

        .ecg-line {
          animation:
            ecg-tremble 1.8s ease-in-out infinite,
            ecg-flicker 7s linear infinite;
          transform-origin: center center;
        }

        .ecg-glow-soft {
          animation:
            ecg-tremble 2.2s ease-in-out infinite reverse,
            ecg-flicker 11s linear infinite;
          transform-origin: center center;
        }

        .ecg-scan {
          animation: ecg-drift 18s linear infinite;
        }
      `}</style>

      <svg
        viewBox="0 0 1000 60"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          /* Vertically center on the logo's equator */
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100vw',
          height: 'clamp(48px, 6vh, 80px)',
          overflow: 'visible',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <defs>
          {/* === Primary neon glow filter === */}
          <filter id="ecg-glow-primary" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="2.8" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* === Diffuse ambient aura === */}
          <filter id="ecg-aura" x="-30%" y="-400%" width="160%" height="900%">
            <feGaussianBlur stdDeviation="10" result="bigBlur" />
            <feMerge>
              <feMergeNode in="bigBlur" />
            </feMerge>
          </filter>

          {/* === Clip: left half (0…440) === */}
          <clipPath id="ecg-clip-left">
            <rect x="0" y="-200" width="440" height="600" />
          </clipPath>

          {/* === Clip: right half (560…1000) === */}
          <clipPath id="ecg-clip-right">
            <rect x="560" y="-200" width="440" height="600" />
          </clipPath>

          {/* === Gradient for small secondary lines === */}
          <linearGradient id="ecg-fade-left" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E2FF00" stopOpacity="0" />
            <stop offset="60%" stopColor="#E2FF00" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#E2FF00" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ecg-fade-right" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E2FF00" stopOpacity="0" />
            <stop offset="40%" stopColor="#E2FF00" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#E2FF00" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ─────────────────────────── AURA (background glow, very soft) ─────────────────────────── */}

        {/* Left aura */}
        <path
          className="ecg-glow-soft"
          clipPath="url(#ecg-clip-left)"
          d={ECG_PATH_LEFT}
          fill="none"
          stroke="#A855F7"
          strokeWidth="12"
          opacity="0.06"
          filter="url(#ecg-aura)"
        />

        {/* Right aura */}
        <path
          className="ecg-glow-soft"
          clipPath="url(#ecg-clip-right)"
          d={ECG_PATH_RIGHT}
          fill="none"
          stroke="#A855F7"
          strokeWidth="12"
          opacity="0.06"
          filter="url(#ecg-aura)"
        />

        {/* ─────────────────────────── SOFT SHADOW LINE (under the main) ─────────────────────────── */}

        <path
          className="ecg-glow-soft"
          clipPath="url(#ecg-clip-left)"
          d={ECG_PATH_LEFT}
          fill="none"
          stroke="#E2FF00"
          strokeWidth="3"
          opacity="0.12"
          filter="url(#ecg-glow-primary)"
        />
        <path
          className="ecg-glow-soft"
          clipPath="url(#ecg-clip-right)"
          d={ECG_PATH_RIGHT}
          fill="none"
          stroke="#E2FF00"
          strokeWidth="3"
          opacity="0.12"
          filter="url(#ecg-glow-primary)"
        />

        {/* ─────────────────────────── MAIN ECG LINE ─────────────────────────── */}

        {/* Left side — from edge to logo gap */}
        <path
          className="ecg-line"
          clipPath="url(#ecg-clip-left)"
          d={ECG_PATH_LEFT}
          fill="none"
          stroke="#E2FF00"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.92"
          filter="url(#ecg-glow-primary)"
        />

        {/* Right side — from logo gap to edge */}
        <path
          className="ecg-line"
          clipPath="url(#ecg-clip-right)"
          d={ECG_PATH_RIGHT}
          fill="none"
          stroke="#E2FF00"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.92"
          filter="url(#ecg-glow-primary)"
        />

        {/* ─────────────────────────── SECONDARY TREMOR LINES (grid feel) ─────────────────────────── */}

        {/* Upper ghost line — left */}
        <path
          clipPath="url(#ecg-clip-left)"
          d={ECG_PATH_LEFT_OFFSET_UP}
          fill="none"
          stroke="url(#ecg-fade-left)"
          strokeWidth="0.7"
          opacity="0.35"
          className="ecg-glow-soft"
        />
        {/* Lower ghost line — left */}
        <path
          clipPath="url(#ecg-clip-left)"
          d={ECG_PATH_LEFT_OFFSET_DOWN}
          fill="none"
          stroke="url(#ecg-fade-left)"
          strokeWidth="0.7"
          opacity="0.28"
          className="ecg-line"
        />

        {/* Upper ghost line — right */}
        <path
          clipPath="url(#ecg-clip-right)"
          d={ECG_PATH_RIGHT_OFFSET_UP}
          fill="none"
          stroke="url(#ecg-fade-right)"
          strokeWidth="0.7"
          opacity="0.35"
          className="ecg-glow-soft"
        />
        {/* Lower ghost line — right */}
        <path
          clipPath="url(#ecg-clip-right)"
          d={ECG_PATH_RIGHT_OFFSET_DOWN}
          fill="none"
          stroke="url(#ecg-fade-right)"
          strokeWidth="0.7"
          opacity="0.28"
          className="ecg-line"
        />

        {/* ─────────────────────────── LOGO GAP TERMINATION DOTS ─────────────────────────── */}
        {/* Small glowing dots that mark where the line "cuts" */}
        <circle cx="440" cy="30" r="2.2" fill="#E2FF00" opacity="0.6" filter="url(#ecg-glow-primary)" />
        <circle cx="560" cy="30" r="2.2" fill="#E2FF00" opacity="0.6" filter="url(#ecg-glow-primary)" />

        {/* Inner fade dots — softer version */}
        <circle cx="440" cy="30" r="5" fill="#A855F7" opacity="0.12" filter="url(#ecg-aura)" />
        <circle cx="560" cy="30" r="5" fill="#A855F7" opacity="0.12" filter="url(#ecg-aura)" />
      </svg>
    </Html>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   ECG Path Definitions
   ─────────────────────────────────────────────────────────────────────────────
   ViewBox: 1000 × 60, center-Y = 30.

   LEFT SIDE (x: 0 → 440)
   Reads left to right:
     1. Flat trembling base (Po River) [0…80]
     2. Soft hill undulation (Collina Torinese) [80…200]
     3. Sharp Mole Antonelliana spike [200…280]
     4. Post-Mole relaxation + another soft hill [280…440]

   The gap [440…560] is the logo area.

   RIGHT SIDE (x: 560 → 1000)
   Mirror / continuation — more hills, then flatter Po.
──────────────────────────────────────────────────────────────────────────────*/

/**
 * Left ECG — Po tremolo → Collina → Mole → settles before gap
 */
const ECG_PATH_LEFT = `
  M 0,30
  C 5,30 8,31.5 12,29.5  C 16,28 18,32 22,30
  C 25,28.5 27,31.5 32,30  C 36,28.8 38,31.2 42,30
  C 45,29 47,31 51,30  C 53,29.2 55,31 59,30
  C 61,29.5 63,30.5 67,30  C 69,29.5 71,30.5 74,30
  L 78,30
  C 82,28 86,24 93,20  C 100,16 106,25 112,28
  C 118,31 122,26 128,24  C 134,22 138,27 143,29
  C 148,31 151,25 157,22  C 163,19 167,27 172,30
  C 177,33 180,27 185,30
  L 192,30
  C 196,30 199,31 202,30
  L 207,30
  L 211,30
  L 213,22
  L 215,5
  L 217,30
  L 219,35
  L 221,30
  L 224,29.5
  C 228,29 231,30.5 235,30
  C 239,29.5 242,30.5 246,30
  C 250,29.5 254,30.5 258,30
  C 262,29 267,25 273,23  C 279,21 283,26 288,28.5
  C 293,31 296,25.5 302,24  C 308,22.5 312,28 317,30
  C 322,32 325,27 330,30
  C 335,33 338,28 343,30
  C 347,32 350,28.5 354,30
  C 358,31.5 361,29 365,30
  C 369,31 371,29.5 375,30
  L 382,30
  C 385,29.5 388,30.5 392,30
  C 396,29.5 398,30.5 402,30
  C 406,29.5 408,30.5 413,30
  C 417,29.5 419,30.5 423,30
  C 427,29.5 430,30.5 435,30
  L 440,30
`

/**
 * Right ECG — continues after the logo gap, hills then Po settling
 */
const ECG_PATH_RIGHT = `
  M 560,30
  L 566,30
  C 570,29.5 573,30.5 578,30
  C 582,29.5 585,30.5 590,30
  C 593,29 597,26 602,23.5  C 607,21 611,26.5 617,29
  C 623,31.5 626,25 631,22.5  C 636,20 640,27 645,30
  C 650,33 653,27.5 658,30
  L 663,30
  C 667,30 669,31 673,30
  L 677,30
  L 679,22
  L 681,4
  L 683,30
  L 685,36
  L 687,30
  L 689,29.5
  C 694,29 697,30.5 702,30
  C 706,29.5 710,30.5 715,30
  C 719,29 722,25.5 728,23  C 734,20.5 739,27 744,30
  C 749,33 752,26 757,30
  C 762,34 765,27.5 770,30
  L 778,30
  C 782,29.5 785,30.5 789,30
  C 793,29.5 796,30.5 801,30
  C 804,29.5 807,30.5 812,30
  C 815,29.6 818,30.4 823,30
  C 827,29.5 829,30.5 834,30
  C 838,29.5 840,30.5 845,30
  C 849,29.5 851,30.5 855,30
  C 859,29.5 862,30.5 866,30
  C 870,29.5 872,30.5 877,30
  C 881,29.5 884,30.5 889,30
  C 892,29.5 895,30.5 899,30
  C 902,29.5 905,30.5 910,30
  C 913,29.5 916,30.5 920,30
  C 924,29.5 926,30.5 930,30
  C 934,29.5 936,30.5 941,30
  C 944,29.5 947,30.5 951,30
  C 955,29.8 957,30.2 961,30
  C 964,29.5 967,30.5 971,30
  C 974,29.5 977,30.5 980,30
  C 984,29.8 986,30.2 990,30
  C 993,29.5 996,30.5 1000,30
`

// Ghost offset lines (+/-4 units on Y) for the grid tremor effect
const shiftY = (path: string, dy: number): string =>
  path.replace(/([CM])\s*([\d.]+),([\d.]+)/g,
    (_, cmd, x, y) => `${cmd} ${x},${(parseFloat(y) + dy).toFixed(2)}`)

const ECG_PATH_LEFT_OFFSET_UP = shiftY(ECG_PATH_LEFT, -4)
const ECG_PATH_LEFT_OFFSET_DOWN = shiftY(ECG_PATH_LEFT, 4)
const ECG_PATH_RIGHT_OFFSET_UP = shiftY(ECG_PATH_RIGHT, -4)
const ECG_PATH_RIGHT_OFFSET_DOWN = shiftY(ECG_PATH_RIGHT, 4)
