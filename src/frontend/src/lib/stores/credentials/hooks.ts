import { createStoreHook } from '../session/createStoreHook'
import { useScope } from '../session/useScope'
import { EMPTY_CREDENTIALS_SCOPE } from './selectors'
export const useCredentialsStore = createStoreHook('credentials')
export const useCredentialsScope = () => useScope(useCredentialsStore, EMPTY_CREDENTIALS_SCOPE)
