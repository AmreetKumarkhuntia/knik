/* ChatThread.jsx — message stream + composer */

function ChatThread({
  messages,
  isStreaming,
  inputValue,
  onChange,
  onSend,
  onReset,
}) {
  const endRef = React.useRef(null);
  React.useEffect(() => {
    endRef.current?.scrollTo?.({
      top: endRef.current.scrollHeight,
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
        ref={endRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {messages.map((m, i) => (
            <Message
              key={i}
              message={m}
              streaming={
                isStreaming &&
                i === messages.length - 1 &&
                m.role === "assistant"
              }
            />
          ))}
          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <TypingIndicator />
          )}
        </div>
      </div>
      <div
        style={{
          padding: "16px 24px 24px",
          maxWidth: 920,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <InputPanel
          value={inputValue}
          onChange={onChange}
          onSend={() => onSend()}
        />
      </div>
    </div>
  );
}

function Message({ message, streaming }) {
  const isUser = message.role === "user";
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexDirection: isUser ? "row-reverse" : "row",
        animation: `${isUser ? "knik-slide-r" : "knik-slide-l"} 320ms var(--ease-out) both`,
      }}
    >
      <Avatar role={message.role} />
      <div style={{ maxWidth: "78%" }}>
        <div
          style={{
            fontSize: 14.5,
            lineHeight: 1.55,
            color: "var(--fg-2)",
            whiteSpace: "pre-wrap",
          }}
        >
          {renderInline(message.content)}
          {streaming && (
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 14,
                marginLeft: 3,
                verticalAlign: "-2px",
                background: "var(--aurora-400)",
                animation: "knik-pulse 0.9s ease-in-out infinite",
              }}
            />
          )}
        </div>
        {!isUser && !streaming && (
          <div style={{ display: "flex", gap: 2, marginTop: 6 }}>
            <IconButton
              size={28}
              icon={<MS name="content_copy" size={14} />}
              title="Copy"
            />
            <IconButton
              size={28}
              icon={<MS name="thumb_up" size={14} />}
              title="Like"
            />
            <IconButton
              size={28}
              icon={<MS name="refresh" size={14} />}
              title="Regenerate"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ role }) {
  if (role === "user") {
    return (
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "var(--bg-surface-3)",
          color: "var(--fg-2)",
          flexShrink: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        AR
      </div>
    );
  }
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        background:
          "linear-gradient(135deg, rgba(0,217,244,0.22), rgba(20,184,166,0.22))",
        border: "1px solid rgba(0,217,244,0.40)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <KnikGlyph size={16} glow={false} />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Avatar role="assistant" />
      <div
        style={{ display: "flex", gap: 4, alignItems: "center", height: 28 }}
      >
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </div>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "var(--aurora-300)",
        animation: "knik-pulse 1.1s ease-in-out infinite",
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

/** Tiny inline renderer: turns `code` into a styled span; everything else plain. */
function renderInline(text) {
  if (!text) return null;
  const parts = String(text).split(/(`[^`]+`)/g);
  return parts.map((p, i) =>
    p.startsWith("`") && p.endsWith("`") ? (
      <code
        key={i}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.92em",
          background: "var(--bg-code)",
          color: "var(--aurora-300)",
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
}

Object.assign(window, { ChatThread, Message, TypingIndicator, renderInline });
