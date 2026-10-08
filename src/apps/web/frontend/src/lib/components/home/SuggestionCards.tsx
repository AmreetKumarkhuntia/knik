import { MS } from '$components'
import Button from '$components/buttons/Button'
import type { SuggestionCardsProps } from '$types/widgets/chat-shell'

export default function SuggestionCards({ suggestions, onSelectPrompt }: SuggestionCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
      {suggestions.map(suggestion => (
        <Button
          key={suggestion.id}
          variant="secondary"
          onClick={() => onSelectPrompt(suggestion.title)}
          className="w-full justify-start text-left h-auto px-3 py-3 gap-3"
        >
          <MS name={suggestion.icon} size={18} className="text-fg-3 shrink-0" />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-fg-1">{suggestion.title}</span>
            <span className="block mt-1 text-xs font-normal text-fg-3">{suggestion.subtitle}</span>
          </span>
        </Button>
      ))}
    </div>
  )
}
