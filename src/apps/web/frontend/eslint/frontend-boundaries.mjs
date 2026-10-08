import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const slash = value => value.replaceAll('\\', '/')
const within = (value, directory) => value === directory || value.startsWith(`${directory}/`)
const withoutExtension = value => value.replace(/\.(?:[cm]?[jt]sx?)$/, '')
const aliases = {
  $types: 'src/types',
  $lib: 'src/lib',
  $components: 'src/lib/components',
  $widgets: 'src/lib/widgets',
  $sections: 'src/lib/sections',
  $pages: 'src/lib/pages',
  $hooks: 'src/lib/hooks',
  $services: 'src/services',
  $store: 'src/store',
  $constants: 'src/lib/constants',
  $utils: 'src/lib/utils',
  $assets: 'src/assets',
}
const networkPackages = /^(?:axios|ky|node-fetch|undici|socket\.io-client|graphql-request)(?:\/|$)/
const storePackages = /^(?:zustand|redux|@reduxjs\/toolkit|react-redux)(?:\/|$)/
const uiPackages = /^(?:react(?:-dom|-router-dom)?(?:\/|$)|framer-motion(?:\/|$)|@mui\/|@xyflow\/)/
const tableTags = new Set([
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'colgroup',
  'col',
])

function tier(relative) {
  if (within(relative, 'src/types')) return 'types'
  if (/^src\/lib\/(?:constants|utils|data-structures)(?:\/|$)/.test(relative)) return 'lower'
  if (within(relative, 'src/lib/components')) return 'components'
  if (within(relative, 'src/lib/widgets')) return 'widgets'
  if (
    /^src\/lib\/(?:pages|sections)(?:\/|$)/.test(relative) ||
    /^src\/[^/]+\.[jt]sx?$/.test(relative)
  )
    return 'composition'
  return 'other'
}

function isTest(relative) {
  return (
    relative.startsWith('src/tests/') ||
    /(?:^|\/)__tests__\//.test(relative) ||
    /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(relative)
  )
}

function isFixture(relative) {
  return (
    /(?:^|\/)(?:fixtures?|demoData|redesignData)(?:[./]|$)/i.test(relative) ||
    relative.startsWith('src/tests/')
  )
}

/** Dependency resolution is injectable so rule tests use an in-memory file graph. */
export function createFrontendArchitecture({
  rootDir = frontendRoot,
  readFile = file => fs.readFileSync(file, 'utf8'),
  fileExists = fs.existsSync,
} = {}) {
  const relative = file => slash(path.relative(rootDir, file))
  const aliasTargets = { ...aliases }
  try {
    const config = ts.parseConfigFileTextToJson(
      'tsconfig.app.json',
      readFile(path.join(rootDir, 'tsconfig.app.json'))
    ).config
    for (const [key, targets] of Object.entries(config?.compilerOptions?.paths ?? {})) {
      if (typeof targets?.[0] === 'string')
        aliasTargets[key.replace(/\/\*$/, '')] = targets[0].replace(/\/\*$/, '')
    }
  } catch {
    /* Virtual rule fixtures use the standard alias map. */
  }
  const graphCache = new Map()
  function resolve(specifier, from) {
    const clean = specifier.split('?')[0]
    const alias = Object.keys(aliasTargets).find(
      key => clean === key || clean.startsWith(`${key}/`)
    )
    const raw = alias
      ? path.join(rootDir, aliasTargets[alias], clean.slice(alias.length))
      : clean.startsWith('.')
        ? path.resolve(path.dirname(from), clean)
        : path.isAbsolute(clean)
          ? clean
          : null
    if (!raw) return { external: clean }
    const candidates = [
      raw,
      ...['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'].map(ext => `${raw}${ext}`),
      ...['index.ts', 'index.tsx', 'index.js'].map(index => path.join(raw, index)),
    ]
    return {
      file:
        candidates.find(
          candidate => fileExists(candidate) && !fs.existsSync(candidate + path.sep)
        ) ?? raw,
    }
  }
  function exportsOf(file) {
    if (graphCache.has(file)) return graphCache.get(file)
    const edges = []
    graphCache.set(file, edges)
    let code
    try {
      code = readFile(file)
    } catch {
      return edges
    }
    const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true)
    const imported = new Map()
    for (const statement of source.statements) {
      if (
        !ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier) ||
        statement.importClause?.isTypeOnly
      )
        continue
      const specifier = statement.moduleSpecifier.text
      if (statement.importClause?.name)
        imported.set(statement.importClause.name.text, { specifier, imported: 'default' })
      const bindings = statement.importClause?.namedBindings
      if (bindings && ts.isNamedImports(bindings))
        for (const item of bindings.elements) {
          if (!item.isTypeOnly)
            imported.set(item.name.text, {
              specifier,
              imported: (item.propertyName ?? item.name).text,
            })
        }
      if (bindings && ts.isNamespaceImport(bindings))
        imported.set(bindings.name.text, { specifier, imported: '*' })
    }
    for (const statement of source.statements) {
      if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
        const specifier =
          statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
            ? statement.moduleSpecifier.text
            : null
        if (!statement.exportClause && specifier)
          edges.push({ exported: '*', imported: '*', specifier })
        else if (statement.exportClause && ts.isNamedExports(statement.exportClause))
          for (const item of statement.exportClause.elements) {
            if (item.isTypeOnly) continue
            const localName = (item.propertyName ?? item.name).text
            const origin = specifier ? { specifier, imported: localName } : imported.get(localName)
            if (origin) edges.push({ exported: item.name.text, ...origin })
          }
        else if (
          statement.exportClause &&
          ts.isNamespaceExport(statement.exportClause) &&
          specifier
        )
          edges.push({ exported: statement.exportClause.name.text, imported: '*', specifier })
      } else if (ts.isExportAssignment(statement) && ts.isIdentifier(statement.expression)) {
        const origin = imported.get(statement.expression.text)
        if (origin) edges.push({ exported: 'default', ...origin })
      }
    }
    return edges
  }
  function violation(origin, resolved, names, typeOnly) {
    if (resolved.external) {
      if (!typeOnly && networkPackages.test(resolved.external))
        return 'Application transport clients are removed; use widget-owned demo actions.'
      if (!typeOnly && storePackages.test(resolved.external) && origin !== 'widgets')
        return 'Only widgets own application stores and store hooks.'
      if (!typeOnly && ['types', 'lower'].includes(origin) && uiPackages.test(resolved.external))
        return 'Types, constants and utilities cannot depend on UI runtime code.'
      return null
    }
    const target = relative(resolved.file)
    if (target.startsWith('src/types/')) return null
    const targetTier = tier(target)
    const serviceOrHook =
      /^src\/(?:services|store)(?:\/|$)/.test(target) || within(target, 'src/lib/hooks')
    if (
      origin === 'components' &&
      (['widgets', 'composition'].includes(targetTier) || serviceOrHook || isFixture(target))
    )
      return 'Components render props and emit events; widgets own data, actions and browser operations.'
    if (origin === 'widgets' && targetTier === 'composition')
      return 'Widgets may compose components and widgets, but cannot import pages, sections or App.'
    if (
      ['types', 'lower'].includes(origin) &&
      !typeOnly &&
      (['components', 'widgets', 'composition'].includes(targetTier) ||
        serviceOrHook ||
        isFixture(target))
    )
      return 'Types, constants and utilities must stay below runtime UI and session state.'
    if (origin === 'composition') {
      const module = withoutExtension(target).replace(/\/index$/, '')
      const publicSession =
        module === 'src/lib/widgets/session' &&
        names.length > 0 &&
        names.every(name => name === 'DemoSessionProvider')
      const internalWidget =
        target.startsWith('src/lib/widgets/session/') ||
        target === 'src/lib/widgets/session' ||
        /(?:^|\/)(?:hooks|store|stores|fixtures|data)(?:\/|$)/.test(target) ||
        /(?:^|\/)use[A-Z][^/]*$/.test(module)
      if (
        serviceOrHook ||
        isFixture(target) ||
        (targetTier === 'widgets' && internalWidget && !publicSession)
      )
        return 'App, pages and sections compose public widgets; session internals, fixtures and domain hooks stay inside widgets.'
    }
    return null
  }
  function findViolation(origin, resolved, names, typeOnly, visited = new Set()) {
    const direct = violation(origin, resolved, names, typeOnly)
    if (direct)
      return { reason: direct, target: resolved.file ? relative(resolved.file) : resolved.external }
    if (!resolved.file || typeOnly || relative(resolved.file).startsWith('src/types/')) return null
    // The public provider is an ownership boundary, not an invitation to import its store.
    if (
      origin === 'composition' &&
      withoutExtension(relative(resolved.file)).replace(/\/index$/, '') ===
        'src/lib/widgets/session'
    )
      return null
    const key = `${resolved.file}:${names.join(',')}`
    if (visited.has(key)) return null
    visited.add(key)
    for (const edge of exportsOf(resolved.file)) {
      if (edge.exported !== '*' && !names.includes('*') && !names.includes(edge.exported)) continue
      const nextNames = edge.exported === '*' ? names : [edge.imported]
      const found = findViolation(
        origin,
        resolve(edge.specifier, resolved.file),
        nextNames,
        false,
        visited
      )
      if (found) return found
    }
    return null
  }
  return {
    rules: {
      'data-ownership': {
        meta: {
          type: 'problem',
          schema: [],
          messages: { boundary: '{{reason}} Resolved dependency: {{target}}.' },
        },
        create(context) {
          const file = context.filename
          const from = relative(file)
          if (!from.startsWith('src/') || isTest(from)) return {}
          const origin = tier(from)
          const check = (node, source, names = ['*'], typeOnly = false) => {
            if (typeof source !== 'string') return
            const found = findViolation(origin, resolve(source, file), names, typeOnly)
            if (found) context.report({ node, messageId: 'boundary', data: found })
          }
          return {
            ImportDeclaration(node) {
              const valueSpecifiers = node.specifiers.filter(item => item.importKind !== 'type')
              const typeOnly =
                node.importKind === 'type' ||
                (node.specifiers.length > 0 && valueSpecifiers.length === 0)
              const names = (typeOnly ? node.specifiers : valueSpecifiers).map(item =>
                item.type === 'ImportDefaultSpecifier'
                  ? 'default'
                  : item.type === 'ImportNamespaceSpecifier'
                    ? '*'
                    : (item.imported.name ?? item.imported.value)
              )
              check(node, node.source.value, names, typeOnly)
            },
            ExportNamedDeclaration(node) {
              if (!node.source) return
              const values = node.specifiers.filter(item => item.exportKind !== 'type')
              check(
                node,
                node.source.value,
                values.map(item => item.local.name ?? item.local.value),
                node.exportKind === 'type' || (node.specifiers.length > 0 && values.length === 0)
              )
            },
            ExportAllDeclaration(node) {
              check(node, node.source.value, ['*'], node.exportKind === 'type')
            },
            ImportExpression(node) {
              check(node, node.source.value)
            },
            CallExpression(node) {
              if (
                node.callee.type === 'Identifier' &&
                node.callee.name === 'require' &&
                node.arguments[0]?.type === 'Literal'
              )
                check(node, node.arguments[0].value)
            },
          }
        },
      },
      'canonical-controls': {
        meta: {
          type: 'problem',
          schema: [],
          messages: {
            button:
              'Render buttons through components/buttons/Button.tsx, including animated buttons.',
            table:
              'Render table markup through components/display/TableParts.tsx and the shared Table API.',
          },
        },
        create(context) {
          const from = relative(context.filename)
          if (!from.startsWith('src/') || isTest(from)) return {}
          const report = (node, tag) => {
            if (tag === 'button' && from !== 'src/lib/components/buttons/Button.tsx')
              context.report({ node, messageId: 'button' })
            if (tableTags.has(tag) && from !== 'src/lib/components/display/TableParts.tsx')
              context.report({ node, messageId: 'table' })
          }
          return {
            JSXOpeningElement(node) {
              const name = node.name
              report(
                node,
                name.type === 'JSXIdentifier'
                  ? name.name
                  : name.type === 'JSXMemberExpression'
                    ? name.property.name
                    : null
              )
            },
            CallExpression(node) {
              const callee = node.callee
              const name =
                callee.type === 'Identifier'
                  ? callee.name
                  : callee.type === 'MemberExpression' && !callee.computed
                    ? callee.property.name
                    : ''
              if (
                ['createElement', 'jsx', 'jsxs', 'create'].includes(name) &&
                node.arguments[0]?.type === 'Literal'
              )
                report(node, node.arguments[0].value)
            },
          }
        },
      },
      'frontend-only-io': {
        meta: {
          type: 'problem',
          schema: [],
          messages: {
            transport:
              'Application network transports and microphone capture are disabled; use the widget-owned demo session.',
            storage: 'Session state resets on reload; do not read or write browser storage.',
            component: 'Components emit events; browser I/O belongs in widgets.',
          },
        },
        create(context) {
          const from = relative(context.filename)
          if (!from.startsWith('src/') || isTest(from)) return {}
          const component = tier(from) === 'components'
          const source = context.sourceCode
          function globalPath(node, seen = new Set()) {
            if (!node || seen.has(node)) return null
            seen.add(node)
            if (node.type === 'ChainExpression') return globalPath(node.expression, seen)
            if (node.type === 'MemberExpression') {
              const base = globalPath(node.object, seen)
              const property = node.computed
                ? node.property.type === 'Literal'
                  ? node.property.value
                  : null
                : node.property.name
              return base && typeof property === 'string' ? `${base}.${property}` : null
            }
            if (node.type !== 'Identifier') return null
            let scope = source.getScope(node)
            let variable
            while (scope && !variable) {
              variable = scope.set.get(node.name)
              scope = scope.upper
            }
            if (!variable || variable.defs.length === 0) return node.name
            const definition = variable.defs[0].node
            if (definition.type !== 'VariableDeclarator' || !definition.init) return null
            const origin = globalPath(definition.init, seen)
            if (definition.id.type === 'Identifier') return origin
            if (origin && definition.id.type === 'ObjectPattern') {
              const entry = definition.id.properties.find(
                property =>
                  property.type === 'Property' &&
                  property.value.type === 'Identifier' &&
                  property.value.name === node.name
              )
              if (entry) return `${origin}.${entry.key.name ?? entry.key.value}`
            }
            return null
          }
          function category(value) {
            if (!value) return null
            const normalized = value.replace(/^(?:window|globalThis|self)\./, '')
            if (
              /^(?:fetch|XMLHttpRequest|WebSocket|EventSource)(?:\.|$)/.test(normalized) ||
              /^navigator\.(?:(?:mediaDevices\.)?getUserMedia|webkitGetUserMedia|mozGetUserMedia|sendBeacon)(?:\.|$)/.test(
                normalized
              )
            )
              return 'transport'
            if (
              /^(?:localStorage|sessionStorage|indexedDB)(?:\.|$)/.test(normalized) ||
              normalized === 'document.cookie'
            )
              return 'storage'
            if (
              component &&
              (/^(?:navigator\.(?:clipboard|share)|URL\.(?:createObjectURL|revokeObjectURL)|Audio|AudioContext|webkitAudioContext|FileReader|Blob|showSaveFilePicker|showOpenFilePicker|showDirectoryPicker)(?:\.|$)/.test(
                normalized
              ) ||
                /^(?:window\.)?(?:open|print)$/.test(value) ||
                /^document\.execCommand$/.test(normalized) ||
                /^location\.(?:assign|replace|reload|href)$/.test(normalized))
            )
              return 'component'
            return null
          }
          function check(node) {
            if (node.type === 'Identifier') {
              const parent = node.parent
              if (
                (parent.type === 'MemberExpression' &&
                  parent.property === node &&
                  !parent.computed) ||
                (parent.type === 'Property' &&
                  parent.key === node &&
                  !parent.computed &&
                  !parent.shorthand) ||
                /^(?:Import|Export)/.test(parent.type)
              )
                return
              const scope = source.getScope(node)
              if (!scope.references.some(reference => reference.identifier === node)) return
            }
            const kind = category(globalPath(node))
            if (!kind) return
            if (
              node.parent.type === 'MemberExpression' &&
              node.parent.object === node &&
              category(globalPath(node.parent)) === kind
            )
              return
            context.report({ node, messageId: kind })
          }
          return { Identifier: check, MemberExpression: check }
        },
      },
    },
  }
}

export default createFrontendArchitecture()
