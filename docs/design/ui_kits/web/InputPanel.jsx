/* InputPanel.jsx — glass composer with attach / mic / send */

function InputPanel({ value, onChange, onSend, disabled, autoFocus = false }) {
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

  React.useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
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
          border: `1px solid ${focused ? "rgba(0,217,244,0.45)" : "var(--border-2)"}`,
          borderRadius: 14,
          padding: "10px 12px 10px 14px",
          transition: "all 200ms var(--ease-out)",
          boxShadow: focused ? "0 0 0 3px rgba(0,217,244,0.10)" : "none",
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
          disabled={disabled}
          style={{
            width: "100%",
            minHeight: 28,
            maxHeight: 200,
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
            fontSize: 14.5,
            lineHeight: 1.5,
            padding: "6px 0",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <IconButton
            title="Attach"
            icon={<MS name="attach_file" size={18} />}
          />
          <IconButton title="Voice" icon={<MS name="mic" size={18} />} />
          <div style={{ flex: 1 }} />
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--aurora-400)",
              color: "var(--on-primary)",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                value.trim() && !disabled
                  ? "0 6px 22px -6px rgba(0,217,244,0.65), 0 1px 0 rgba(255,255,255,0.20) inset"
                  : "none",
              opacity: !value.trim() || disabled ? 0.4 : 1,
              transition: "all 220ms var(--ease-out)",
            }}
          >
            <MS name="send" size={18} fill={1} />
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
        <Kbd>⌘</Kbd> <Kbd>K</Kbd> focus &middot; <Kbd>Enter</Kbd> send &middot;{" "}
        <Kbd>⇧ Enter</Kbd> newline
      </div>
    </div>
  );
}

function Kbd({ children }) {
  return (
    <span
      style={{
        background: "var(--bg-surface-3)",
        border: "1px solid var(--border-2)",
        borderRadius: 4,
        padding: "1px 5px",
        color: "var(--fg-3)",
      }}
    >
      {children}
    </span>
  );
}

Object.assign(window, { InputPanel, Kbd });
