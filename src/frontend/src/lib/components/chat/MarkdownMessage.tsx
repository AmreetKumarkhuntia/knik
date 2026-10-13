import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Children, createContext, isValidElement, memo, useContext } from 'react'
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

// onCopy travels through context so the components map can live at module scope;
// a per-render map gives React new element types and remounts every code block.
const CopyContext = createContext<MarkdownMessageProps['onCopy']>(undefined)

function MarkdownPre({ children }: ComponentProps<'pre'>) {
  const onCopy = useContext(CopyContext)
  const child = Children.toArray(children).find(isValidElement)
  if (!isValidElement<ComponentProps<'code'>>(child)) return <pre>{children}</pre>
  const language = /language-([^\s]+)/.exec(child.props.className || '')?.[1] ?? 'text'
  const code = Children.toArray(child.props.children).join('').replace(/\n$/, '')
  return <CodeBlock code={code} language={language} onCopy={onCopy} className="my-4" />
}

const remarkPlugins = [remarkGfm]

const components: Components = {
  pre: MarkdownPre,
  code({ children, className }) {
    return (
      <code
        className={`font-mono px-1.5 py-px rounded-xs bg-panel-2 border border-border-1 text-fg-1 ${className || ''}`}
        style={{ fontSize: '0.9em' }}
      >
        {children}
      </code>
    )
  },
  p({ children }) {
    return <p className="mb-3 last:mb-0 text-body-lg leading-[1.65]">{children}</p>
  },
  ul({ children }) {
    return (
      <ul className="list-disc list-outside pl-[22px] mb-3 flex flex-col gap-1.5 text-body-lg">
        {children}
      </ul>
    )
  },
  ol({ children }) {
    return (
      <ol className="list-decimal list-outside pl-[22px] mb-3 flex flex-col gap-1.5 text-body-lg">
        {children}
      </ol>
    )
  },
  li({ children }) {
    return <li className="leading-[1.65] marker:text-fg-3">{children}</li>
  },
  h1({ children }) {
    return <h1 className="text-h2 text-fg-1 mb-3 mt-6 first:mt-0">{children}</h1>
  },
  h2({ children }) {
    return <h2 className="text-h3 text-fg-1 mb-2.5 mt-5 first:mt-0">{children}</h2>
  },
  h3({ children }) {
    return <h3 className="text-h4 text-fg-1 mb-2 mt-4 first:mt-0">{children}</h3>
  },
  a({ children, href }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--acc-text)] underline underline-offset-2 decoration-[var(--acc-border)] hover:decoration-current transition-colors duration-base"
      >
        {children}
      </a>
    )
  },
  strong({ children }) {
    return <strong className="font-semibold text-fg-1">{children}</strong>
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-border-2 pl-4 py-1 mb-3 text-fg-3">
        {children}
      </blockquote>
    )
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto mb-3 rounded-[14px] border border-border-1">
        <TableRoot className="min-w-full">{children}</TableRoot>
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
      <TableHeaderCell className="px-3.5 py-2 text-left text-caption font-semibold text-fg-3 bg-panel">
        {children}
      </TableHeaderCell>
    )
  },
  td({ children }) {
    return (
      <TableCell className="px-3.5 py-2 text-body-sm text-fg-2 border-t border-border-1">
        {children}
      </TableCell>
    )
  },
}

/** Renders markdown content with syntax-highlighted code blocks. */
export const MarkdownMessage = memo(function MarkdownMessage({
  content,
  isStreaming,
  onCopy,
}: MarkdownMessageProps) {
  return (
    // Outer block margins are trimmed so every reply ends flush, whichever block closes it.
    <div className="max-w-none text-fg-1 overflow-hidden [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <CopyContext.Provider value={onCopy}>
        <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
          {content}
        </ReactMarkdown>
      </CopyContext.Provider>
      {isStreaming && <span className="knik-caret" aria-hidden="true" />}
    </div>
  )
})
