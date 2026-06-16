/* App.jsx — router + shell + command palette + accent/theme/density driven by Tweaks */

const ACCENTS = {
  cyan: {
    acc: "#00d9f4",
    text: "#34d3ee",
    soft: "rgba(0,217,244,0.12)",
    border: "rgba(0,217,244,0.42)",
    glow: "rgba(0,217,244,0.55)",
    blob: "rgba(0,217,244,0.16)",
  },
  teal: {
    acc: "#14b8a6",
    text: "#2dd4bf",
    soft: "rgba(20,184,166,0.13)",
    border: "rgba(20,184,166,0.42)",
    glow: "rgba(20,184,166,0.5)",
    blob: "rgba(20,184,166,0.16)",
  },
  violet: {
    acc: "#8b5cf6",
    text: "#a78bfa",
    soft: "rgba(139,92,246,0.14)",
    border: "rgba(139,92,246,0.42)",
    glow: "rgba(139,92,246,0.5)",
    blob: "rgba(139,92,246,0.16)",
  },
  amber: {
    acc: "#f59e0b",
    text: "#fbbf24",
    soft: "rgba(245,158,11,0.14)",
    border: "rgba(245,158,11,0.42)",
    glow: "rgba(245,158,11,0.5)",
    blob: "rgba(245,158,11,0.16)",
  },
};
const RADII = {
  sharp: { btn: "4px", card: "7px" },
  default: { btn: "8px", card: "12px" },
  round: { btn: "12px", card: "18px" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  accent: "cyan",
  theme: "dark",
  density: "comfortable",
  radius: "default",
}; /*EDITMODE-END*/

function buildVars(t) {
  const a = ACCENTS[t.accent] || ACCENTS.cyan;
  const r = RADII[t.radius] || RADII.default;
  return {
    "--acc": a.acc,
    "--acc-text": a.text,
    "--acc-soft": a.soft,
    "--acc-border": a.border,
    "--acc-glow": a.glow,
    "--acc-blob": a.blob,
    "--primary": a.acc,
    "--primary-soft": a.soft,
    "--border-focus": a.acc,
    "--r-btn": r.btn,
    "--r-card": r.card,
    "--pad-card": t.density === "compact" ? "13px" : "18px",
  };
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState("chat");
  const [collapsed, setCollapsed] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [model, setModel] = React.useState("gemini-1.5-flash");
  const [palette, setPalette] = React.useState(false);

  const dark = t.theme !== "light";
  const vars = buildVars(t);

  React.useEffect(() => {
    const r = document.documentElement;
    if (dark) {
      r.removeAttribute("data-theme");
    } else {
      r.setAttribute("data-theme", "light");
    }
    // accent + radius vars also live on the root so fixed overlays + body inherit them
    Object.entries(vars).forEach(([k, v]) => r.style.setProperty(k, v));
  }, [dark, t.accent, t.radius, t.density]);

  React.useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if (e.key === "Escape") setPalette(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Deep-link initial view from URL hash so preview cards can target a screen
  // (e.g. index.html#builder, index.html#settings, index.html#thread).
  React.useEffect(() => {
    const hash = (window.location.hash || "").replace("#", "");
    if (!hash) return;
    if (hash === "thread") {
      setMessages(KNIK.thread);
      setView("chat");
    } else setView(hash);
  }, []);

  const send = (override) => {
    const text = (override || input).trim();
    if (!text || streaming) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setStreaming(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", model, at: "now", content: fakeReply(text) },
      ]);
      setStreaming(false);
    }, 800);
  };
  const newChat = () => {
    setMessages([]);
    setInput("");
    setView("chat");
  };
  const seedThread = () => {
    setMessages(KNIK.thread);
    setView("chat");
  };

  const crumbs = {
    chat: ["Knik AI", messages.length ? "Chat" : "New chat"],
    workflows: ["Workflows", "Hub"],
    builder: ["Workflows", "Builder", "Daily digest"],
    schedules: ["Workflows", "Schedules"],
    settings: ["Settings"],
  }[view];

  const topRight =
    view === "workflows" ? (
      <Button
        variant="primary"
        size="sm"
        icon={<MS name="add" size={16} />}
        onClick={() => setView("builder")}
      >
        Create workflow
      </Button>
    ) : view === "chat" ? (
      <>
        <Chip icon={<MS name="history" size={15} />} onClick={seedThread}>
          Load demo thread
        </Chip>
        <ModelPicker model={model} onChange={setModel} compact />
      </>
    ) : view === "builder" ? (
      <Chip icon={<MS name="bolt" size={14} />} active>
        Editing
      </Chip>
    ) : null;

  const go = (v) => {
    setView(v);
    setPalette(false);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        ...vars,
      }}
      data-theme={dark ? undefined : "light"}
    >
      <Sidebar
        view={view}
        onNavigate={go}
        onNewChat={newChat}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        onOpenSearch={() => setPalette(true)}
      />
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "transparent",
        }}
      >
        <TopBar
          crumbs={crumbs}
          right={topRight}
          onOpenSearch={() => setPalette(true)}
          dark={dark}
          onToggleTheme={() => setTweak("theme", dark ? "light" : "dark")}
        />

        {view === "chat" && messages.length === 0 && (
          <ChatHome
            inputValue={input}
            onChange={setInput}
            onSend={send}
            model={model}
            onModel={setModel}
          />
        )}
        {view === "chat" && messages.length > 0 && (
          <ChatThread
            messages={messages}
            isStreaming={streaming}
            inputValue={input}
            onChange={setInput}
            onSend={send}
            model={model}
            onModel={setModel}
          />
        )}
        {view === "workflows" && (
          <WorkflowHub onOpenBuilder={() => setView("builder")} />
        )}
        {view === "builder" && <WorkflowBuilder />}
        {view === "schedules" && <Schedules />}
        {view === "settings" && (
          <Settings
            dark={dark}
            onToggleTheme={() => setTweak("theme", dark ? "light" : "dark")}
            accent={t.accent}
            onAccent={(a) => setTweak("accent", a)}
          />
        )}
      </main>

      {palette && (
        <CommandPalette
          onClose={() => setPalette(false)}
          onNavigate={go}
          onNewChat={() => {
            newChat();
            setPalette(false);
          }}
        />
      )}

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio
          label="Mode"
          value={t.theme}
          options={["dark", "light"]}
          onChange={(v) => setTweak("theme", v)}
        />
        <TweakColor
          label="Accent"
          value={ACCENTS[t.accent].acc}
          options={[
            ACCENTS.cyan.acc,
            ACCENTS.teal.acc,
            ACCENTS.violet.acc,
            ACCENTS.amber.acc,
          ]}
          onChange={(hex) =>
            setTweak(
              "accent",
              Object.keys(ACCENTS).find((k) => ACCENTS[k].acc === hex) ||
                "cyan",
            )
          }
        />
        <TweakSection label="Layout" />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["comfortable", "compact"]}
          onChange={(v) => setTweak("density", v)}
        />
        <TweakRadio
          label="Corners"
          value={t.radius}
          options={["sharp", "default", "round"]}
          onChange={(v) => setTweak("radius", v)}
        />
      </TweaksPanel>
    </div>
  );
}

function CommandPalette({ onClose, onNavigate, onNewChat }) {
  const [q, setQ] = React.useState("");
  const ref = React.useRef(null);
  React.useEffect(() => {
    ref.current?.focus();
  }, []);
  const cmds = [
    {
      id: "new",
      label: "New chat",
      icon: "add",
      hint: "Start a fresh conversation",
      run: onNewChat,
      group: "Actions",
    },
    {
      id: "chat",
      label: "Go to Chat",
      icon: "forum",
      run: () => onNavigate("chat"),
      group: "Navigate",
    },
    {
      id: "workflows",
      label: "Go to Workflows",
      icon: "account_tree",
      run: () => onNavigate("workflows"),
      group: "Navigate",
    },
    {
      id: "builder",
      label: "Open Workflow Builder",
      icon: "polyline",
      run: () => onNavigate("builder"),
      group: "Navigate",
    },
    {
      id: "schedules",
      label: "Go to Schedules",
      icon: "schedule",
      run: () => onNavigate("schedules"),
      group: "Navigate",
    },
    {
      id: "settings",
      label: "Open Settings",
      icon: "settings",
      run: () => onNavigate("settings"),
      group: "Navigate",
    },
    {
      id: "keys",
      label: "Manage API keys",
      icon: "key",
      run: () => onNavigate("settings"),
      group: "Navigate",
    },
  ];
  const filtered = cmds.filter((c) =>
    c.label.toLowerCase().includes(q.toLowerCase()),
  );
  const groups = [...new Set(filtered.map((c) => c.group))];
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(4,7,11,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        animation: "knik-fade-up 160ms var(--ease-out) both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 92vw)",
          background: "var(--bg-surface-2)",
          border: "1px solid var(--border-2)",
          borderRadius: "var(--r-card,16px)",
          boxShadow: "var(--shadow-3)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "14px 16px",
            borderBottom: "1px solid var(--border-1)",
          }}
        >
          <MS name="search" size={20} style={{ color: "var(--fg-4)" }} />
          <input
            ref={ref}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search or run a command…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
              fontSize: 15,
            }}
          />
          <Kbd>Esc</Kbd>
        </div>
        <div
          className="hide-scrollbar"
          style={{ maxHeight: 380, overflowY: "auto", padding: 8 }}
        >
          {groups.map((g) => (
            <div key={g} style={{ marginBottom: 4 }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--fg-4)",
                  padding: "8px 10px 5px",
                }}
              >
                {g}
              </div>
              {filtered
                .filter((c) => c.group === g)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      c.run();
                      onClose();
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-surface-3)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      padding: "10px 11px",
                      borderRadius: "var(--r-btn,8px)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 130ms var(--ease-out)",
                    }}
                  >
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "var(--r-btn,7px)",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-1)",
                        color: "var(--acc-text, var(--aurora-300))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MS name={c.icon} size={17} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 550,
                          color: "var(--fg-1)",
                        }}
                      >
                        {c.label}
                      </div>
                      {c.hint && (
                        <div style={{ fontSize: 11.5, color: "var(--fg-4)" }}>
                          {c.hint}
                        </div>
                      )}
                    </div>
                    <MS
                      name="keyboard_return"
                      size={15}
                      style={{ color: "var(--fg-5)" }}
                    />
                  </button>
                ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <div
              style={{
                padding: "28px 12px",
                textAlign: "center",
                color: "var(--fg-4)",
                fontSize: 13,
              }}
            >
              No commands match “{q}”
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function fakeReply(p) {
  const s = p.toLowerCase();
  if (s.includes("refactor"))
    return "Three quick wins:\n1. Replace the inner `for` loop with a generator so we never materialise the full list.\n2. Swap `json.loads` for `orjson` — about 3× faster here.\n3. Hoist the regex out of the hot path so it isn't recompiled per call.";
  if (s.includes("blog") || s.includes("outline"))
    return "Outline:\n1. Why on-device TTS finally got good (Kokoro-82M, low latency)\n2. Where it still fails (long-form intonation, code-switching)\n3. Deployment patterns: edge, hybrid, cloud\n4. What's next: voice cloning + multi-speaker streams.";
  if (s.includes("debug") || s.includes("bug") || s.includes("hook"))
    return "Looks like a missing dependency in `useEffect` — the value is referenced inside but isn't in the dep array, so React keeps a stale closure. Add it and the latest value shows on every render.";
  if (s.includes("workflow") || s.includes("digest"))
    return "Spun up a new workflow. Trigger is `cron(0 9 * * *)`, the LLM step uses `gemini-1.5-flash`, and the digest is delivered via email + Slack. Open the builder to inspect each node.";
  return "Got it — I'll work through that and report back. (Demo reply; wire `window.claude.complete` for live answers.)";
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
