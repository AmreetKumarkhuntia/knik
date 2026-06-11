/* Sidebar.jsx — collapsible glass nav */

const sidebarRecents = [
  {
    id: "c1",
    title: "Refactor Python pipeline",
    preview: "Replace inner loop with generator…",
    at: "Today",
  },
  {
    id: "c2",
    title: "API docs for /v1/synth",
    preview: "Endpoint accepts voice + text…",
    at: "Today",
  },
  {
    id: "c3",
    title: "Debug React state",
    preview: "useEffect dependency missing…",
    at: "Yesterday",
  },
  {
    id: "c4",
    title: "Daily digest workflow",
    preview: "Trigger at 09:00 UTC, summarise…",
    at: "Mar 18",
  },
  {
    id: "c5",
    title: "MCP shell tool wrapper",
    preview: "Wrap tar+ssh into a single call…",
    at: "Mar 12",
  },
];

function Sidebar({ view, onNavigate, onNewChat }) {
  const [hover, setHover] = React.useState(false);
  const expanded = hover;
  const widthPx = expanded ? 320 : 80;

  const item = (key, label, icon, onClick) => {
    const active = view === key;
    return (
      <button
        key={key}
        onClick={onClick}
        title={!expanded ? label : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: expanded ? "10px 12px" : 0,
          width: expanded ? "100%" : 48,
          height: expanded ? "auto" : 48,
          justifyContent: expanded ? "flex-start" : "center",
          borderRadius: 8,
          border: "none",
          background: active ? "var(--primary-soft)" : "transparent",
          color: active ? "var(--aurora-200)" : "var(--fg-3)",
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          cursor: "pointer",
          transition: "all 180ms var(--ease-out)",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = "var(--bg-surface-3)";
            e.currentTarget.style.color = "var(--fg-1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--fg-3)";
          }
        }}
      >
        <MS name={icon} size={20} />
        {expanded && <span>{label}</span>}
      </button>
    );
  };

  return (
    <aside
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: widthPx,
        flexShrink: 0,
        height: "100%",
        background: "var(--bg-glass)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        borderRight: "1px solid var(--border-2)",
        display: "flex",
        flexDirection: "column",
        padding: "18px 14px",
        transition: "width 280ms var(--ease-out)",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: expanded ? "4px 8px 14px" : "4px 0 14px",
          justifyContent: expanded ? "flex-start" : "center",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "rgba(11,18,26,0.7)",
            border: "1px solid rgba(0,217,244,0.40)",
            boxShadow: "0 0 24px -6px rgba(0,217,244,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <KnikGlyph size={22} />
        </div>
        {expanded && (
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 18,
              letterSpacing: "-0.025em",
              color: "var(--fg-1)",
              whiteSpace: "nowrap",
            }}
          >
            Knik AI
          </div>
        )}
      </div>

      {/* New chat */}
      <button
        onClick={onNewChat}
        title={!expanded ? "New chat" : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: expanded ? "10px 12px" : 0,
          width: expanded ? "100%" : 48,
          height: expanded ? "auto" : 48,
          justifyContent: expanded ? "flex-start" : "center",
          marginBottom: 6,
          borderRadius: 8,
          border: "1px solid var(--border-2)",
          background: "var(--bg-surface-2)",
          color: "var(--fg-1)",
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          cursor: "pointer",
          transition: "all 180ms var(--ease-out)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(0,217,244,0.40)";
          e.currentTarget.style.background = "var(--bg-surface-3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-2)";
          e.currentTarget.style.background = "var(--bg-surface-2)";
        }}
      >
        <MS name="add" size={20} />
        {expanded && <span>New chat</span>}
      </button>

      {/* Nav section */}
      {expanded && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--fg-4)",
            padding: "12px 12px 6px",
          }}
        >
          Navigation
        </div>
      )}
      {!expanded && <div style={{ height: 12 }} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {item("chat", "Chat", "chat", () => onNavigate("chat"))}
        {item("workflows", "Workflows", "account_tree", () =>
          onNavigate("workflows"),
        )}
        {item("builder", "Workflow builder", "polyline", () =>
          onNavigate("builder"),
        )}
      </div>

      {/* Recent conversations */}
      {expanded && (
        <div
          style={{
            marginTop: 18,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              padding: "8px 12px 8px",
            }}
          >
            Recent conversations
          </div>
          <div
            className="hide-scrollbar"
            style={{
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {sidebarRecents.map((c) => (
              <button
                key={c.id}
                style={{
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  padding: "8px 12px",
                  borderRadius: 7,
                  cursor: "pointer",
                  color: "var(--fg-3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-surface-3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 500,
                      color: "var(--fg-2)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.title}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--fg-5)",
                      flexShrink: 0,
                    }}
                  >
                    {c.at}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--fg-4)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginTop: 2,
                  }}
                >
                  {c.preview}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {!expanded && <div style={{ flex: 1 }} />}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: expanded ? "column" : "column",
          gap: 4,
          marginTop: 10,
          paddingTop: 12,
          borderTop: "1px solid var(--border-1)",
        }}
      >
        {item("__theme", "Theme", "palette", () => {})}
        {item("__settings", "Settings", "settings", () => {})}
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar });
