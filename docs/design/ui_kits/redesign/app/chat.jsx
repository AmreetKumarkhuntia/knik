/* chat.jsx — ChatHome, ChatThread, InputPanel, ModelPicker, ThinkingBlock, CodeBlock */

function ModelPicker({ model, onChange, compact }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const cur = KNIK.models.find((m) => m.id === model) || KNIK.models[0];
  const dot = {
    primary: "var(--acc, var(--aurora-400))",
    teal: "var(--teal-400)",
    violet: "var(--violet-400)",
    success: "var(--success)",
  };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = "var(--border-3)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderColor = "var(--border-2)")
        }
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: compact ? "6px 10px" : "8px 12px",
          borderRadius: "var(--r-btn,8px)",
          border: "1px solid var(--border-2)",
          background: "var(--bg-surface-2)",
          color: "var(--fg-1)",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 550,
          transition: "all 150ms var(--ease-out)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: dot[cur.badge],
          }}
        />
        {cur.label}
        <MS name="expand_more" size={16} style={{ color: "var(--fg-4)" }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: compact ? "auto" : "calc(100% + 8px)",
            top: compact ? "calc(100% + 8px)" : "auto",
            left: 0,
            minWidth: 248,
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--r-card,12px)",
            boxShadow: "var(--shadow-3)",
            padding: 6,
            zIndex: 40,
            animation: "knik-fade-up 160ms var(--ease-out) both",
          }}
        >
          {KNIK.models.map((m) => {
            const active = m.id === model;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onChange(m.id);
                  setOpen(false);
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-surface-3)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = active
                    ? "var(--acc-soft)"
                    : "transparent")
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: "var(--r-btn,8px)",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  background: active ? "var(--acc-soft)" : "transparent",
                  transition: "background 140ms var(--ease-out)",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: dot[m.badge],
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 550,
                      color: "var(--fg-1)",
                    }}
                  >
                    {m.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg-4)" }}>
                    {m.vendor}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--fg-3)",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-1)",
                    padding: "2px 6px",
                    borderRadius: 5,
                  }}
                >
                  {m.tag}
                </span>
                {active && (
                  <MS
                    name="check"
                    size={16}
                    style={{ color: "var(--acc-text, var(--aurora-300))" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InputPanel({ value, onChange, onSend, autoFocus, model, onModel }) {
  const ref = React.useRef(null);
  const [focused, setFocused] = React.useState(false);
  React.useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);
  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSend();
    }
  };
  return (
    <div>
      <div
        style={{
          background: "var(--bg-glass)",
          backdropFilter: "blur(20px) saturate(140%)",
          WebkitBackdropFilter: "blur(20px) saturate(140%)",
          border: `1px solid ${focused ? "var(--acc-border, rgba(0,217,244,0.45))" : "var(--border-2)"}`,
          borderRadius: "var(--r-card,14px)",
          padding: "12px 12px 10px 14px",
          transition: "all 200ms var(--ease-out)",
          boxShadow: focused ? "0 0 0 3px var(--acc-soft)" : "var(--shadow-1)",
        }}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={1}
          placeholder="Type your message…  (Shift+Enter for new line)"
          style={{
            width: "100%",
            minHeight: 26,
            maxHeight: 200,
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
            fontSize: 14.5,
            lineHeight: 1.5,
            padding: "4px 0",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {model && <ModelPicker model={model} onChange={onModel} compact />}
          <IconButton
            title="Attach"
            icon={<MS name="attach_file" size={18} />}
          />
          <IconButton title="Voice" icon={<MS name="mic" size={18} />} />
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim()}
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--r-btn,10px)",
              background: "var(--acc, var(--aurora-400))",
              color: "var(--on-primary)",
              border: "none",
              cursor: value.trim() ? "pointer" : "not-allowed",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: value.trim()
                ? "0 6px 22px -6px var(--acc-glow, rgba(0,217,244,0.65)), 0 1px 0 rgba(255,255,255,0.2) inset"
                : "none",
              opacity: value.trim() ? 1 : 0.4,
              transition: "all 200ms var(--ease-out)",
            }}
          >
            <MS name="arrow_upward" size={20} weight={500} />
          </button>
        </div>
      </div>
      <div
        style={{
          marginTop: 8,
          paddingInline: 4,
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--fg-5)",
        }}
      >
        <Kbd>⌘</Kbd> <Kbd>K</Kbd> focus · <Kbd>Enter</Kbd> send ·{" "}
        <Kbd>⇧ Enter</Kbd> newline
      </div>
    </div>
  );
}

function SuggestionCards({ onSelect }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0,1fr))",
        gap: 12,
        maxWidth: 720,
        width: "100%",
        margin: "0 auto",
      }}
    >
      {KNIK.suggestions.map((s, i) => (
        <Card
          key={i}
          hoverable
          onClick={() => onSelect(s.title)}
          style={{
            display: "flex",
            gap: 13,
            alignItems: "flex-start",
            cursor: "pointer",
            animation: `knik-fade-up 380ms var(--ease-out) ${280 + i * 70}ms both`,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--r-btn,9px)",
              background: "var(--acc-soft)",
              color: "var(--acc-text, var(--aurora-300))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MS name={s.icon} size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--fg-1)",
                  letterSpacing: "-0.012em",
                }}
              >
                {s.title}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 3 }}>
              {s.subtitle}
            </div>
            <span
              style={{
                display: "inline-block",
                marginTop: 9,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.04em",
                color: "var(--fg-4)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-1)",
                padding: "2px 7px",
                borderRadius: 5,
              }}
            >
              {s.tag}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ChatHome({ inputValue, onChange, onSend, model, onModel }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -90,
            left: "12%",
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "var(--acc-blob, rgba(0,217,244,0.16))",
            filter: "blur(110px)",
            animation: "knik-blob 16s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "42%",
            right: "8%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(20,184,166,0.14)",
            filter: "blur(110px)",
            animation: "knik-blob 18s ease-in-out infinite",
            animationDelay: "-4s",
          }}
        />
      </div>
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 30, maxWidth: 720 }}>
          <div
            style={{
              margin: "0 auto 20px",
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "rgba(11,18,26,0.7)",
              border: "1.5px solid var(--acc-border, rgba(0,217,244,0.45))",
              boxShadow: "0 0 40px -6px var(--acc-glow, rgba(0,217,244,0.55))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "knik-fade-up 500ms var(--ease-out) 100ms both",
            }}
          >
            <KnikGlyph size={32} />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px,5vw,46px)",
              fontWeight: 600,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              color: "var(--fg-1)",
              margin: 0,
              animation: "knik-fade-up 500ms var(--ease-out) 200ms both",
            }}
          >
            How can I help you <span className="gradient-text">today?</span>
          </h1>
          <p
            style={{
              marginTop: 13,
              fontSize: 16,
              color: "var(--fg-3)",
              maxWidth: 520,
              marginInline: "auto",
              animation: "knik-fade-up 500ms var(--ease-out) 300ms both",
            }}
          >
            Knik AI can assist with coding, content generation, and complex
            workflows.
          </p>
        </div>
        <SuggestionCards onSelect={onSend} />
      </div>
      <div
        style={{
          padding: "12px 24px 24px",
          maxWidth: 860,
          width: "100%",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <InputPanel
          value={inputValue}
          onChange={onChange}
          onSend={() => onSend()}
          autoFocus
          model={model}
          onModel={onModel}
        />
      </div>
    </div>
  );
}

function ThinkingBlock({ steps, tool }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      style={{
        marginBottom: 12,
        border: "1px solid var(--border-2)",
        borderRadius: "var(--r-card,12px)",
        background: "var(--bg-surface)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          width: "100%",
          padding: "10px 13px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "var(--fg-3)",
        }}
      >
        <MS
          name="psychology"
          size={17}
          style={{ color: "var(--acc-text, var(--aurora-300))" }}
        />
        <span
          style={{ fontSize: 12.5, fontWeight: 550, letterSpacing: "-0.01em" }}
        >
          Reasoning &amp; tool calls
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--fg-5)",
          }}
        >
          {steps.length + 1} steps
        </span>
        <div style={{ flex: 1 }} />
        <MS
          name={open ? "expand_less" : "expand_more"}
          size={18}
          style={{ color: "var(--fg-4)" }}
        />
      </button>
      {open && (
        <div
          style={{
            padding: "4px 14px 14px 16px",
            animation: "knik-fade-up 180ms var(--ease-out) both",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 9,
              paddingLeft: 8,
              borderLeft: "1px solid var(--border-2)",
            }}
          >
            {steps.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 9,
                  fontSize: 12.5,
                  color: "var(--fg-3)",
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    color: "var(--fg-5)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s}</span>
              </div>
            ))}
            {tool && (
              <div
                style={{
                  marginTop: 4,
                  padding: "9px 11px",
                  borderRadius: "var(--r-btn,8px)",
                  background: "var(--bg-code)",
                  border: "1px solid var(--border-1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 5,
                  }}
                >
                  <MS
                    name="terminal"
                    size={14}
                    style={{ color: "var(--teal-400)" }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11.5,
                      color: "var(--teal-300)",
                      fontWeight: 550,
                    }}
                  >
                    {tool.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--fg-4)",
                    }}
                  >
                    · {tool.arg}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11.5,
                    color: "var(--success)",
                  }}
                >
                  → {tool.result}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CodeBlock({ lang, body }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div
      style={{
        marginTop: 12,
        borderRadius: "var(--r-card,10px)",
        overflow: "hidden",
        border: "1px solid var(--border-2)",
        background: "var(--bg-code)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 12px",
          borderBottom: "1px solid var(--border-1)",
          background: "var(--bg-surface)",
        }}
      >
        <span style={{ display: "flex", gap: 5 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "var(--danger)",
              opacity: 0.7,
            }}
          />
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "var(--warning)",
              opacity: 0.7,
            }}
          />
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "var(--success)",
              opacity: 0.7,
            }}
          />
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-4)",
            marginLeft: 4,
          }}
        >
          {lang}
        </span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={copy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: copied ? "var(--success)" : "var(--fg-4)",
            fontSize: 11.5,
            fontWeight: 550,
          }}
        >
          <MS name={copied ? "check" : "content_copy"} size={14} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "13px 15px",
          overflowX: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: 12.5,
          lineHeight: 1.6,
          color: "var(--fg-2)",
        }}
      >
        <code>{body}</code>
      </pre>
    </div>
  );
}

function renderInline(text) {
  if (!text) return null;
  return String(text)
    .split("\n")
    .map((line, li) => {
      const parts = line.split(/(`[^`]+`)/g).map((p, i) =>
        p.startsWith("`") && p.endsWith("`") ? (
          <code
            key={i}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.9em",
              background: "var(--bg-code)",
              color: "var(--acc-text, var(--aurora-300))",
              padding: "1px 5px",
              borderRadius: 4,
              border: "1px solid var(--border-1)",
            }}
          >
            {p.slice(1, -1)}
          </code>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      );
      return (
        <div key={li} style={{ minHeight: line ? undefined : "0.7em" }}>
          {parts}
        </div>
      );
    });
}

function Message({ m, streaming }) {
  const isUser = m.role === "user";
  return (
    <div
      style={{
        display: "flex",
        gap: 13,
        flexDirection: isUser ? "row-reverse" : "row",
        animation: `${isUser ? "knik-slide-r" : "knik-slide-l"} 320ms var(--ease-out) both`,
      }}
    >
      {isUser ? (
        <Avatar initials={KNIK.account.initials} size={30} />
      ) : (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            flexShrink: 0,
            background:
              "linear-gradient(135deg, var(--acc-soft), rgba(20,184,166,0.22))",
            border: "1px solid var(--acc-border, rgba(0,217,244,0.4))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <KnikGlyph size={16} glow={false} />
        </div>
      )}
      <div
        style={{
          maxWidth: isUser ? "78%" : "100%",
          flex: isUser ? "none" : 1,
          minWidth: 0,
        }}
      >
        {!isUser && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 7,
            }}
          >
            <span
              style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}
            >
              Knik AI
            </span>
            {m.model && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color: "var(--fg-4)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-1)",
                  padding: "1px 6px",
                  borderRadius: 5,
                }}
              >
                {m.model}
              </span>
            )}
            {m.at && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color: "var(--fg-5)",
                }}
              >
                {m.at}
              </span>
            )}
          </div>
        )}
        {!isUser && m.thinking && !streaming && (
          <ThinkingBlock steps={m.thinking} tool={m.tool} />
        )}
        <div
          style={{
            fontSize: 14.5,
            lineHeight: 1.6,
            color: isUser ? "var(--fg-1)" : "var(--fg-2)",
            background: isUser ? "var(--bg-surface-2)" : "transparent",
            border: isUser ? "1px solid var(--border-2)" : "none",
            borderRadius: isUser ? "var(--r-card,12px)" : 0,
            padding: isUser ? "11px 15px" : 0,
          }}
        >
          {renderInline(m.content)}
          {streaming && (
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 15,
                marginLeft: 3,
                verticalAlign: "-2px",
                background: "var(--acc, var(--aurora-400))",
                animation: "knik-pulse 0.9s ease-in-out infinite",
              }}
            />
          )}
        </div>
        {!isUser && m.code && !streaming && (
          <CodeBlock lang={m.code.lang} body={m.code.body} />
        )}
        {!isUser && !streaming && (
          <div style={{ display: "flex", gap: 1, marginTop: 8 }}>
            <IconButton
              size={30}
              icon={<MS name="content_copy" size={15} />}
              title="Copy"
            />
            <IconButton
              size={30}
              icon={<MS name="thumb_up" size={15} />}
              title="Good"
            />
            <IconButton
              size={30}
              icon={<MS name="thumb_down" size={15} />}
              title="Bad"
            />
            <IconButton
              size={30}
              icon={<MS name="refresh" size={15} />}
              title="Regenerate"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 13 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          flexShrink: 0,
          background:
            "linear-gradient(135deg, var(--acc-soft), rgba(20,184,166,0.22))",
          border: "1px solid var(--acc-border, rgba(0,217,244,0.4))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <KnikGlyph size={16} glow={false} />
      </div>
      <div
        style={{ display: "flex", gap: 5, alignItems: "center", height: 30 }}
      >
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--acc-text, var(--aurora-300))",
              animation: "knik-pulse 1.1s ease-in-out infinite",
              animationDelay: `${d}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatThread({
  messages,
  isStreaming,
  inputValue,
  onChange,
  onSend,
  model,
  onModel,
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    ref.current?.scrollTo?.({
      top: ref.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, isStreaming]);
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        ref={ref}
        className="hide-scrollbar"
        style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 26,
          }}
        >
          {messages.map((m, i) => (
            <Message
              key={i}
              m={m}
              streaming={
                isStreaming &&
                i === messages.length - 1 &&
                m.role === "assistant"
              }
            />
          ))}
          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <TypingDots />
          )}
        </div>
      </div>
      <div
        style={{
          padding: "12px 24px 24px",
          maxWidth: 860,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <InputPanel
          value={inputValue}
          onChange={onChange}
          onSend={() => onSend()}
          model={model}
          onModel={onModel}
        />
      </div>
    </div>
  );
}

Object.assign(window, {
  ChatHome,
  ChatThread,
  InputPanel,
  ModelPicker,
  SuggestionCards,
  Message,
});
