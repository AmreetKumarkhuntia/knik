/* TopBar.jsx — sticky breadcrumb header */

function TopBar({ breadcrumbs = [], right }) {
  return (
    <header
      style={{
        height: 64,
        paddingInline: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg-glass)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        borderBottom: "1px solid var(--border-2)",
        flexShrink: 0,
        position: "relative",
        zIndex: 5,
      }}
    >
      <nav
        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}
      >
        {breadcrumbs.map((b, i) => (
          <React.Fragment key={i}>
            <span
              style={{
                color:
                  i === breadcrumbs.length - 1 ? "var(--fg-1)" : "var(--fg-4)",
                fontWeight: i === breadcrumbs.length - 1 ? 600 : 500,
                letterSpacing: "-0.012em",
              }}
            >
              {b}
            </span>
            {i < breadcrumbs.length - 1 && (
              <span style={{ color: "var(--fg-5)", fontSize: 13 }}>/</span>
            )}
          </React.Fragment>
        ))}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {right}
      </div>
    </header>
  );
}

Object.assign(window, { TopBar });
