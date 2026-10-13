import type { ESLint } from 'eslint'
export function createFrontendArchitecture(options?: {
  rootDir?: string
  readFile?: (file: string) => string
  fileExists?: (file: string) => boolean
}): ESLint.Plugin
declare const plugin: ESLint.Plugin
export default plugin
