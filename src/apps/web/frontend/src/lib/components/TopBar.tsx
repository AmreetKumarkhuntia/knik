/**
 * TopBar Component
 * App title and status
 */

interface TopBarProps {
  isLoading?: boolean
}

export default function TopBar({ isLoading }: TopBarProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🤖</span>
          <h1 className="text-2xl font-bold text-white">Knik AI Assistant</h1>
        </div>
        
        {isLoading && (
          <div className="flex items-center gap-2 text-white/80">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm">Processing...</span>
          </div>
        )}
      </div>
    </div>
  )
}
