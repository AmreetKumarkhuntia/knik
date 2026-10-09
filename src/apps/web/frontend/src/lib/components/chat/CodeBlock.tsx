// The deep PrismLight and grammar paths are typed only by the package's root declarations.
/// <reference types="react-syntax-highlighter" />
import { memo } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import diff from 'react-syntax-highlighter/dist/esm/languages/prism/diff'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml'
import { CODE_SYNTAX_THEME } from '$lib/constants'
import Button from '../buttons/Button'
import MS from '../display/MS'
import type { CodeBlockProps } from '$types/components/chat'

// The full Prism build bundles ~300 grammars; register only what chat and JSON views
// render. Grammars also register their aliases (js, ts, py, sh, html…), and anything
// unregistered falls back to plain text.
for (const [name, grammar] of Object.entries({
  bash,
  css,
  diff,
  javascript,
  json,
  jsx,
  markdown,
  markup,
  python,
  sql,
  tsx,
  typescript,
  yaml,
}))
  SyntaxHighlighter.registerLanguage(name, grammar)

export default memo(function CodeBlock({
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
})
