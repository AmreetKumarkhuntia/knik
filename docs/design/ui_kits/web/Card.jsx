/* Card.jsx — default / bordered / glass / hover-glow */

function Card({
  variant = "default",
  padding = "md",
  hoverable = false,
  children,
  style,
  onClick,
}) {
  const [hover, setHover] = React.useState(false);
  const pad =
    padding === "none" ? 0 : padding === "sm" ? 12 : padding === "lg" ? 24 : 16;

  const base = {
    background: "var(--bg-surface-2)",
    border: "1px solid var(--border-2)",
    borderRadius: "var(--radius-lg)",
    padding: pad,
    transition: "all 220ms var(--ease-out)",
  };

  const variants = {
    default: {},
    bordered: { background: "transparent" },
    elevated: {
      boxShadow:
        "0 4px 14px -2px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset",
    },
    glass: {
      background: "var(--bg-glass)",
      backdropFilter: "blur(20px) saturate(140%)",
      WebkitBackdropFilter: "blur(20px) saturate(140%)",
    },
  };

  const hoverStyle =
    hoverable && hover
      ? {
          borderColor: "rgba(0,217,244,0.50)",
          transform: "translateY(-2px)",
          boxShadow: "0 14px 32px -14px rgba(0,217,244,0.50)",
        }
      : {};

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setHover(true)}
      onMouseLeave={() => hoverable && setHover(false)}
      style={{ ...base, ...variants[variant], ...hoverStyle, ...style }}
    >
      {children}
    </div>
  );
}

Object.assign(window, { Card });
