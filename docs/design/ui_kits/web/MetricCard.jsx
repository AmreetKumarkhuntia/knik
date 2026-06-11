/* MetricCard.jsx */

function MetricCard({
  icon,
  label,
  value,
  trend,
  color = "primary",
  animDelay = 0,
}) {
  const colorMap = {
    primary: { bg: "rgba(0,217,244,0.14)", color: "var(--aurora-300)" },
    teal: { bg: "rgba(20,184,166,0.14)", color: "var(--teal-400)" },
    success: { bg: "rgba(16,185,129,0.14)", color: "#10b981" },
    violet: { bg: "rgba(139,92,246,0.14)", color: "#a78bfa" },
  };
  const cfg = colorMap[color] || colorMap.primary;
  const trendColor =
    trend?.direction === "up"
      ? "var(--success)"
      : trend?.direction === "down"
        ? "var(--danger)"
        : "var(--fg-4)";

  return (
    <Card
      variant="default"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        animation: `knik-fade-up 360ms var(--ease-out) ${animDelay}ms both`,
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
            width: 36,
            height: 36,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: cfg.bg,
            color: cfg.color,
          }}
        >
          <MS name={icon} size={20} />
        </div>
        {trend && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: trendColor,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {trend.direction === "up" ? (
              <MS name="trending_up" size={14} />
            ) : trend.direction === "down" ? (
              <MS name="trending_down" size={14} />
            ) : (
              <MS name="trending_flat" size={14} />
            )}
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 13, color: "var(--fg-3)", fontWeight: 500 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "var(--fg-1)",
            letterSpacing: "-0.025em",
            fontVariantNumeric: "tabular-nums",
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </div>
    </Card>
  );
}

Object.assign(window, { MetricCard });
