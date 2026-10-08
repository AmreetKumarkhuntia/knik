import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { CODE_SYNTAX_THEME } from '$lib/constants'
import Button from '../buttons/Button'
import MS from '../display/MS'
import type { CodeBlockProps } from '$types/components/chat'

export default function CodeBlock({
  code,
  language = 'text',
  showLineNumbers = false,
  copyable = true,
  copied = false,
  onCopy,
  className = '',
}: CodeBlockProps) {
  return (
    <div className={`bg-code border border-border-2 rounded-[10px] overflow-hidden ${className}`}>
      <div className="flex items-center px-3.5 py-1.5 bg-surface-2 border-b border-border-1">
        <span className="font-mono text-xs text-fg-3">{language}</span>
        {copyable && onCopy && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onCopy(code)}
            aria-label={copied ? 'Copied code' : 'Copy code'}
            className="ml-auto"
          >
            <MS name={copied ? 'check' : 'content_copy'} size={15} />
          </Button>
        )}
      </div>
      <div className="text-[13px] leading-relaxed tracking-[-0.01em] overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={CODE_SYNTAX_THEME}
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
            color: 'var(--fg-3)',
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
