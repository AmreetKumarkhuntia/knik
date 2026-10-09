import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const sources = import.meta.glob<string>('../../lib/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// A Material Symbols glyph is a ligature word ("close", "expand_more"), so an icon span that is not
// aria-hidden leaks that word into the surrounding accessible name.
function unhiddenIcons(file: string, code: string) {
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const found: string[] = []
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const attribute = (name: string) =>
        node.attributes.properties.find(
          (item): item is ts.JsxAttribute =>
            ts.isJsxAttribute(item) && item.name.getText(source) === name
        )
      const className = attribute('className')?.initializer?.getText(source) ?? ''
      const hidden = attribute('aria-hidden')
      const hiddenValue = hidden?.initializer?.getText(source)
      if (
        className.includes('material-symbols-outlined') &&
        (!hidden || hiddenValue === '{false}' || hiddenValue === '"false"')
      ) {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart(source))
        found.push(`${file.replace('../../', 'src/')}:${line + 1}`)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

describe('Material Symbols icon accessibility', () => {
  it('detects ligature spans that are exposed to assistive tech', () => {
    expect(
      unhiddenIcons(
        'Example.tsx',
        `export const A = () => (
          <button>
            <span className="material-symbols-outlined">close</span>
            <motion.span className={\`material-symbols-outlined \${size}\`} aria-hidden={false} />
            <span className="material-symbols-outlined" aria-hidden="true">check</span>
            <span className="text-sm">close</span>
          </button>
        )`
      )
    ).toEqual(['Example.tsx:3', 'Example.tsx:4'])
  })

  it('hides every raw icon span in the component library', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(50)
    const violations = Object.entries(sources).flatMap(([file, code]) => unhiddenIcons(file, code))
    expect(violations).toEqual([])
  })
})
