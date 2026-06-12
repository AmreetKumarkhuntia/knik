import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  copyable?: boolean
  className?: string
}

export default function CodeBlock({
  code,
  language = 'text',
  showLineNumbers = false,
  copyable = true,
  className = '',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`bg-code border border-border-2 rounded-[10px] overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center px-3.5 py-1.5 bg-white/[0.03] border-b border-border-1">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-fg-4">
          {language}
        </span>
        <div className="ml-auto flex gap-0.5">
          {copyable && (
            <button
              onClick={handleCopy}
              className="w-7 h-7 rounded-md text-fg-3 inline-flex items-center justify-center hover:bg-surface-3 hover:text-fg-1 transition-colors duration-fast cursor-pointer"
              title="Copy"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Code Body */}
      <div className="text-[12.5px] leading-relaxed tracking-[-0.01em]">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '12px 14px',
            background: 'transparent',
            fontFamily: 'var(--font-mono)',
          }}
          lineNumberStyle={{
            minWidth: '28px',
            paddingRight: '14px',
            color: 'var(--fg-5)',
            textAlign: 'right',
            userSelect: 'none',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
