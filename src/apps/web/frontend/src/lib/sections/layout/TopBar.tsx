/**
 * TopBar Component
 * App title and status
 */

import type { TopBarProps } from '$types/sections/layout'

export default function TopBar({ isLoading }: TopBarProps) {
  return (
    <div className="bg-surface/50 backdrop-blur-lg rounded-3xl p-5 shadow-2xl border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-teal-400 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-wide">Knik AI Assistant</h1>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-foreground/90 bg-surface px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Processing...</span>
          </div>
        )}
      </div>
    </div>
  )
}
