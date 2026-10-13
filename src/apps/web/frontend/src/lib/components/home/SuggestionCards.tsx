import { MS } from '$components'
import Button from '$components/buttons/Button'
import type { SuggestionCardsProps } from '$types/widgets/chat-shell'

export default function SuggestionCards({ suggestions, onSelectPrompt }: SuggestionCardsProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-2.5 w-full">
      {suggestions.map((suggestion, index) => (
        <Button
          key={suggestion.id}
          variant="secondary"
          onClick={() => onSelectPrompt(suggestion.title)}
          className="knik-suggestion knik-enter-rise w-full"
          style={{ animationDelay: `${(0.08 + index * 0.07).toFixed(2)}s` }}
        >
          <span className="knik-tile text-[var(--acc-text)]">
            <MS name={suggestion.icon} size={18} />
          </span>
          <span className="min-w-0">
            <span className="block text-h4 text-fg-1">{suggestion.title}</span>
            <span className="block mt-1 text-caption font-normal text-fg-3">
              {suggestion.subtitle}
            </span>
          </span>
        </Button>
      ))}
    </div>
  )
}
