import type { CSSProperties } from 'react'

export const CODE_SYNTAX_THEME: Record<string, CSSProperties> = {
  'code[class*="language-"]': { color: 'var(--fg-1)', textShadow: 'none' },
  'pre[class*="language-"]': { color: 'var(--fg-1)', textShadow: 'none' },
  comment: { color: 'var(--fg-3)' },
  prolog: { color: 'var(--fg-3)' },
  doctype: { color: 'var(--fg-3)' },
  punctuation: { color: 'var(--fg-3)' },
  keyword: { color: 'var(--info)' },
  boolean: { color: 'var(--info)' },
  number: { color: 'var(--acc-text)' },
  string: { color: 'var(--acc-text)' },
  char: { color: 'var(--acc-text)' },
  'attr-value': { color: 'var(--acc-text)' },
  function: { color: 'var(--warning)' },
  'class-name': { color: 'var(--warning)' },
  property: { color: 'var(--info)' },
  tag: { color: 'var(--info)' },
  deleted: { color: 'var(--danger)' },
  inserted: { color: 'var(--success)' },
}
