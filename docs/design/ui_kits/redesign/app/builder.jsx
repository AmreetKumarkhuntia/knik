/* builder.jsx — DAG canvas + node palette + NEW node inspector + run bar / logs */

const NODES = [
  {
    id: "start",
    type: "Start",
    name: "Trigger",
    meta: "cron · 09:00",
    x: 60,
    y: 188,
    status: "success",
  },
  {
    id: "fetch",
    type: "Action",
    name: "Fetch sources",
    meta: "rss · github · gmail",
    x: 300,
    y: 80,
    status: "success",
  },
  {
    id: "tts",
    type: "TTS",
    name: "Synthesise",
    meta: "kokoro · af_heart",
    x: 300,
    y: 300,
    status: "success",
  },
  {
    id: "llm",
    type: "LLM",
    name: "Summarise",
    meta: "gemini-1.5-flash",
    x: 552,
    y: 188,
    status: "running",
  },
  {
    id: "branch",
    type: "Branch",
    name: "If urgent?",
    meta: "score > 0.8",
    x: 800,
    y: 188,
    status: "pending",
  },
  {
    id: "email",
    type: "End",
    name: "Email digest",
    meta: "→ team",
    x: 1044,
    y: 80,
    status: "pending",
  },
  {
    id: "slack",
    type: "End",
    name: "Ping Slack",
    meta: "#alerts",
    x: 1044,
    y: 300,
    status: "pending",
  },
];
const EDGES = [
  ["start", "fetch", "success"],
  ["start", "tts", "success"],
  ["fetch", "llm", "success"],
  ["tts", "llm", "success"],
  ["llm", "branch", "running"],
  ["branch", "email", "pending"],
  ["branch", "slack", "pending"],
];
const NODE_STYLE = {
  Start: {
    border: "rgba(20,184,166,0.5)",
    chip: "rgba(20,184,166,0.18)",
    fg: "var(--teal-300)",
    icon: "play_circle",
  },
  Action: {
    border: "var(--border-3)",
    chip: "var(--bg-surface-3)",
    fg: "var(--fg-3)",
    icon: "bolt",
  },
  TTS: {
    border: "rgba(139,92,246,0.42)",
    chip: "rgba(139,92,246,0.18)",
    fg: "var(--violet-400)",
    icon: "campaign",
  },
  LLM: {
    border: "var(--acc-border, rgba(0,217,244,0.55))",
    chip: "var(--acc-soft)",
    fg: "var(--acc-text, var(--aurora-300))",
    icon: "smart_toy",
  },
  Branch: {
    border: "rgba(245,158,11,0.45)",
    chip: "rgba(245,158,11,0.18)",
    fg: "var(--warning)",
    icon: "alt_route",
  },
  End: {
    border: "rgba(139,92,246,0.42)",
    chip: "rgba(139,92,246,0.18)",
    fg: "var(--violet-400)",
    icon: "outbound",
  },
};

function WorkflowBuilder() {
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
  const [sel, setSel] = React.useState("llm");
  const [showLogs, setShowLogs] = React.useState(false);
  const node = byId[sel];

  return (
    <div
      style={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}
    >
      {/* Canvas + overlays */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          background: "var(--bg-canvas)",
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <defs>
            {["success", "running", "pending"].map((s) => (
              <marker
                key={s}
                id={`arr-${s}`}
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path
                  d="M0,0 L10,5 L0,10 z"
                  fill={
                    s === "success"
                      ? "#10b981"
                      : s === "running"
                        ? "var(--acc, #00d9f4)"
                        : "#6a7585"
                  }
                />
              </marker>
            ))}
          </defs>
          {EDGES.map(([f, t, s], i) => {
            const a = byId[f],
              b = byId[t];
            const x1 = a.x + 188,
              y1 = a.y + 34,
              x2 = b.x,
              y2 = b.y + 34,
              cx = (x1 + x2) / 2;
            const stroke =
              s === "success"
                ? "#10b981"
                : s === "running"
                  ? "var(--acc, #00d9f4)"
                  : "#6a7585";
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`}
                fill="none"
                stroke={stroke}
                strokeWidth="2"
                strokeDasharray={
                  s === "running" ? "8 6" : s === "pending" ? "4 6" : undefined
                }
                style={
                  s === "running"
                    ? { animation: "knik-dash 1.2s linear infinite" }
                    : undefined
                }
                markerEnd={`url(#arr-${s})`}
                opacity={s === "pending" ? 0.5 : 1}
              />
            );
          })}
        </svg>

        {NODES.map((n) => (
          <BuilderNode
            key={n.id}
            node={n}
            selected={sel === n.id}
            onSelect={() => setSel(n.id)}
          />
        ))}

        {/* Palette (top-left) */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            width: 168,
            background: "var(--bg-glass)",
            backdropFilter: "blur(20px) saturate(140%)",
            WebkitBackdropFilter: "blur(20px) saturate(140%)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--r-card,12px)",
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--fg-4)",
              padding: "4px 8px",
            }}
          >
            Add node
          </div>
          {[
            ["LLM", "smart_toy"],
            ["Action", "bolt"],
            ["TTS", "campaign"],
            ["Branch", "alt_route"],
            ["Code", "code"],
            ["Merge", "merge"],
          ].map(([l, ic]) => (
            <div
              key={l}
              draggable
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "7px 8px",
                borderRadius: "var(--r-btn,8px)",
                color: "var(--fg-2)",
                fontSize: 13,
                cursor: "grab",
                transition: "background 140ms var(--ease-out)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-surface-3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <MS
                name={ic}
                size={16}
                style={{ color: "var(--acc-text, var(--aurora-300))" }}
              />
              {l}
            </div>
          ))}
        </div>

        {/* Top-right actions */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            display: "flex",
            gap: 8,
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            icon={<MS name="undo" size={16} />}
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<MS name="save" size={16} />}
          >
            Save
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<MS name="play_arrow" size={17} fill={1} />}
          >
            Run
          </Button>
        </div>

        {/* Zoom controls */}
        <div
          style={{
            position: "absolute",
            bottom: showLogs ? 168 : 76,
            right: 16,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            background: "var(--bg-glass)",
            backdropFilter: "blur(20px) saturate(140%)",
            WebkitBackdropFilter: "blur(20px) saturate(140%)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--r-btn,10px)",
            padding: 4,
            transition: "bottom 240ms var(--ease-out)",
          }}
        >
          <IconButton
            size={30}
            icon={<MS name="add" size={16} />}
            title="Zoom in"
          />
          <IconButton
            size={30}
            icon={<MS name="remove" size={16} />}
            title="Zoom out"
          />
          <IconButton
            size={30}
            icon={<MS name="fit_screen" size={16} />}
            title="Fit"
          />
        </div>

        {/* Run bar */}
        <RunBar
          showLogs={showLogs}
          onToggleLogs={() => setShowLogs((s) => !s)}
        />
      </div>

      {/* Inspector */}
      <NodeInspector node={node} />
    </div>
  );
}

function BuilderNode({ node, selected, onSelect }) {
  const cfg = NODE_STYLE[node.type] || {};
  const glow = selected
    ? "0 0 0 1px var(--acc, rgba(0,217,244,0.9)), 0 0 30px -6px var(--acc-glow, rgba(0,217,244,0.6))"
    : node.status === "running"
      ? "0 0 0 1px var(--acc-border, rgba(0,217,244,0.3)), 0 0 32px -8px var(--acc-glow, rgba(0,217,244,0.5))"
      : node.status === "success"
        ? "0 0 0 1px rgba(16,185,129,0.16)"
        : "var(--shadow-1)";
  return (
    <div
      onClick={onSelect}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: 188,
        cursor: "pointer",
        background: "rgba(11,16,24,0.94)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: `1px solid ${selected ? "var(--acc, rgba(0,217,244,0.9))" : cfg.border || "var(--border-2)"}`,
        borderRadius: "var(--r-card,11px)",
        padding: "11px 13px",
        boxShadow: glow,
        transition:
          "box-shadow 180ms var(--ease-out), border-color 180ms var(--ease-out)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: cfg.fg,
            background: cfg.chip,
            padding: "2px 7px",
            borderRadius: 5,
          }}
        >
          <MS name={cfg.icon} size={12} />
          {node.type}
        </span>
        <div style={{ flex: 1 }} />
        {node.status === "running" && (
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              border: "1.5px solid var(--acc-text, var(--aurora-300))",
              borderTopColor: "transparent",
              animation: "knik-spin 0.9s linear infinite",
            }}
          />
        )}
        {node.status === "success" && (
          <MS name="check" size={15} style={{ color: "var(--success)" }} />
        )}
      </div>
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          letterSpacing: "-0.012em",
          color: "var(--fg-1)",
        }}
      >
        {node.name}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--fg-4)",
          marginTop: 2,
        }}
      >
        {node.meta}
      </div>
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: -5,
          transform: "translateY(-50%)",
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: "var(--acc, var(--aurora-400))",
          border: "2px solid #0d111a",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: "50%",
          right: -5,
          transform: "translateY(-50%)",
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: "var(--acc, var(--aurora-400))",
          border: "2px solid #0d111a",
        }}
      />
    </div>
  );
}

function NodeInspector({ node }) {
  const cfg = NODE_STYLE[node.type] || {};
  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 550,
          color: "var(--fg-4)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
  const inp = {
    width: "100%",
    padding: "8px 11px",
    borderRadius: "var(--r-btn,8px)",
    border: "1px solid var(--border-2)",
    background: "var(--bg-surface)",
    color: "var(--fg-1)",
    fontFamily: "var(--font-sans)",
    fontSize: 13,
    outline: "none",
  };
  return (
    <aside
      style={{
        width: 296,
        flexShrink: 0,
        height: "100%",
        background: "var(--bg-surface)",
        borderLeft: "1px solid var(--border-2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid var(--border-1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginBottom: 3,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "var(--font-mono)",
              fontSize: 9.5,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: cfg.fg,
              background: cfg.chip,
              padding: "2px 7px",
              borderRadius: 5,
            }}
          >
            <MS name={cfg.icon} size={12} />
            {node.type}
          </span>
          <StatusBadge status={node.status} size="sm" />
        </div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--fg-1)",
            margin: "6px 0 0",
            letterSpacing: "-0.015em",
          }}
        >
          {node.name}
        </h3>
      </div>
      <div
        className="hide-scrollbar"
        style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}
      >
        <Field label="Node name">
          <input defaultValue={node.name} style={inp} />
        </Field>
        {node.type === "LLM" && (
          <>
            <Field label="Model">
              <div style={inp}>
                <span style={{ color: "var(--fg-1)" }}>gemini-1.5-flash</span>
              </div>
            </Field>
            <Field label="System prompt">
              <textarea
                defaultValue="Summarise the fetched sources into a concise daily digest. Keep it under 200 words."
                rows={4}
                style={{ ...inp, resize: "none", lineHeight: 1.5 }}
              />
            </Field>
            <Field label="Temperature">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.4"
                  style={{ flex: 1, accentColor: "var(--acc, #00d9f4)" }}
                />
                <code
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--fg-2)",
                  }}
                >
                  0.4
                </code>
              </div>
            </Field>
          </>
        )}
        {node.type === "TTS" && (
          <>
            <Field label="Voice">
              <div style={inp}>af_heart · en-US</div>
            </Field>
            <Field label="Speed">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  defaultValue="1"
                  style={{ flex: 1, accentColor: "var(--acc, #00d9f4)" }}
                />
                <code
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--fg-2)",
                  }}
                >
                  1.0×
                </code>
              </div>
            </Field>
          </>
        )}
        {node.type === "Start" && (
          <Field label="Schedule (cron)">
            <code
              style={{
                ...inp,
                fontFamily: "var(--font-mono)",
                display: "block",
              }}
            >
              0 9 * * *
            </code>
          </Field>
        )}
        {node.type === "Branch" && (
          <Field label="Condition">
            <code
              style={{
                ...inp,
                fontFamily: "var(--font-mono)",
                display: "block",
              }}
            >
              score &gt; 0.8
            </code>
          </Field>
        )}
        {(node.type === "Action" || node.type === "End") && (
          <Field label="Connection">
            <div style={inp}>{node.meta}</div>
          </Field>
        )}

        <Field label="Connections">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12.5,
                color: "var(--fg-3)",
              }}
            >
              <MS
                name="south_west"
                size={15}
                style={{ color: "var(--success)" }}
              />
              2 inputs
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12.5,
                color: "var(--fg-3)",
              }}
            >
              <MS
                name="north_east"
                size={15}
                style={{ color: "var(--acc-text, var(--aurora-300))" }}
              />
              1 output
            </div>
          </div>
        </Field>
      </div>
      <div
        style={{
          padding: "14px 18px",
          borderTop: "1px solid var(--border-1)",
          display: "flex",
          gap: 8,
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          icon={<MS name="content_copy" size={15} />}
          style={{ flex: 1 }}
        >
          Duplicate
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={<MS name="delete" size={15} />}
          title="Delete node"
        />
      </div>
    </aside>
  );
}

function RunBar({ showLogs, onToggleLogs }) {
  const logs = [
    { t: "12:41:02", m: "Trigger fired · cron 0 9 * * *", c: "var(--fg-4)" },
    {
      t: "12:41:03",
      m: "Fetch sources → 14 items (rss, github, gmail)",
      c: "var(--success)",
    },
    {
      t: "12:41:05",
      m: "Synthesise → kokoro af_heart · 1.2s",
      c: "var(--success)",
    },
    {
      t: "12:41:06",
      m: "Summarise → gemini-1.5-flash · streaming…",
      c: "var(--acc-text, var(--aurora-300))",
    },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 16,
        background: "var(--bg-glass)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        border: "1px solid var(--border-2)",
        borderRadius: "var(--r-card,12px)",
        boxShadow: "var(--shadow-2)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "11px 14px",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--fg-1)",
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              border: "1.5px solid var(--acc-text, var(--aurora-300))",
              borderTopColor: "transparent",
              animation: "knik-spin 0.9s linear infinite",
            }}
          />
          Running
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            color: "var(--fg-4)",
          }}
        >
          Daily digest · step 4 / 7
        </span>
        <div
          style={{
            flex: 1,
            height: 5,
            borderRadius: 999,
            background: "var(--bg-surface-3)",
            overflow: "hidden",
            maxWidth: 320,
          }}
        >
          <div
            style={{
              width: "57%",
              height: "100%",
              borderRadius: 999,
              background:
                "linear-gradient(90deg, var(--acc, var(--aurora-400)), var(--teal-400))",
            }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            color: "var(--fg-3)",
          }}
        >
          4.1s
        </span>
        <button
          type="button"
          onClick={onToggleLogs}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            border: "1px solid var(--border-2)",
            background: "var(--bg-surface-2)",
            color: "var(--fg-2)",
            borderRadius: "var(--r-btn,8px)",
            padding: "6px 10px",
            fontSize: 12.5,
            fontWeight: 550,
            cursor: "pointer",
          }}
        >
          <MS name="terminal" size={15} />
          Logs
          <MS name={showLogs ? "expand_more" : "expand_less"} size={15} />
        </button>
      </div>
      {showLogs && (
        <div
          style={{
            borderTop: "1px solid var(--border-1)",
            padding: "10px 14px",
            background: "var(--bg-code)",
            maxHeight: 110,
            overflowY: "auto",
            animation: "knik-fade-up 200ms var(--ease-out) both",
          }}
          className="hide-scrollbar"
        >
          {logs.map((l, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                lineHeight: 1.8,
              }}
            >
              <span style={{ color: "var(--fg-5)" }}>{l.t}</span>
              <span style={{ color: l.c }}>{l.m}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { WorkflowBuilder });
