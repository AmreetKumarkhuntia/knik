/* WorkflowBuilder.jsx — DAG canvas with start / LLM / branch / end nodes */

const builderNodes = [
  {
    id: "start",
    type: "Start",
    name: "Trigger",
    meta: "cron · 09:00",
    x: 80,
    y: 220,
    status: "success",
  },
  {
    id: "fetch",
    type: "Action",
    name: "Fetch sources",
    meta: "rss · github · gmail",
    x: 320,
    y: 100,
    status: "success",
  },
  {
    id: "tts",
    type: "TTS",
    name: "Synthesise",
    meta: "kokoro · af_heart",
    x: 320,
    y: 340,
    status: "success",
  },
  {
    id: "llm",
    type: "LLM",
    name: "Summarise",
    meta: "gemini-1.5-flash",
    x: 580,
    y: 220,
    status: "running",
  },
  {
    id: "branch",
    type: "Branch",
    name: "If urgent?",
    meta: "score > 0.8",
    x: 820,
    y: 220,
    status: "pending",
  },
  {
    id: "email",
    type: "End",
    name: "Email digest",
    meta: "→ team",
    x: 1060,
    y: 100,
    status: "pending",
  },
  {
    id: "slack",
    type: "End",
    name: "Ping Slack",
    meta: "#alerts",
    x: 1060,
    y: 340,
    status: "pending",
  },
];

const builderEdges = [
  ["start", "fetch", "success"],
  ["start", "tts", "success"],
  ["fetch", "llm", "success"],
  ["tts", "llm", "success"],
  ["llm", "branch", "running"],
  ["branch", "email", "pending"],
  ["branch", "slack", "pending"],
];

function WorkflowBuilder() {
  const byId = Object.fromEntries(builderNodes.map((n) => [n.id, n]));
  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        background: "var(--bg-canvas)",
        backgroundImage:
          "linear-gradient(to right,  rgba(255,255,255,0.04) 1px, transparent 1px), " +
          "linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        overflow: "hidden",
      }}
    >
      {/* SVG edges */}
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <defs>
          <marker
            id="arr-success"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#10b981" />
          </marker>
          <marker
            id="arr-running"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#00d9f4" />
          </marker>
          <marker
            id="arr-pending"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#6a7585" />
          </marker>
        </defs>
        {builderEdges.map(([from, to, status], i) => {
          const a = byId[from],
            b = byId[to];
          if (!a || !b) return null;
          const x1 = a.x + 180,
            y1 = a.y + 36;
          const x2 = b.x,
            y2 = b.y + 36;
          const cx = (x1 + x2) / 2;
          const stroke =
            status === "success"
              ? "#10b981"
              : status === "running"
                ? "#00d9f4"
                : "#6a7585";
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`}
              fill="none"
              stroke={stroke}
              strokeWidth="2"
              strokeDasharray={
                status === "running"
                  ? "8 6"
                  : status === "pending"
                    ? "4 6"
                    : undefined
              }
              style={
                status === "running"
                  ? { animation: "knik-dash 1.2s linear infinite" }
                  : undefined
              }
              markerEnd={`url(#arr-${status})`}
              opacity={status === "pending" ? 0.55 : 1}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {builderNodes.map((n) => (
        <BuilderNode key={n.id} node={n} />
      ))}

      {/* Floating controls (bottom-right) */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          background: "var(--bg-glass)",
          backdropFilter: "blur(20px) saturate(140%)",
          WebkitBackdropFilter: "blur(20px) saturate(140%)",
          border: "1px solid var(--border-2)",
          borderRadius: 10,
          padding: 4,
          boxShadow: "0 8px 24px -8px rgba(0,0,0,0.5)",
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

      {/* Run button (top-right floating) */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 24,
          display: "flex",
          gap: 8,
        }}
      >
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
          icon={<MS name="play_arrow" size={16} fill={1} />}
        >
          Run
        </Button>
      </div>

      {/* Node palette (left floating) */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 24,
          background: "var(--bg-glass)",
          backdropFilter: "blur(20px) saturate(140%)",
          WebkitBackdropFilter: "blur(20px) saturate(140%)",
          border: "1px solid var(--border-2)",
          borderRadius: 12,
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          width: 160,
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
          ["llm", "LLM", "smart_toy"],
          ["action", "Action", "bolt"],
          ["tts", "TTS", "campaign"],
          ["branch", "Branch", "alt_route"],
          ["code", "Code", "code"],
          ["merge", "Merge", "merge"],
        ].map(([k, label, ico]) => (
          <div
            key={k}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 8px",
              borderRadius: 7,
              color: "var(--fg-2)",
              fontSize: 13,
              cursor: "grab",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-surface-3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <MS name={ico} size={16} style={{ color: "var(--aurora-300)" }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function BuilderNode({ node }) {
  const cfg =
    {
      Start: {
        type: "start",
        border: "rgba(20,184,166,0.45)",
        chip: "rgba(20,184,166,0.18)",
        chipFg: "var(--teal-300)",
      },
      Action: {
        type: "action",
        border: "var(--border-3)",
        chip: "var(--bg-surface-3)",
        chipFg: "var(--fg-3)",
      },
      TTS: {
        type: "tts",
        border: "rgba(139,92,246,0.40)",
        chip: "rgba(139,92,246,0.18)",
        chipFg: "#a78bfa",
      },
      LLM: {
        type: "llm",
        border: "rgba(0,217,244,0.55)",
        chip: "rgba(0,217,244,0.18)",
        chipFg: "var(--aurora-300)",
      },
      Branch: {
        type: "branch",
        border: "var(--border-3)",
        chip: "rgba(245,158,11,0.18)",
        chipFg: "#f59e0b",
      },
      End: {
        type: "end",
        border: "rgba(139,92,246,0.40)",
        chip: "rgba(139,92,246,0.18)",
        chipFg: "#a78bfa",
      },
    }[node.type] || {};

  const glow =
    node.status === "running"
      ? "0 0 0 1px rgba(0,217,244,0.30), 0 0 36px -6px rgba(0,217,244,0.55)"
      : node.status === "success"
        ? "0 0 0 1px rgba(16,185,129,0.18)"
        : "none";

  return (
    <div
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: 180,
        background: "rgba(11,16,24,0.92)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: `1px solid ${cfg.border || "var(--border-2)"}`,
        borderRadius: 10,
        padding: "10px 12px",
        boxShadow: glow,
        animation: `knik-fade-up 380ms var(--ease-out) ${(Object.keys({ Start: 0, Action: 1, TTS: 1, LLM: 2, Branch: 3, End: 4 })[node.type] || 0) * 80}ms both`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: cfg.chipFg,
            background: cfg.chip,
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          {node.type}
        </span>
        {node.status === "running" && (
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              border: "1.5px solid var(--aurora-300)",
              borderTopColor: "transparent",
              animation: "knik-spin 0.9s linear infinite",
            }}
          />
        )}
        {node.status === "success" && (
          <MS name="check" size={14} style={{ color: "var(--success)" }} />
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

      {/* Handles */}
      <Handle pos="left" />
      <Handle pos="right" />
    </div>
  );
}

function Handle({ pos }) {
  return (
    <span
      style={{
        position: "absolute",
        top: "50%",
        [pos]: -5,
        transform: "translateY(-50%)",
        width: 9,
        height: 9,
        borderRadius: "50%",
        background: "var(--aurora-400)",
        border: "2px solid #0d111a",
      }}
    />
  );
}

Object.assign(window, { WorkflowBuilder, BuilderNode });
