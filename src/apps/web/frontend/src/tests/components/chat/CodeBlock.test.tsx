import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import CodeBlock from '$components/chat/CodeBlock'

describe('CodeBlock', () => {
  it.each([
    ['tsx', 'const view = <Panel open />'],
    ['ts', 'const total: number = 1'],
    ['python', 'def run():\n    return None'],
    ['sh', 'echo "ready"'],
    ['json', '{"ok": true}'],
  ])('highlights the registered %s grammar', (language, code) => {
    const { container } = render(<CodeBlock code={code} language={language} />)
    expect(container.querySelector('.token')).not.toBeNull()
  })

  it.each([
    ['cobol', 'IDENTIFICATION DIVISION.'],
    ['text', 'plain words only'],
  ])('renders %s as plain text because only app grammars are bundled', (language, code) => {
    const { container } = render(<CodeBlock code={code} language={language} />)
    expect(container.querySelector('code')).toHaveTextContent(code)
    expect(container.querySelector('.token')).toBeNull()
  })
})
