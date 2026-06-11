/* SuggestionCards.jsx */

const knikSuggestions = [
  {
    icon: "code",
    title: "Refactor my Python script",
    subtitle: "Optimize performance and readability",
  },
  {
    icon: "edit_note",
    title: "Write a blog post outline",
    subtitle: "On the future of AI in healthcare",
  },
  {
    icon: "bug_report",
    title: "Debug my React component",
    subtitle: "Fix state management issues",
  },
  {
    icon: "description",
    title: "Create API documentation",
    subtitle: "For REST endpoints",
  },
];

function SuggestionCards({ onSelect }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 14,
        maxWidth: 720,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {knikSuggestions.map((s, i) => (
        <Card
          key={i}
          hoverable
          onClick={() => onSelect(s.title)}
          style={{
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
            padding: 16,
            cursor: "pointer",
            animation: `knik-fade-up 380ms var(--ease-out) ${300 + i * 70}ms both`,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              background: "rgba(0,217,244,0.12)",
              color: "var(--aurora-300)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MS name={s.icon} size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--fg-1)",
                letterSpacing: "-0.012em",
              }}
            >
              {s.title}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>
              {s.subtitle}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

Object.assign(window, { SuggestionCards, knikSuggestions });
