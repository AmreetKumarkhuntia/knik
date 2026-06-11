/* ChatHome.jsx — welcome hero + suggestions + composer */

function ChatHome({ inputValue, onChange, onSend }) {
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
      {/* Decorative blobs */}
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
            top: -80,
            left: "10%",
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "rgba(0,217,244,0.18)",
            filter: "blur(100px)",
            animation: "knik-blob 14s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            right: "8%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(20,184,166,0.16)",
            filter: "blur(100px)",
            animation: "knik-blob 16s ease-in-out infinite",
            animationDelay: "-4s",
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 36, maxWidth: 720 }}>
          <div
            style={{
              margin: "0 auto 22px",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(11,18,26,0.7)",
              border: "1.5px solid rgba(0,217,244,0.45)",
              boxShadow: "0 0 40px -6px rgba(0,217,244,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "knik-fade-up 500ms var(--ease-out) 100ms both",
            }}
          >
            <KnikGlyph size={34} />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(36px, 5vw, 48px)",
              fontWeight: 600,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              color: "var(--fg-1)",
              margin: 0,
              animation: "knik-fade-up 500ms var(--ease-out) 220ms both",
            }}
          >
            How can I help you{" "}
            <span
              style={{
                background:
                  "linear-gradient(95deg, var(--aurora-200), var(--aurora-400) 50%, var(--teal-400))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              today?
            </span>
          </h1>
          <p
            style={{
              marginTop: 14,
              fontSize: 16,
              color: "var(--fg-3)",
              maxWidth: 540,
              marginInline: "auto",
              animation: "knik-fade-up 500ms var(--ease-out) 320ms both",
            }}
          >
            Knik AI can assist with coding, content generation, and complex
            workflows.
          </p>
        </div>

        {/* Suggestions */}
        <SuggestionCards onSelect={(t) => onSend(t)} />
      </div>

      {/* Composer pinned bottom */}
      <div
        style={{
          padding: "16px 24px 24px",
          maxWidth: 920,
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
        />
      </div>
    </div>
  );
}

Object.assign(window, { ChatHome });
