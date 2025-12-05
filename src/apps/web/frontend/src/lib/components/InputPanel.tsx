/**
 * InputPanel Component
 * Text input with send button
 */

interface InputPanelProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}

export default function InputPanel({ value, onChange, onSend, disabled }: InputPanelProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl">
      <div className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1 bg-white/20 text-white placeholder-white/50 px-5 py-3 rounded-xl 
                   focus:outline-none focus:ring-2 focus:ring-purple-400 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200"
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 
                   text-white px-8 py-3 rounded-xl font-semibold 
                   transition-all duration-200 
                   disabled:cursor-not-allowed disabled:opacity-50
                   shadow-lg hover:shadow-xl active:scale-95"
        >
          Send
        </button>
      </div>
    </div>
  )
}
