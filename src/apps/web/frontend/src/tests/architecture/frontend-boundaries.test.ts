import { Linter } from 'eslint'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import { createFrontendArchitecture } from '../../../eslint/frontend-boundaries.mjs'

const root = '/architecture-fixture'

function lint(
  code: string,
  file = 'src/lib/components/Example.tsx',
  files: Record<string, string> = {}
) {
  const virtual = new Map(Object.entries(files).map(([name, text]) => [`${root}/${name}`, text]))
  const plugin = createFrontendArchitecture({
    rootDir: root,
    fileExists: name => virtual.has(name),
    readFile: name => {
      const text = virtual.get(name)
      if (text === undefined) throw new Error('Missing virtual source')
      return text
    },
  })
  return new Linter({ cwd: root }).verify(
    code,
    [
      {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
          parser: tseslint.parser,
          globals: globals.browser,
          parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
        },
        plugins: { architecture: plugin },
        rules: {
          'architecture/data-ownership': 'error',
          'architecture/canonical-controls': 'error',
          'architecture/frontend-only-io': 'error',
        },
      },
    ],
    { filename: `${root}/${file}` }
  )
}

describe('frontend dependency ownership', () => {
  it.each([
    '$widgets/session/useDemoSession',
    '../widgets/session/useDemoSession',
    '$lib/widgets/settings/SettingsWidget',
    '$sections/settings/Pane',
    '$pages/Settings',
    '$store',
    '$services/theme',
    '$hooks/useTheme',
    '$constants/demoData',
  ])('rejects component imports of %s', target => {
    expect(
      lint(`import value from '${target}'`).some(
        message => message.ruleId === 'architecture/data-ownership'
      )
    ).toBe(true)
  })

  it('follows named re-exports and imported aliases through barrels', () => {
    const files = {
      'src/lib/utils/index.ts': "export { session as helper } from '../constants/access'",
      'src/lib/constants/access.ts':
        "import { useDemoSession as session } from '../widgets/session/useDemoSession'; export { session }",
      'src/lib/widgets/session/useDemoSession.ts': 'export const useDemoSession = () => null',
    }
    const errors = lint("import { helper } from '$utils'", 'src/lib/components/Example.tsx', files)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('widgets/session/useDemoSession')
  })

  it('follows export-star barrels and checks re-export declarations directly', () => {
    const files = { 'src/lib/utils/index.ts': "export * from '../widgets/session/store'" }
    expect(
      lint("import { store } from '$utils'", 'src/lib/components/Example.tsx', files)
    ).toHaveLength(1)
    expect(
      lint("export { SettingsWidget } from '$widgets/settings'", 'src/lib/components/index.ts')
    ).toHaveLength(1)
    expect(lint("export * from '$pages'", 'src/lib/widgets/index.ts')).toHaveLength(1)
  })

  it('permits a public feature widget without exposing another barrel export', () => {
    const files = {
      'src/lib/widgets/index.ts':
        "export { default as SettingsWidget } from './settings/SettingsWidget'; export { useDemoSession } from './session/useDemoSession'",
      'src/lib/widgets/settings/SettingsWidget.tsx':
        "import { useDemoSession } from '../session/useDemoSession'; export default function SettingsWidget() { return null }",
      'src/lib/widgets/session/useDemoSession.ts': 'export const useDemoSession = () => null',
    }
    expect(
      lint("import { SettingsWidget } from '$widgets'", 'src/lib/pages/Settings.tsx', files)
    ).toHaveLength(0)
    expect(
      lint("import { useDemoSession } from '$widgets'", 'src/lib/pages/Settings.tsx', files)
    ).toHaveLength(1)
  })

  it('allows the public session provider but blocks its implementation and store', () => {
    const files = {
      'src/lib/widgets/session/index.ts':
        "export { DemoSessionProvider } from './DemoSessionProvider'",
    }
    expect(
      lint("import { DemoSessionProvider } from '$widgets/session'", 'src/App.tsx', files)
    ).toHaveLength(0)
    expect(
      lint(
        "import { DemoSessionProvider } from '$widgets/session/DemoSessionProvider'",
        'src/App.tsx',
        files
      )
    ).toHaveLength(1)
    expect(
      lint(
        "import { useDemoSession } from '../widgets/session/useDemoSession'",
        'src/lib/pages/Home.tsx'
      )
    ).toHaveLength(1)
    expect(lint("import * as session from '$widgets/session'", 'src/App.tsx', files)).toHaveLength(
      1
    )
  })

  it('keeps types and pure utilities below runtime UI while permitting shared type contracts', () => {
    expect(
      lint(
        "import type { DemoSession } from '$types/demo-session'; import type { FormRowProps } from '$types/widgets'"
      )
    ).toHaveLength(0)
    expect(
      lint(
        "import type { StoreApi } from 'zustand/vanilla'; import type { ReactNode } from 'react'",
        'src/types/demo-session.ts'
      )
    ).toHaveLength(0)
    expect(lint("import { useState } from 'react'", 'src/lib/utils/format.ts')).toHaveLength(1)
    expect(
      lint(
        "export { default as Button } from '$components/buttons/Button'",
        'src/lib/constants/index.ts'
      )
    ).toHaveLength(1)
    expect(
      lint("import { createStore } from 'zustand/vanilla'", 'src/lib/widgets/session/store.ts')
    ).toHaveLength(0)
    expect(lint("import { createStore } from 'zustand/vanilla'", 'src/App.tsx')).toHaveLength(1)
  })

  it('checks dynamic imports and network client modules', () => {
    expect(lint("const module = import('$widgets/session/store')")).toHaveLength(1)
    expect(
      lint("import axios from 'axios'", 'src/lib/widgets/settings/SettingsWidget.tsx')
    ).toHaveLength(1)
  })
})

describe('canonical native controls', () => {
  it.each([
    '<button />',
    '<motion.button />',
    'React.createElement("button")',
    'motion.create("button")',
  ])('rejects a second button implementation: %s', code => {
    expect(lint(`const element = ${code}`).some(message => message.messageId === 'button')).toBe(
      true
    )
  })
  it('allows buttons only in Button and table elements only in TableParts', () => {
    expect(
      lint('const element = <button />', 'src/lib/components/buttons/Button.tsx')
    ).toHaveLength(0)
    expect(
      lint(
        'const element = <table><tbody><tr><td /></tr></tbody></table>',
        'src/lib/components/display/TableParts.tsx'
      )
    ).toHaveLength(0)
    expect(
      lint('const element = <table><tbody><tr><td /></tr></tbody></table>').filter(
        message => message.messageId === 'table'
      )
    ).toHaveLength(4)
    expect(lint('const element = <Table><TableRow><TableCell /></TableRow></Table>')).toHaveLength(
      0
    )
  })
})

describe('frontend browser I/O restrictions', () => {
  it('blocks catalog GETs in widgets as well as presentation components', () => {
    for (const file of [
      'src/lib/widgets/session/catalog.ts',
      'src/lib/widgets/session/useSettingsCatalog.ts',
      'src/lib/components/Example.tsx',
    ]) {
      expect(
        lint("fetch('/api/admin/providers', { method: 'GET' })", file).some(
          message => message.messageId === 'transport'
        )
      ).toBe(true)
    }
  })

  it.each([
    "fetch('/api/chat')",
    "window['fetch']('/api/chat')",
    'new XMLHttpRequest()',
    "new WebSocket('wss://example.invalid')",
    "new EventSource('/api/events')",
    'navigator.mediaDevices.getUserMedia({ audio: true })',
    "navigator.sendBeacon('/api/telemetry', '{}')",
    "const { fetch: request } = globalThis; request('/api/chat')",
  ])('blocks application transports: %s', code => {
    expect(
      lint(code, 'src/lib/widgets/Example.tsx').some(message => message.messageId === 'transport')
    ).toBe(true)
  })

  it.each([
    "localStorage.getItem('theme')",
    "window.sessionStorage.setItem('x', 'y')",
    'const cache = window.localStorage; cache.clear()',
    'indexedDB.open("session")',
    'document.cookie = "x=y"',
  ])('blocks persistence: %s', code => {
    expect(
      lint(code, 'src/lib/widgets/Example.tsx').some(message => message.messageId === 'storage')
    ).toBe(true)
  })

  it.each([
    "navigator.clipboard.writeText('copy')",
    "const { clipboard } = navigator; clipboard.writeText('copy')",
    'URL.createObjectURL(new Blob())',
    "new Audio('/demo/voice.ogg')",
    'window.open("/export")',
  ])('keeps browser operations out of components: %s', code => {
    expect(lint(code).some(message => message.messageId === 'component')).toBe(true)
    expect(lint(code, 'src/lib/widgets/Example.tsx')).toHaveLength(0)
  })

  it('allows component focus/layout work and does not confuse shadowed names or type members with globals', () => {
    expect(
      lint("document.querySelector('input')?.focus(); document.body.style.overflow = 'hidden'")
    ).toHaveLength(0)
    expect(lint("const fetch = () => 1; fetch(); const value = { fetch: 'label' }")).toHaveLength(0)
    expect(
      lint(
        'interface TransportLabel { fetch: string; localStorage: boolean }',
        'src/types/example.ts'
      )
    ).toHaveLength(0)
  })

  it('exempts test fixtures and test spies from application restrictions', () => {
    expect(
      lint(
        "fetch('/api/forbidden'); localStorage.clear(); const button = <button />; import { useDemoSession } from '$widgets/session/useDemoSession'",
        'src/tests/architecture/example.test.tsx'
      )
    ).toHaveLength(0)
  })
})
