import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Children, isValidElement } from 'react'
import type { ComponentProps } from 'react'
import CodeBlock from './CodeBlock'
import {
  TableRoot,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '../display/TableParts'
import type { Components } from 'react-markdown'
import type { MarkdownMessageProps } from '$types/components'

/** Renders markdown content with syntax-highlighted code blocks. */
export function MarkdownMessage({ content, isStreaming, onCopy }: MarkdownMessageProps) {
  const components: Components = {
    pre({ children }) {
      const child = Children.toArray(children).find(isValidElement)
      if (!isValidElement<ComponentProps<'code'>>(child)) return <pre>{children}</pre>
      const language = /language-([^\s]+)/.exec(child.props.className || '')?.[1] ?? 'text'
      const code = Children.toArray(child.props.children).join('').replace(/\n$/, '')
      return <CodeBlock code={code} language={language} onCopy={onCopy} className="my-4" />
    },
    code({ children, className }) {
      return (
        <code
          className={`px-1.5 py-0.5 rounded-md bg-surface-2 text-fg-2 font-mono text-sm ${className || ''}`}
        >
          {children}
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
          className="text-[var(--info)] hover:opacity-80 underline underline-offset-2"
        >
          {children}
        </a>
      )
    },
    strong({ children }) {
      return <strong className="font-bold text-fg-1">{children}</strong>
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-[var(--border-2)] pl-4 py-1 mb-4 my-2 text-fg-3 italic">
          {children}
        </blockquote>
      )
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto mb-4">
          <TableRoot className="min-w-full divide-y divide-[var(--border-2)]">{children}</TableRoot>
        </div>
      )
    },
    thead({ children }) {
      return <TableHead>{children}</TableHead>
    },
    tbody({ children }) {
      return <TableBody>{children}</TableBody>
    },
    tr({ children }) {
      return <TableRow>{children}</TableRow>
    },
    th({ children }) {
      return (
        <TableHeaderCell className="px-4 py-2 text-left text-sm font-semibold text-fg-2">
          {children}
        </TableHeaderCell>
      )
    },
    td({ children }) {
      return (
        <TableCell className="px-4 py-2 text-sm border-t border-[var(--border-2)]">
          {children}
        </TableCell>
      )
    },
  }

  return (
    <div className="max-w-none text-fg-2 overflow-hidden">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-0.5 h-5 bg-[var(--primary)] ml-1 mt-1 animate-pulse align-middle" />
      )}
    </div>
  )
}
