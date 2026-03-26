import type { RefObject } from 'react'
import type { InputPanelRef } from '$types/sections/chat'

export interface HomeProps {
  inputRef: RefObject<InputPanelRef | null>
}
