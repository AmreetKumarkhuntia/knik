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
    '$stores/chat',
    '$stores/chat/hooks',
    '$lib/stores/chat/store',
    '../stores/chat/hooks',
    '$widgets/settings',
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

  it('follows named aliases and star re-exports through unrelated barrels', () => {
    const files = {
      'src/lib/utils/index.ts': "export { session as helper } from '../constants/access'",
      'src/lib/constants/access.ts':
        "import { useChatStore as session } from '../stores/chat/hooks'; export { session }",
      'src/lib/stores/chat/hooks.ts': 'export const useChatStore = () => null',
    }
    expect(
      lint("import { helper } from '$utils'", 'src/lib/components/Example.tsx', files)
    ).toHaveLength(1)
    const stars = { 'src/lib/utils/index.ts': "export * from '../stores/chat/store'" }
    expect(
      lint("import { store } from '$utils'", 'src/lib/components/Example.tsx', stars)
    ).toHaveLength(1)
    expect(lint("export * from '$pages'", 'src/lib/widgets/index.ts')).toHaveLength(1)
  })

  it('permits composition of public widgets while blocking leaked store hooks', () => {
    const files = {
      'src/lib/widgets/index.ts':
        "export { default as SettingsWidget } from './settings/SettingsWidget'; export { useChatStore } from '../stores/chat'",
      'src/lib/widgets/settings/SettingsWidget.tsx':
        "import { useChatStore } from '$stores/chat'; export default function SettingsWidget() { return null }",
    }
    expect(
      lint("import { SettingsWidget } from '$widgets'", 'src/lib/pages/Settings.tsx', files)
    ).toHaveLength(0)
    expect(
      lint("import { useChatStore } from '$widgets'", 'src/lib/pages/Settings.tsx', files)
    ).toHaveLength(1)
  })

  it('allows only the public provider in composition', () => {
    const files = {
      'src/lib/stores/index.ts': "export { StoresProvider } from './session/StoresProvider'",
    }
    expect(lint("import { StoresProvider } from '$stores'", 'src/App.tsx', files)).toHaveLength(0)
    expect(
      lint("import { StoresProvider } from '$stores/session/StoresProvider'", 'src/App.tsx', files)
    ).toHaveLength(1)
    expect(lint("import * as stores from '$stores'", 'src/App.tsx', files)).toHaveLength(1)
    expect(
      lint("import { useChatStore } from '$stores/chat'", 'src/lib/pages/Home.tsx')
    ).toHaveLength(1)
  })

  it.each(['$stores/chat', '$stores/views', '../../stores/workflows'])(
    'allows widgets to consume public domain/view hooks: %s',
    target => {
      expect(
        lint(`import { useView } from '${target}'`, 'src/lib/widgets/chat/ChatWidget.tsx')
      ).toHaveLength(0)
    }
  )

  it('follows public domain exports while allowing their actual hook origins', () => {
    const files = {
      'src/lib/stores/chat/index.ts': "export { useChatStore as useChat } from './hooks'",
      'src/lib/stores/chat/hooks.ts': 'export const useChatStore = () => null',
      'src/lib/stores/views/index.ts': "export { useChatView } from './chat'",
      'src/lib/stores/views/chat.ts': 'export const useChatView = () => null',
    }
    expect(
      lint(
        "import { useChat as readChat } from '$stores/chat'; import { useChatView } from '$stores/views'",
        'src/lib/widgets/chat/ChatWidget.tsx',
        files
      )
    ).toHaveLength(0)
    expect(
      lint("import * as chat from '$stores/chat'", 'src/lib/widgets/chat/ChatWidget.tsx', files)
    ).toHaveLength(0)
    expect(
      lint(
        "import { useChatStore } from '$stores/chat/hooks'",
        'src/lib/widgets/chat/ChatWidget.tsx',
        files
      )
    ).toHaveLength(1)
  })

  it.each([
    ["export { createChatStore } from './store'", 'createChatStore'],
    ["export { createChatStore as useChatStore } from './store'", 'useChatStore'],
    ["export * from './store'", '*'],
    ["export { useChatStore } from './hooks'", 'useChatStore'],
  ])('rejects raw factories hidden behind public exports: %s', (barrel, imported) => {
    const files = {
      'src/lib/stores/chat/index.ts': barrel,
      'src/lib/stores/chat/hooks.ts':
        "import { createChatStore as useChatStore } from './store'; export { useChatStore }",
      'src/lib/stores/chat/store.ts': 'export const createChatStore = () => null',
    }
    const code =
      imported === '*'
        ? "import * as chat from '$stores/chat'"
        : `import { ${imported} } from '$stores/chat'`
    expect(lint(code, 'src/lib/widgets/chat/ChatWidget.tsx', files)).toHaveLength(1)
  })

  it('preserves type-only public imports without treating them as runtime hooks', () => {
    expect(
      lint("import type { ChatState } from '$stores/chat'", 'src/lib/widgets/chat/ChatWidget.tsx')
    ).toHaveLength(0)
    expect(
      lint("import { type ChatState } from '$stores/chat'", 'src/lib/widgets/chat/ChatWidget.tsx')
    ).toHaveLength(0)
  })

  it.each([
    '$stores/chat/store',
    '$stores/chat/hooks',
    '$stores/session/useStoreBundle',
    '$stores/demo',
    '$constants/demoData',
    '$constants/redesignData',
  ])('blocks widget imports of private stores and fixtures: %s', target => {
    expect(
      lint(`import value from '${target}'`, 'src/lib/widgets/chat/ChatWidget.tsx')
    ).toHaveLength(1)
  })

  it('restricts Zustand runtime imports to stores', () => {
    expect(
      lint("import { createStore } from 'zustand/vanilla'", 'src/lib/stores/chat/store.ts')
    ).toHaveLength(0)
    expect(
      lint("import { useStore } from 'zustand'", 'src/lib/widgets/ChatWidget.tsx')
    ).toHaveLength(1)
    expect(lint("import { createStore } from 'zustand/vanilla'", 'src/App.tsx')).toHaveLength(1)
    expect(
      lint(
        "import type { StoreApi } from 'zustand/vanilla'; import type { ReactNode } from 'react'",
        'src/types/stores/demo.ts'
      )
    ).toHaveLength(0)
  })

  it('prevents store-to-UI imports and factory imports of peer stores', () => {
    expect(
      lint("import { ChatWidget } from '$widgets/chat'", 'src/lib/stores/chat/actions.ts')
    ).toHaveLength(1)
    expect(
      lint("import Button from '$components/buttons/Button'", 'src/lib/stores/views/chat.ts')
    ).toHaveLength(1)
    expect(
      lint(
        "import { createSettingsStore } from '../settings/store'",
        'src/lib/stores/chat/store.ts'
      )
    ).toHaveLength(1)
    expect(
      lint("import { useSettingsStore } from '../settings/hooks'", 'src/lib/stores/views/chat.ts')
    ).toHaveLength(0)
  })

  it.each([
    "export { createChatStore as createActions } from '../chat/store'",
    "import { createChatStore as createActions } from '../chat/store'; export { createActions }",
    "export * from '../chat/store'",
  ])('follows factory dependencies through re-exports: %s', reexport => {
    const files = {
      'src/lib/stores/workflows/actions.ts': reexport,
      'src/lib/stores/chat/store.ts': 'export const createChatStore = () => null',
    }
    expect(
      lint("import * as actions from './actions'", 'src/lib/stores/workflows/store.ts', files)
    ).toHaveLength(1)
  })

  it('allows same-domain factory dependencies and type-only peer contracts', () => {
    const files = {
      'src/lib/stores/chat/actions.ts': "export { createChatActions } from './helpers'",
      'src/lib/stores/chat/helpers.ts': 'export const createChatActions = () => null',
    }
    expect(
      lint("import { createChatActions } from './actions'", 'src/lib/stores/chat/store.ts', files)
    ).toHaveLength(0)
    expect(
      lint(
        "import type { WorkflowState } from '../workflows/store'; import { type ScheduleState } from '../schedules/store'",
        'src/lib/stores/chat/store.ts'
      )
    ).toHaveLength(0)
  })

  it.each(['actions.ts', 'selectors.ts', 'hooks.ts', 'index.ts', 'graphChanges.ts'])(
    'rejects peer-domain runtime imports from every domain file: schedules/%s',
    file => {
      const from = `src/lib/stores/schedules/${file}`
      expect(lint("import { createWorkflowStore } from '../workflows/store'", from)).toHaveLength(1)
      expect(lint("import { useWorkflowStore } from '$stores/workflows'", from)).toHaveLength(1)
      expect(lint("const store = import('../workflows/store')", from)).toHaveLength(1)
    }
  )

  it.each([
    [
      'a same-domain helper',
      {
        'src/lib/stores/schedules/actions.ts':
          "import { createWorkflowStore } from '../workflows/store'\nexport const scheduleActions = () => createWorkflowStore()",
      },
    ],
    [
      'a lazy import in a same-domain helper',
      {
        'src/lib/stores/schedules/actions.ts':
          "export const scheduleActions = () => import('../workflows/store')",
      },
    ],
    [
      'a non-store helper',
      {
        'src/lib/stores/schedules/actions.ts':
          "import { helper } from '$utils/helper'\nexport const scheduleActions = helper",
        'src/lib/utils/helper.ts':
          "import { createWorkflowStore } from '../stores/workflows/store'\nexport const helper = () => createWorkflowStore()",
      },
    ],
    [
      'the session coordinator',
      {
        'src/lib/stores/schedules/actions.ts':
          "import { createSessionCommands } from '../session/commands'\nexport const scheduleActions = createSessionCommands",
        'src/lib/stores/session/commands.ts':
          "import { createRunWorkflowCommand } from '../executions/actions'\nexport const createSessionCommands = createRunWorkflowCommand",
      },
    ],
  ])('follows plain imports to peer domains through %s', (_, files) => {
    const virtual = {
      ...files,
      'src/lib/stores/workflows/store.ts': 'export const createWorkflowStore = () => null',
      'src/lib/stores/executions/actions.ts': 'export const createRunWorkflowCommand = () => null',
    }
    expect(
      lint(
        "import { scheduleActions } from './actions'",
        'src/lib/stores/schedules/store.ts',
        virtual
      )
    ).toHaveLength(1)
  })

  it('rejects domain imports of cross-domain views and demo seeds', () => {
    expect(
      lint("import { useChatView } from '$stores/views'", 'src/lib/stores/chat/hooks.ts')
    ).toHaveLength(1)
    expect(
      lint("import { createDemoSeed } from '../demo'", 'src/lib/stores/chat/actions.ts')
    ).toHaveLength(1)
  })

  it('allows domain files to read the session bundle and peer types', () => {
    const files = {
      'src/lib/stores/session/useStoreBundle.ts':
        "import { useContext } from 'react'; import { StoresContext } from './context'; export const useStoreBundle = () => useContext(StoresContext)",
      'src/lib/stores/session/context.ts':
        "import { createContext } from 'react'; import type { StoreBundle } from '$types/stores/session'; export const StoresContext = createContext<StoreBundle | null>(null)",
      'src/lib/stores/schedules/actions.ts':
        "import type { WorkflowStore } from '../workflows/store'; import { type WorkflowState } from '../workflows/hooks'; export type { WorkflowView } from '../workflows/selectors'; export const scheduleActions = (store: WorkflowStore, state: WorkflowState) => [store, state]",
    }
    expect(
      lint(
        "import { useStoreBundle } from '../session/useStoreBundle'",
        'src/lib/stores/chat/hooks.ts',
        files
      )
    ).toHaveLength(0)
    expect(
      lint(
        "import { scheduleActions } from './actions'",
        'src/lib/stores/schedules/store.ts',
        files
      )
    ).toHaveLength(0)
    expect(
      lint(
        "import { useWorkflowStore } from '../workflows/hooks'",
        'src/lib/stores/views/schedules.ts'
      )
    ).toHaveLength(0)
    expect(
      lint(
        "import { createScheduleCommand } from '../schedules/actions'",
        'src/lib/stores/session/commands.ts'
      )
    ).toHaveLength(0)
  })

  it.each([
    '$widgets/layout/MainLayoutWidget',
    '$pages/Home',
    '$sections/layout/MainLayout',
    '../../App',
    '$stores/chat/store',
    '$stores/session/useStoreBundle',
    '$constants/demoData',
  ])('rejects shared hook imports of %s', target => {
    expect(
      lint(`import value from '${target}'`, 'src/lib/hooks/useExample.ts', {
        'src/App.tsx': 'export default function App() { return null }',
      })
    ).toHaveLength(1)
  })

  it('lets widgets use shared hooks and shared hooks use public store hooks', () => {
    const files = {
      'src/lib/hooks/index.ts': "export { useViewport } from './useViewport'",
      'src/lib/hooks/useViewport.ts':
        "import { BREAKPOINTS } from '$lib/constants/dimensions'; export const useViewport = () => BREAKPOINTS",
    }
    expect(
      lint(
        "import { useViewport } from '$hooks'",
        'src/lib/widgets/layout/MainLayoutWidget.tsx',
        files
      )
    ).toHaveLength(0)
    expect(
      lint(
        "import { useChatStore } from '$stores/chat'; import { BREAKPOINTS } from '$lib/constants/dimensions'; import { useViewport } from './useViewport'",
        'src/lib/hooks/useExample.ts',
        files
      )
    ).toHaveLength(0)
    expect(
      lint("import { useViewport } from '$hooks'", 'src/lib/stores/shell/hooks.ts', files)
    ).toHaveLength(1)
  })

  it('keeps utilities below stores and checks dynamic/require imports', () => {
    expect(
      lint("import { useChatStore } from '$stores/chat'", 'src/lib/utils/format.ts')
    ).toHaveLength(1)
    expect(
      lint("const module = import('$stores/chat/store')", 'src/lib/widgets/ChatWidget.tsx')
    ).toHaveLength(1)
    expect(
      lint("const module = require('$stores/chat/store')", 'src/lib/widgets/ChatWidget.tsx')
    ).toHaveLength(1)
    expect(lint("import axios from 'axios'", 'src/lib/stores/chat/actions.ts')).toHaveLength(1)
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
      'src/lib/stores/catalogs/store.ts',
      'src/lib/stores/catalogs/hooks.ts',
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
    expect(
      lint(code, 'src/lib/stores/chat/actions.ts').some(
        message => message.messageId === 'component'
      )
    ).toBe(true)
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
