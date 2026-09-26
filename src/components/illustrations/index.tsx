/*
 * Hand-drawn editorial illustrations: ink line art, white paper, lime accents.
 * No stock photography, no glossy 3D — every shape is a stroked path with round
 * joins and a subtle turbulence displacement so the lines read as drawn rather
 * than vector-perfect.
 *
 * Filter ids are namespaced per component: two of these on one page must not
 * share a filter id or the second silently inherits the first's geometry.
 */

const Paper = ({ children }: { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 520 520"
    role="img"
    className="h-auto w-full overflow-visible"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

/** feTurbulence + displacement: the difference between "vector" and "drawn". */
const Wobble = ({ id, scale = 2.4 }: { id: string; scale?: number }) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence
      type="fractalNoise"
      baseFrequency="0.022"
      numOctaves={2}
      seed={7}
      result="noise"
    />
    <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} />
  </filter>
);

export const HeroIllustration = () => (
  <Paper>
    <defs>
      <Wobble id="hero-wobble" />
    </defs>

    <g
      filter="url(#hero-wobble)"
      stroke="currentColor"
      strokeWidth={3}
      className="text-ink"
    >
      {/* lime wash behind the whole scene */}
      <path
        d="M96 92c74-46 232-58 305 8 62 56 74 178 22 246-58 76-214 96-306 52C26 358 12 200 40 148c14-26 30-40 56-56Z"
        fill="var(--accent)"
        stroke="none"
        opacity={0.28}
      />

      {/* rising bars — the "growth" beat of the composition */}
      <g>
        <rect x="176" y="300" width="44" height="76" rx="8" fill="#fff" />
        <rect x="236" y="256" width="44" height="120" rx="8" fill="#fff" />
        <rect
          x="296"
          y="206"
          width="44"
          height="170"
          rx="8"
          fill="var(--accent)"
        />
      </g>

      {/* trend line breaking past the tallest bar */}
      <path d="M132 250l58-52 52 34 76-84" />
      <path d="M296 148h30v30" />
      <circle cx="132" cy="250" r="7" fill="var(--accent)" />

      {/* laptop */}
      <path d="M118 396h284l26 46H92l26-46Z" fill="#fff" />
      <path d="M118 396V170c0-9 7-16 16-16h220c9 0 16 7 16 16v226" fill="#fff" />
      <path d="M166 196h132" opacity={0.45} />
      <path d="M166 226h96" opacity={0.45} />
      <path d="M166 256h112" opacity={0.45} />

      {/* code bracket, sat where a trackpad would be */}
      <path d="M228 322l-20 22 20 22M292 322l20 22-20 22M268 316l-16 56" />

      {/* stacked books, left */}
      <g>
        <rect
          x="34"
          y="330"
          width="92"
          height="24"
          rx="6"
          fill="#fff"
          transform="rotate(-6 80 342)"
        />
        <rect
          x="28"
          y="358"
          width="104"
          height="24"
          rx="6"
          fill="var(--accent)"
          transform="rotate(3 80 370)"
        />
      </g>

      {/* graduation cap, floating right */}
      <g transform="rotate(9 420 132)">
        <path d="M370 132l50-24 50 24-50 24-50-24Z" fill="var(--accent)" />
        <path d="M400 146v26c0 8 40 8 40 0v-26" fill="#fff" />
        <path d="M470 132v40" />
        <circle cx="470" cy="180" r="7" fill="var(--accent)" />
      </g>

      {/* lightbulb — the "insight" motif, top left */}
      <g transform="rotate(-8 96 130)">
        <path d="M72 122a26 26 0 1 1 40 22c-5 4-6 8-6 13H82c0-5-1-9-6-13a26 26 0 0 1-4-22Z" fill="#fff" />
        <path d="M84 168h16" />
        <path d="M87 180h10" />
      </g>

      {/* floating graphic elements */}
      <path d="M452 300v34M435 317h34" />
      <path d="M64 252v24M52 264h24" />
      <circle cx="486" cy="392" r="6" fill="var(--accent)" />
      <circle cx="58" cy="446" r="5" />
      <path d="M420 452c14-10 30-10 44 0" />

      {/* ground line, deliberately not straight */}
      <path d="M62 466c92-14 288-16 400 2" strokeWidth={4} />
    </g>
  </Paper>
);

export const CtaIllustration = () => (
  <Paper>
    <defs>
      <Wobble id="cta-wobble" scale={2.2} />
    </defs>

    <g
      filter="url(#cta-wobble)"
      stroke="currentColor"
      strokeWidth={3}
      className="text-ink"
    >
      <path
        d="M110 96c78-52 226-62 300 4 66 60 76 186 20 254-60 74-216 92-310 46C24 356 12 194 46 146c16-22 40-36 64-50Z"
        fill="var(--accent)"
        stroke="none"
        opacity={0.3}
      />

      {/* open book */}
      <path
        d="M96 328c56-30 114-30 164 0 50-30 108-30 164 0v-108c-56-30-114-30-164 0-50-30-108-30-164 0v108Z"
        fill="#fff"
      />
      <path d="M260 220v108" />
      <path d="M136 254c30-14 60-16 88-6M136 288c30-14 60-16 88-6" opacity={0.4} />
      <path d="M296 248c28-10 58-8 88 6M296 282c28-10 58-8 88 6" opacity={0.4} />

      {/* growth arrow lifting off the book */}
      <path d="M170 196c46-62 126-92 196-70" />
      <path d="M336 108l34 18-16 34" />

      {/* certificate seal */}
      <g transform="rotate(-10 400 340)">
        <circle cx="400" cy="340" r="44" fill="var(--accent)" />
        <path d="M380 340l14 14 26-28" strokeWidth={4} />
        <path d="M382 380l-10 46 24-14 24 14-10-46" fill="#fff" />
      </g>

      {/* sparkles */}
      <path d="M118 168v28M104 182h28" />
      <path d="M448 224v22M437 235h22" />
      <circle cx="74" cy="392" r="5" fill="var(--accent)" />
      <circle cx="452" cy="452" r="6" />

      <path d="M60 462c96-14 292-16 402 2" strokeWidth={4} />
    </g>
  </Paper>
);
