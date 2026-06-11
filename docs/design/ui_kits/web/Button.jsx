/* Button.jsx — primary / secondary / ghost / danger variants */

const knikBtnBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  borderRadius: "var(--radius-md)",
  fontFamily: "var(--font-sans)",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  border: "1px solid transparent",
  transition: "all 200ms var(--ease-out)",
  cursor: "pointer",
};

const knikBtnSizes = {
  xs: { fontSize: 12, padding: "5px 9px" },
  sm: { fontSize: 13, padding: "6px 11px" },
  md: { fontSize: 14, padding: "8px 14px" },
  lg: { fontSize: 15, padding: "10px 18px" },
};

const knikBtnVariants = {
  primary: {
    background: "var(--aurora-400)",
    color: "var(--on-primary)",
    boxShadow:
      "0 4px 14px -4px rgba(0,217,244,0.55), 0 1px 0 rgba(255,255,255,0.20) inset",
  },
  secondary: {
    background: "var(--bg-surface-2)",
    color: "var(--fg-2)",
    borderColor: "var(--border-2)",
  },
  ghost: {
    background: "transparent",
    color: "var(--fg-3)",
  },
  danger: {
    background: "rgba(239,68,68,0.16)",
    color: "#ef4444",
    borderColor: "rgba(239,68,68,0.30)",
  },
};

function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  children,
  onClick,
  disabled,
  type = "button",
  title,
  style,
}) {
  const [hover, setHover] = React.useState(false);
  const v = knikBtnVariants[variant] || knikBtnVariants.primary;
  const s = knikBtnSizes[size] || knikBtnSizes.md;
  const hoverStyle =
    hover && !disabled
      ? variant === "primary"
        ? { background: "var(--aurora-300)", transform: "translateY(-1px)" }
        : variant === "secondary"
          ? {
              background: "var(--bg-surface-3)",
              borderColor: "var(--border-3)",
            }
          : variant === "ghost"
            ? { background: "var(--bg-surface-3)", color: "var(--fg-1)" }
            : variant === "danger"
              ? { background: "rgba(239,68,68,0.24)" }
              : {}
      : {};
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        ...knikBtnBase,
        ...v,
        ...s,
        ...hoverStyle,
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
  variant = "ghost",
  size = 32,
  active = false,
}) {
  const [hover, setHover] = React.useState(false);
  const bg = active
    ? "var(--primary-soft)"
    : hover
      ? "var(--bg-surface-3)"
      : "transparent";
  const color = active ? "var(--aurora-200)" : "var(--fg-3)";
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        border: "none",
        background: bg,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 180ms var(--ease-out)",
      }}
    >
      {icon}
    </button>
  );
}

Object.assign(window, { Button, IconButton });
