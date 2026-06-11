/* StatusBadge.jsx */

const knikStatusMap = {
  pending: { label: "Pending", bg: "rgba(245,158,11,0.16)", color: "#f59e0b" },
  running: { label: "Running", bg: "rgba(59,130,246,0.16)", color: "#3b82f6" },
  success: { label: "Success", bg: "rgba(16,185,129,0.16)", color: "#10b981" },
  failed: { label: "Failed", bg: "rgba(239,68,68,0.16)", color: "#ef4444" },
};

function StatusBadge({ status = "success", size = "md" }) {
  const cfg = knikStatusMap[status] || knikStatusMap.success;
  const sz =
    size === "sm"
      ? { fontSize: 11, padding: "3px 8px" }
      : size === "lg"
        ? { fontSize: 13, padding: "5px 12px" }
        : { fontSize: 12, padding: "4px 10px" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: cfg.bg,
        color: cfg.color,
        borderRadius: 999,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        fontFamily: "var(--font-sans)",
        ...sz,
      }}
    >
      {status === "running" ? (
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
      {cfg.label}
    </span>
  );
}

// inject keyframes once
if (
  typeof document !== "undefined" &&
  !document.getElementById("knik-anim-keyframes")
) {
  const s = document.createElement("style");
  s.id = "knik-anim-keyframes";
  s.textContent = `
    @keyframes knik-spin { to { transform: rotate(360deg); } }
    @keyframes knik-dash { to { stroke-dashoffset: -40; } }
    @keyframes knik-blob {
      0%, 100% { transform: translate(0,0) scale(1); opacity: 0.4; }
      33% { transform: translate(40px, -50px) scale(1.15); opacity: 0.55; }
      66% { transform: translate(-30px, 40px) scale(0.85); opacity: 0.35; }
    }
    @keyframes knik-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @keyframes knik-fade-up {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes knik-slide-l {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes knik-slide-r {
      from { opacity: 0; transform: translateX(12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(s);
}

Object.assign(window, { StatusBadge, knikStatusMap });
