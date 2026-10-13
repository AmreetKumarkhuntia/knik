import KnikGlyph from '$components/display/KnikGlyph'

export default function WelcomePrompt() {
  return (
    <div className="knik-enter-rise">
      <div className="inline-flex items-center h-7 px-2.5 mb-[22px] rounded-pill bg-[var(--acc-soft)] border border-[var(--acc-border)]">
        <KnikGlyph size={24} animated />
        <span className="ml-2 text-micro font-semibold uppercase tracking-[.06em] text-[var(--acc-text)]">
          Knik AI
        </span>
      </div>
      <h1 className="text-display text-fg-1 [text-wrap:pretty]">How can I help you today?</h1>
      <p className="mt-2.5 text-body-lg text-fg-3">Start a conversation or choose a suggestion.</p>
    </div>
  )
}
