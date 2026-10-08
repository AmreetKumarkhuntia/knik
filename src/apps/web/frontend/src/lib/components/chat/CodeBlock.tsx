import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
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
      <div className="flex items-center px-3.5 py-1.5 bg-white/[0.03] border-b border-border-1">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-fg-4">
          {language}
        </span>
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
      <div className="text-[12.5px] leading-relaxed tracking-[-0.01em] overflow-auto">
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
