import type { RefObject } from 'react'
import type { InputPanelRef } from '$types/sections/chat'

/** Props for the home page component. */
export interface HomeProps {
  inputRef: RefObject<InputPanelRef | null>
}
