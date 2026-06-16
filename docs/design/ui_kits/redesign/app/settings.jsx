/* settings.jsx — tabbed settings: General · Appearance · Providers · Voice · API keys */

function Settings({ dark, onToggleTheme, accent, onAccent }) {
  const [tab, setTab] = React.useState("general");
  const tabs = [
    { k: "general", label: "General", icon: "tune" },
    { k: "appearance", label: "Appearance", icon: "palette" },
    { k: "providers", label: "Providers", icon: "hub" },
    { k: "voice", label: "Voice", icon: "graphic_eq" },
    { k: "keys", label: "API keys", icon: "key" },
  ];
  return (
    <PageScroll maxWidth={920}>
      <SectionHeader
        title="Settings"
        sub="Manage your workspace, models, and account"
      />
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Side tabs */}
        <div
          style={{
            width: 184,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            position: "sticky",
            top: 0,
          }}
        >
          {tabs.map((t) => {
            const active = tab === t.k;
            return (
              <button
                key={t.k}
                type="button"
                onClick={() => setTab(t.k)}
                onMouseEnter={(e) => {
                  if (!active)
                    e.currentTarget.style.background = "var(--bg-surface-2)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 11px",
                  borderRadius: "var(--r-btn,8px)",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13.5,
                  fontWeight: 550,
                  letterSpacing: "-0.01em",
                  background: active ? "var(--acc-soft)" : "transparent",
                  color: active
                    ? "var(--acc-text, var(--aurora-200))"
                    : "var(--fg-3)",
                  transition: "all 150ms var(--ease-out)",
                }}
              >
                <MS name={t.icon} size={18} fill={active ? 1 : 0} />
                {t.label}
              </button>
            );
          })}
        </div>
        {/* Panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === "general" && <GeneralPane />}
          {tab === "appearance" && (
            <AppearancePane
              dark={dark}
              onToggleTheme={onToggleTheme}
              accent={accent}
              onAccent={onAccent}
            />
          )}
          {tab === "providers" && <ProvidersPane />}
          {tab === "voice" && <VoicePane />}
          {tab === "keys" && <KeysPane />}
        </div>
      </div>
    </PageScroll>
  );
}

function Group({ title, sub, children }) {
  return (
    <Card style={{ marginBottom: 18 }}>
      <div style={{ marginBottom: 16 }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--fg-1)",
            margin: 0,
          }}
        >
          {title}
        </h3>
        {sub && (
          <div style={{ fontSize: 12.5, color: "var(--fg-4)", marginTop: 3 }}>
            {sub}
          </div>
        )}
      </div>
      {children}
    </Card>
  );
}
function Row({ label, hint, children, last }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "13px 0",
        borderBottom: last ? "none" : "1px solid var(--border-1)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 550, color: "var(--fg-1)" }}>
          {label}
        </div>
        {hint && (
          <div style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 2 }}>
            {hint}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
const fieldStyle = {
  padding: "8px 11px",
  borderRadius: "var(--r-btn,8px)",
  border: "1px solid var(--border-2)",
  background: "var(--bg-surface)",
  color: "var(--fg-1)",
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  outline: "none",
  minWidth: 200,
};

function GeneralPane() {
  return (
    <>
      <Group title="Profile" sub="How you appear across Knik AI">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingBottom: 16,
            borderBottom: "1px solid var(--border-1)",
            marginBottom: 6,
          }}
        >
          <Avatar initials={KNIK.account.initials} size={56} color="accent" />
          <div style={{ flex: 1 }}>
            <div
              style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-1)" }}
            >
              {KNIK.account.name}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                color: "var(--fg-4)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--success)",
                }}
              />
              Local account · this device
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<MS name="photo_camera" size={15} />}
          >
            Change
          </Button>
        </div>
        <Row label="Display name">
          <input defaultValue={KNIK.account.name} style={fieldStyle} />
        </Row>
        <Row label="Username" hint="Shown locally on this device" last>
          <input defaultValue={KNIK.account.handle} style={fieldStyle} />
        </Row>
      </Group>
      <Group title="Defaults">
        <Row label="Default model" hint="Used for new chats">
          <div
            style={{
              ...fieldStyle,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--teal-400)",
              }}
            />
            Gemini 1.5 Flash
          </div>
        </Row>
        <Row label="Stream responses" hint="Show tokens as they generate">
          <Toggle checked={true} onChange={() => {}} />
        </Row>
        <Row label="Send telemetry" hint="Anonymous usage to improve KNIK" last>
          <Toggle checked={false} onChange={() => {}} />
        </Row>
      </Group>
      <Group title="Danger zone" sub="Irreversible actions">
        <Row label="Delete all conversations" hint="Cannot be undone" last>
          <Button
            variant="danger"
            size="sm"
            icon={<MS name="delete_forever" size={15} />}
          >
            Delete
          </Button>
        </Row>
      </Group>
    </>
  );
}

function AppearancePane({ dark, onToggleTheme, accent, onAccent }) {
  const accents = [
    { id: "cyan", label: "Aurora cyan", color: "#00d9f4" },
    { id: "teal", label: "Deep teal", color: "#14b8a6" },
    { id: "violet", label: "Violet", color: "#8b5cf6" },
    { id: "amber", label: "Amber", color: "#f59e0b" },
  ];
  return (
    <>
      <Group
        title="Theme"
        sub="KNIK is dark-first; light mode ships for Electron"
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {[
            { k: "dark", label: "Dark", on: dark },
            { k: "light", label: "Light", on: !dark },
          ].map((o) => (
            <button
              key={o.k}
              type="button"
              onClick={() => {
                if ((o.k === "dark") !== dark) onToggleTheme();
              }}
              style={{
                textAlign: "left",
                padding: 0,
                borderRadius: "var(--r-card,12px)",
                overflow: "hidden",
                cursor: "pointer",
                border: `1.5px solid ${o.on ? "var(--acc, var(--aurora-400))" : "var(--border-2)"}`,
                background: "transparent",
              }}
            >
              <div
                style={{
                  height: 80,
                  background: o.k === "dark" ? "#0d1117" : "#f5f6f8",
                  padding: 12,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "55%",
                    height: 8,
                    borderRadius: 4,
                    background: o.k === "dark" ? "#1c2430" : "#dfe3e9",
                  }}
                />
                <div
                  style={{
                    width: "40%",
                    height: 8,
                    borderRadius: 4,
                    background: "var(--acc, #00d9f4)",
                    marginTop: 7,
                  }}
                />
                <div
                  style={{
                    width: "70%",
                    height: 8,
                    borderRadius: 4,
                    background: o.k === "dark" ? "#161c27" : "#e9ecf1",
                    marginTop: 7,
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "var(--bg-surface-2)",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--fg-1)",
                  }}
                >
                  {o.label}
                </span>
                {o.on && (
                  <MS
                    name="check_circle"
                    size={17}
                    fill={1}
                    style={{ color: "var(--acc-text, var(--aurora-300))" }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </Group>
      <Group
        title="Accent color"
        sub="Drives buttons, links, and active states"
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {accents.map((a) => {
            const on = accent === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onAccent(a.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "9px 13px",
                  borderRadius: "var(--r-btn,10px)",
                  cursor: "pointer",
                  border: `1.5px solid ${on ? a.color : "var(--border-2)"}`,
                  background: on ? "var(--bg-surface-3)" : "var(--bg-surface)",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: a.color,
                    boxShadow: `0 0 12px -2px ${a.color}`,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 550,
                    color: "var(--fg-1)",
                  }}
                >
                  {a.label}
                </span>
                {on && <MS name="check" size={16} style={{ color: a.color }} />}
              </button>
            );
          })}
        </div>
      </Group>
      <Group title="Interface">
        <Row label="Compact density" hint="Tighter spacing in tables and lists">
          <Toggle checked={false} onChange={() => {}} />
        </Row>
        <Row label="Reduce motion" hint="Minimise animations" last>
          <Toggle checked={false} onChange={() => {}} />
        </Row>
      </Group>
    </>
  );
}

function ProvidersPane() {
  const dot = {
    primary: "var(--acc, #00d9f4)",
    teal: "#14b8a6",
    violet: "#8b5cf6",
    muted: "#6a7585",
  };
  return (
    <>
      <Group
        title="AI providers"
        sub="7 providers · 31 MCP tools across 7 categories"
      >
        {KNIK.providers.map((p, i) => (
          <Row
            key={p.id}
            label={p.name}
            hint={p.models}
            last={i === KNIK.providers.length - 1}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <StatusBadge status={p.status} size="sm" />
              <Button
                variant={p.status === "offline" ? "primary" : "secondary"}
                size="sm"
              >
                {p.status === "offline" ? "Connect" : "Manage"}
              </Button>
            </div>
          </Row>
        ))}
      </Group>
      <Group
        title="MCP tools"
        sub="Enabled integrations available to workflows & chat"
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {KNIK.mcpTools.map((t) => (
            <Chip key={t.name} icon={<MS name="extension" size={14} />}>
              {t.name}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--fg-5)",
                  marginLeft: 2,
                }}
              >
                {t.count}
              </span>
            </Chip>
          ))}
          <Chip icon={<MS name="add" size={14} />} onClick={() => {}}>
            Add tool
          </Chip>
        </div>
      </Group>
    </>
  );
}

function VoicePane() {
  const [sel, setSel] = React.useState("af_heart");
  return (
    <>
      <Group
        title="Text-to-speech"
        sub="Powered by Kokoro-82M · 9 voices · 10 languages"
      >
        <Row label="Enable TTS" hint="Read assistant replies aloud">
          <Toggle checked={true} onChange={() => {}} />
        </Row>
        <Row label="Speaking rate" last>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 200,
            }}
          >
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
        </Row>
      </Group>
      <Group title="Voice" sub="Default voice for synthesis">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {KNIK.voices.map((v) => {
            const on = sel === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSel(v.id)}
                style={{
                  textAlign: "left",
                  padding: "12px 13px",
                  borderRadius: "var(--r-btn,10px)",
                  cursor: "pointer",
                  border: `1.5px solid ${on ? "var(--acc, var(--aurora-400))" : "var(--border-2)"}`,
                  background: on ? "var(--acc-soft)" : "var(--bg-surface)",
                  transition: "all 150ms var(--ease-out)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        v.gender === "F"
                          ? "rgba(139,92,246,0.16)"
                          : "var(--acc-soft)",
                      color:
                        v.gender === "F"
                          ? "var(--violet-400)"
                          : "var(--acc-text, var(--aurora-300))",
                    }}
                  >
                    <MS name="graphic_eq" size={16} />
                  </span>
                  {on && (
                    <MS
                      name="check_circle"
                      size={16}
                      fill={1}
                      style={{
                        color: "var(--acc-text, var(--aurora-300))",
                        marginLeft: "auto",
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--fg-1)",
                  }}
                >
                  {v.name}
                </div>
                <code
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--fg-4)",
                  }}
                >
                  {v.id}
                </code>
                <div
                  style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 3 }}
                >
                  {v.lang} · {v.gender === "F" ? "Female" : "Male"}
                </div>
              </button>
            );
          })}
        </div>
      </Group>
    </>
  );
}

function KeysPane() {
  return (
    <>
      <Group
        title="API keys"
        sub="Use these to call the KNIK API from your own apps"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 8,
          }}
        >
          <Button
            variant="primary"
            size="sm"
            icon={<MS name="add" size={15} />}
          >
            Create key
          </Button>
        </div>
        {KNIK.apiKeys.map((k, i) => (
          <div
            key={k.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "13px 0",
              borderBottom:
                i === KNIK.apiKeys.length - 1
                  ? "none"
                  : "1px solid var(--border-1)",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "var(--r-btn,8px)",
                background: "var(--bg-surface-3)",
                color: "var(--fg-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MS name="key" size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--fg-1)",
                  }}
                >
                  {k.label}
                </span>
                <Chip size="sm">{k.scope}</Chip>
              </div>
              <code
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--fg-4)",
                }}
              >
                {k.prefix}••••••••••••
              </code>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
                Used {k.lastUsed}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color: "var(--fg-5)",
                }}
              >
                {k.created}
              </div>
            </div>
            <IconButton
              size={32}
              icon={<MS name="content_copy" size={15} />}
              title="Copy"
            />
            <IconButton
              size={32}
              icon={<MS name="delete" size={15} />}
              title="Revoke"
              danger
            />
          </div>
        ))}
      </Group>
    </>
  );
}

Object.assign(window, { Settings });
