/* icons.jsx — Material Symbols helper + a few inline strokes
   ---------------------------------------------------------- */

function MS({
  name,
  size = 20,
  fill = 0,
  weight = 400,
  style,
  className = "",
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
        lineHeight: 1,
        ...style,
      }}
    >
      {name}
    </span>
  );
}

function KnikGlyph({ size = 22, glow = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="kg-grad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#79E6F9" />
          <stop offset="55%" stopColor="#00D9F4" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      <g
        stroke="url(#kg-grad)"
        strokeWidth="2.4"
        strokeLinecap="round"
        style={
          glow
            ? { filter: "drop-shadow(0 0 6px rgba(0,217,244,0.55))" }
            : undefined
        }
      >
        <line x1="5" y1="12" x2="5" y2="12" />
        <line x1="8.5" y1="9" x2="8.5" y2="15" />
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="15.5" y1="8" x2="15.5" y2="16" />
        <line x1="19" y1="10" x2="19" y2="14" />
      </g>
    </svg>
  );
}

Object.assign(window, { MS, KnikGlyph });
