import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useState } from 'react'
import LoadingSpinner from '$components/LoadingSpinner'
import type { StructuredOutputProps } from '$types/components'

export default function StructuredOutput({ inputs, outputs, loading }: StructuredOutputProps) {
  const [activeTab, setActiveTab] = useState<'inputs' | 'outputs'>('outputs')
  const [copied, setCopied] = useState(false)

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-foreground text-xl font-bold">Structured Output</h2>
        <div className="flex items-center justify-center py-12 glass border border-border rounded-xl">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const currentData = activeTab === 'inputs' ? inputs : outputs
  const jsonString = JSON.stringify(currentData, null, 2)

  const handleCopy = () => {
    void navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-xl font-bold">Structured Output</h2>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surfaceRaised rounded-lg text-sm transition-colors text-secondary"
        >
          <span className="material-symbols-outlined text-sm">
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('outputs')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'outputs'
              ? 'text-primary border-b-2 border-primary'
              : 'text-secondary hover:text-subtle'
          }`}
        >
          Outputs
        </button>
        <button
          onClick={() => setActiveTab('inputs')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'inputs'
              ? 'text-primary border-b-2 border-primary'
              : 'text-secondary hover:text-subtle'
          }`}
        >
          Inputs
        </button>
      </div>

      <div className="glass border border-border rounded-xl overflow-hidden max-h-[600px] overflow-y-auto">
        <SyntaxHighlighter
          language="json"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent',
            fontSize: '0.875rem',
          }}
          showLineNumbers
        >
          {jsonString}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
