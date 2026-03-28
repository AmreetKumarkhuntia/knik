import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Components } from 'react-markdown'
import type { MarkdownMessageProps, CodeProps } from '$types/components'

/** Renders markdown content with syntax-highlighted code blocks. */
export function MarkdownMessage({ content, isStreaming }: MarkdownMessageProps) {
  const components: Components = {
    code(props: CodeProps) {
      const match = /language-(\w+)/.exec(props.className || '')
      return !props.inline && match ? (
        <div className="my-4 rounded-md overflow-hidden bg-code border border-border">
          <div className="flex items-center px-4 py-2 bg-surface/50 border-b border-border text-xs text-foreground/50">
            {match[1]}
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus as unknown as React.CSSProperties}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, background: 'transparent' }}
            {...props}
          >
            {String(props.children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code
          className="px-1.5 py-0.5 rounded-md bg-surfaceRaised text-foreground/90 font-mono text-sm"
          {...props}
        >
          {props.children}
        </code>
      )
    },
    p({ children }) {
      return <p className="mb-4 last:mb-0 leading-relaxed text-base">{children}</p>
    },
    ul({ children }) {
      return <ul className="list-disc list-inside mb-4 space-y-2 text-base">{children}</ul>
    },
    ol({ children }) {
      return <ol className="list-decimal list-inside mb-4 space-y-2 text-base">{children}</ol>
    },
    li({ children }) {
      return <li className="leading-relaxed">{children}</li>
    },
    h1({ children }) {
      return <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>
    },
    h2({ children }) {
      return <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h2>
    },
    h3({ children }) {
      return <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h3>
    },
    a({ children, href }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-info hover:text-info/80 underline underline-offset-2"
        >
          {children}
        </a>
      )
    },
    strong({ children }) {
      return <strong className="font-bold text-foreground">{children}</strong>
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-border pl-4 py-1 mb-4 my-2 text-foreground/70 italic">
          {children}
        </blockquote>
      )
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full divide-y divide-border">{children}</table>
        </div>
      )
    },
    th({ children }) {
      return (
        <th className="px-4 py-2 text-left text-sm font-semibold text-foreground/80">{children}</th>
      )
    },
    td({ children }) {
      return <td className="px-4 py-2 text-sm border-t border-border">{children}</td>
    },
  }

  return (
    <div className="max-w-none text-foreground overflow-hidden">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-0.5 h-5 bg-foreground/80 ml-1 mt-1 animate-pulse align-middle" />
      )}
    </div>
  )
}
