/**
 * TopBar Component
 * App title and status
 */

interface TopBarProps {
  isLoading?: boolean
}

export default function TopBar({ isLoading }: TopBarProps) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-5 shadow-2xl border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-teal-400 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Knik AI Assistant</h1>
        </div>
        
        {isLoading && (
          <div className="flex items-center gap-2 text-white/90 bg-white/10 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Processing...</span>
          </div>
        )}
      </div>
    </div>
  )
}
