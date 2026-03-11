import { useState } from 'react'
import type { WorkflowNavbarProps } from '$types/sections/workflow-builder'

export default function WorkflowNavbar({
  onSave,
  onExecute,
  readOnly = false,
  userAvatar,
}: WorkflowNavbarProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (onSave) {
        void onSave()
      }
    } finally {
      setTimeout(() => setIsSaving(false), 500)
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-borderLight bg-surfaceGlass backdrop-blur-md px-6 py-3 z-20">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-purple to-accent-teal p-0.5">
          <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-background-dark">
            <span className="material-symbols-outlined text-accent-teal">hub</span>
          </div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold leading-tight tracking-tight text-text">
            Workflow Builder
          </h1>
          <p className="text-xs text-textSecondary">Design and automate your processes</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium text-textSecondary">
          <span className="size-2 rounded-full bg-accent-teal animate-pulse"></span>
          Live Sync Enabled
        </div>

        {!readOnly && (
          <>
            {onExecute && (
              <button
                onClick={() => void onExecute()}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-teal px-5 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                <span>Execute</span>
              </button>
            )}

            {onSave && (
              <button
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-teal px-5 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">
                  {isSaving ? 'sync' : 'save'}
                </span>
                <span>{isSaving ? 'Saving...' : 'Save Workflow'}</span>
              </button>
            )}
          </>
        )}

        {userAvatar ? (
          <div className="h-10 w-10 rounded-full bg-surface border-2 border-accent-purple/30 p-0.5">
            <img
              className="h-full w-full rounded-full object-cover"
              src={userAvatar}
              alt="User avatar"
            />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-teal flex items-center justify-center text-white font-bold">
            AK
          </div>
        )}
      </div>
    </header>
  )
}
