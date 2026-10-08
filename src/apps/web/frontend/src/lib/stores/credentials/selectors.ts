import type { CredentialsScope } from '$types/stores/credentials'
export const EMPTY_CREDENTIALS_SCOPE: CredentialsScope = {
  created: null,
  creating: false,
  label: '',
  error: '',
  deletingId: null,
}
