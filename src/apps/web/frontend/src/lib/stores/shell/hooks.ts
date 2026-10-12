import { createStoreHook } from '../session/createStoreHook'
import { useScope } from '../session/useScope'
import { EMPTY_SHELL_SCOPE } from './selectors'
export const useShellStore = createStoreHook('shell')
export const useShellScope = () => useScope(useShellStore, EMPTY_SHELL_SCOPE)
