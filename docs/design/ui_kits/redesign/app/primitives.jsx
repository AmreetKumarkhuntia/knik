/* primitives.jsx — evolved KNIK UI atoms, grounded in colors_and_type.css tokens.
   Accent + radius + density are driven by CSS vars set on the shell root by App:
   --acc (strong accent), --acc-soft (faint fill), --acc-text (light accent text),
   --r-btn / --r-card (radii), --pad-card / --gap-card / --row-py (density).        */

/* ---------- Button ---------- */
const btnBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontFamily: "var(--font-sans)",
  fontWeight: 550,
  letterSpacing: "-0.01em",
  border: "1px solid transparent",
  whiteSpace: "nowrap",
  borderRadius: "var(--r-btn, 8px)",
  transition: "all 180ms var(--ease-out)",
  cursor: "pointer",
};
const btnSizes = {
  xs: { fontSize: 12, padding: "5px 9px" },
  sm: { fontSize: 13, padding: "7px 12px" },
  md: { fontSize: 14, padding: "9px 15px" },
  lg: { fontSize: 15, padding: "11px 19px" },
};
function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  children,
  onClick,
  disabled,
  title,
  style,
}) {
  const [h, setH] = React.useState(false);
  const v =
    {
      primary: {
        background: "var(--acc, var(--aurora-400))",
        color: "var(--on-primary)",
        boxShadow:
          "0 4px 16px -5px var(--acc-glow, rgba(0,217,244,0.6)), 0 1px 0 rgba(255,255,255,0.22) inset",
      },
      secondary: {
        background: "var(--bg-surface-2)",
        color: "var(--fg-1)",
        borderColor: "var(--border-2)",
      },
      ghost: { background: "transparent", color: "var(--fg-3)" },
      danger: {
        background: "var(--danger-bg)",
        color: "var(--danger)",
        borderColor: "rgba(239,68,68,0.3)",
      },
    }[variant] || {};
  const hov =
    h && !disabled
      ? variant === "primary"
        ? { filter: "brightness(1.06)", transform: "translateY(-1px)" }
        : variant === "secondary"
          ? {
              background: "var(--bg-surface-3)",
              borderColor: "var(--border-3)",
            }
          : variant === "ghost"
            ? { background: "var(--bg-surface-3)", color: "var(--fg-1)" }
            : variant === "danger"
              ? { background: "rgba(239,68,68,0.26)" }
              : {}
      : {};
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        ...btnBase,
        ...v,
        ...btnSizes[size],
        ...hov,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

function IconButton({
  icon,
  onClick,
  title,
  size = 34,
  active = false,
  danger = false,
  style,
}) {
  const [h, setH] = React.useState(false);
  const bg = active
    ? "var(--acc-soft)"
    : h
      ? "var(--bg-surface-3)"
      : "transparent";
  const color = danger
    ? "var(--danger)"
    : active
      ? "var(--acc-text, var(--aurora-200))"
      : h
        ? "var(--fg-1)"
        : "var(--fg-3)";
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: size,
        height: size,
        borderRadius: "var(--r-btn, 8px)",
        border: "none",
        background: bg,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 160ms var(--ease-out)",
        flexShrink: 0,
        ...style,
      }}
    >
      {icon}
    </button>
  );
}

/* ---------- Card ---------- */
function Card({
  hoverable = false,
  glass = false,
  pad = "var(--pad-card, 18px)",
  children,
  style,
  onClick,
}) {
  const [h, setH] = React.useState(false);
  const base = {
    background: glass ? "var(--bg-glass)" : "var(--bg-surface-2)",
    backdropFilter: glass ? "blur(20px) saturate(140%)" : undefined,
    WebkitBackdropFilter: glass ? "blur(20px) saturate(140%)" : undefined,
    border: "1px solid var(--border-2)",
    borderRadius: "var(--r-card, 12px)",
    padding: pad,
    transition: "all 220ms var(--ease-out)",
  };
  const hov =
    hoverable && h
      ? {
          borderColor: "var(--acc-border, rgba(0,217,244,0.5))",
          transform: "translateY(-2px)",
          boxShadow: "0 14px 32px -16px var(--acc-glow, rgba(0,217,244,0.5))",
        }
      : {};
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setH(true)}
      onMouseLeave={() => hoverable && setH(false)}
      style={{ ...base, ...hov, ...style }}
    >
      {children}
    </div>
  );
}

/* ---------- Chip / Pill ---------- */
function Chip({
  children,
  icon,
  active = false,
  onClick,
  color,
  size = "md",
  style,
}) {
  const [h, setH] = React.useState(false);
  const interactive = !!onClick;
  const s =
    size === "sm"
      ? { fontSize: 11.5, padding: "3px 9px", gap: 5 }
      : { fontSize: 12.5, padding: "5px 11px", gap: 6 };
  return (
    <span
      onClick={onClick}
      onMouseEnter={() => interactive && setH(true)}
      onMouseLeave={() => interactive && setH(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        fontSize: s.fontSize,
        padding: s.padding,
        borderRadius: "var(--radius-pill)",
        fontWeight: 550,
        letterSpacing: "-0.005em",
        whiteSpace: "nowrap",
        cursor: interactive ? "pointer" : "default",
        background: active
          ? "var(--acc-soft)"
          : h
            ? "var(--bg-surface-3)"
            : "var(--bg-surface-2)",
        color: active
          ? "var(--acc-text, var(--aurora-200))"
          : color || "var(--fg-3)",
        border: `1px solid ${active ? "var(--acc-border, rgba(0,217,244,0.4))" : "var(--border-2)"}`,
        transition: "all 160ms var(--ease-out)",
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  );
}

/* ---------- StatusBadge ---------- */
const STATUS = {
  pending: {
    label: "Pending",
    bg: "var(--warning-bg)",
    color: "var(--warning)",
  },
  running: { label: "Running", bg: "var(--info-bg)", color: "var(--info)" },
  success: {
    label: "Success",
    bg: "var(--success-bg)",
    color: "var(--success)",
  },
  active: { label: "Active", bg: "var(--success-bg)", color: "var(--success)" },
  failed: { label: "Failed", bg: "var(--danger-bg)", color: "var(--danger)" },
  paused: {
    label: "Paused",
    bg: "rgba(154,166,182,0.16)",
    color: "var(--fg-3)",
  },
  offline: {
    label: "Offline",
    bg: "rgba(154,166,182,0.16)",
    color: "var(--fg-3)",
  },
  connected: {
    label: "Connected",
    bg: "var(--success-bg)",
    color: "var(--success)",
  },
};
function StatusBadge({ status = "success", size = "md", label }) {
  const c = STATUS[status] || STATUS.success;
  const s =
    size === "sm"
      ? { fontSize: 11, padding: "3px 8px" }
      : { fontSize: 12, padding: "4px 10px" };
  const spinning = status === "running";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: c.bg,
        color: c.color,
        borderRadius: "var(--radius-pill)",
        fontWeight: 550,
        letterSpacing: "-0.005em",
        ...s,
      }}
    >
      {spinning ? (
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            border: "1.5px solid currentColor",
            borderTopColor: "transparent",
            animation: "knik-spin 0.9s linear infinite",
          }}
        />
      ) : (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "currentColor",
          }}
        />
      )}
      {label || c.label}
    </span>
  );
}

/* ---------- MetricCard ---------- */
function MetricCard({
  icon,
  label,
  value,
  sub,
  trend,
  color = "primary",
  animDelay = 0,
}) {
  const cmap = {
    primary: {
      bg: "var(--acc-soft)",
      color: "var(--acc-text, var(--aurora-300))",
    },
    teal: { bg: "rgba(20,184,166,0.14)", color: "var(--teal-400)" },
    success: { bg: "var(--success-bg)", color: "var(--success)" },
    violet: { bg: "rgba(139,92,246,0.14)", color: "var(--violet-400)" },
  };
  const cfg = cmap[color] || cmap.primary;
  const tc =
    trend?.dir === "up"
      ? "var(--success)"
      : trend?.dir === "down"
        ? "var(--danger)"
        : "var(--fg-4)";
  return (
    <Card
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        animation: `knik-fade-up 380ms var(--ease-out) ${animDelay}ms both`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "var(--r-btn,8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: cfg.bg,
            color: cfg.color,
          }}
        >
          <MS name={icon} size={21} />
        </div>
        {trend && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: tc,
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <MS
              name={
                trend.dir === "up"
                  ? "trending_up"
                  : trend.dir === "down"
                    ? "trending_down"
                    : "trending_flat"
              }
              size={14}
            />
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 12.5, color: "var(--fg-3)", fontWeight: 550 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: "var(--fg-1)",
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
            marginTop: 3,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11.5, color: "var(--fg-4)", marginTop: 6 }}>
            {sub}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------- Segmented control ---------- */
function Segmented({ options, value, onChange, size = "md" }) {
  const s =
    size === "sm"
      ? { fontSize: 12, padding: "5px 10px" }
      : { fontSize: 13, padding: "6px 13px" };
  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-2)",
        borderRadius: "var(--r-btn,8px)",
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const lbl = typeof o === "string" ? o : o.label;
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={{
              ...s,
              border: "none",
              cursor: "pointer",
              borderRadius: "calc(var(--r-btn,8px) - 2px)",
              fontWeight: 550,
              letterSpacing: "-0.01em",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: active ? "var(--bg-surface-3)" : "transparent",
              color: active ? "var(--fg-1)" : "var(--fg-4)",
              boxShadow: active
                ? "0 1px 0 rgba(255,255,255,0.05) inset, 0 1px 3px rgba(0,0,0,0.3)"
                : "none",
              transition: "all 150ms var(--ease-out)",
            }}
          >
            {typeof o === "object" && o.icon ? (
              <MS name={o.icon} size={16} />
            ) : null}
            {lbl}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Toggle ---------- */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 23,
        borderRadius: 999,
        border: "1px solid var(--border-2)",
        position: "relative",
        background: checked
          ? "var(--acc, var(--aurora-400))"
          : "var(--bg-surface-3)",
        cursor: "pointer",
        transition: "all 200ms var(--ease-out)",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 19 : 2,
          width: 17,
          height: 17,
          borderRadius: "50%",
          background: checked ? "var(--on-primary)" : "var(--fg-2)",
          transition: "left 200ms var(--ease-out)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
        }}
      />
    </button>
  );
}

/* ---------- Avatar ---------- */
function Avatar({ initials, size = 30, color = "surface" }) {
  const bg =
    color === "accent"
      ? "linear-gradient(135deg, var(--acc-soft), rgba(20,184,166,0.22))"
      : "var(--bg-surface-3)";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        flexShrink: 0,
        background: bg,
        border:
          color === "accent"
            ? "1px solid var(--acc-border, rgba(0,217,244,0.4))"
            : "1px solid var(--border-2)",
        color: "var(--fg-1)",
        fontFamily: "var(--font-mono)",
        fontSize: size * 0.36,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        letterSpacing: "-0.02em",
      }}
    >
      {initials}
    </div>
  );
}

/* ---------- Kbd ---------- */
function Kbd({ children }) {
  return (
    <span
      style={{
        background: "var(--bg-surface-3)",
        border: "1px solid var(--border-2)",
        borderRadius: 4,
        padding: "1px 5px",
        color: "var(--fg-3)",
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        lineHeight: 1.6,
      }}
    >
      {children}
    </span>
  );
}

/* ---------- Sparkline ---------- */
function Sparkline({
  data,
  w = 80,
  h = 26,
  color = "var(--acc, var(--aurora-400))",
}) {
  const max = Math.max(...data),
    min = Math.min(...data);
  const span = max - min || 1;
  const id = React.useMemo(
    () => "sp-" + Math.random().toString(36).slice(2, 7),
    [],
  );
  const pts = data.map((d, i) => [
    (i / (data.length - 1)) * w,
    h - 3 - ((d - min) / span) * (h - 6),
  ]);
  const line = pts
    .map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1))
    .join(" ");
  const area = line + ` L${w} ${h} L0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- Section header ---------- */
function SectionHeader({ title, sub, action, onAction, right }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 14,
        gap: 16,
      }}
    >
      <div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.015em",
            color: "var(--fg-1)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {sub && (
          <div style={{ fontSize: 12.5, color: "var(--fg-4)", marginTop: 3 }}>
            {sub}
          </div>
        )}
      </div>
      {right
        ? right
        : action && (
            <button
              type="button"
              onClick={onAction}
              style={{
                fontSize: 13,
                fontWeight: 550,
                color: "var(--acc-text, var(--aurora-300))",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {action}
              <MS name="arrow_forward" size={15} />
            </button>
          )}
    </div>
  );
}

Object.assign(window, {
  Button,
  IconButton,
  Card,
  Chip,
  StatusBadge,
  STATUS,
  MetricCard,
  Segmented,
  Toggle,
  Avatar,
  Kbd,
  Sparkline,
  SectionHeader,
});
