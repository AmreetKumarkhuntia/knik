import { useCallback } from 'react'
import { useFeedbackStore } from '$stores/feedback'

/**
 * Returns a stable copy callback that writes text to the clipboard and reports the outcome as a
 * toast. navigator.clipboard only exists in secure contexts (https or localhost), so its absence is
 * reported instead of throwing.
 */
export function useCopyToClipboard(successMessage = 'Copied to clipboard.') {
  const addToast = useFeedbackStore(state => state.addToast)
  return useCallback(
    (text: string) => {
      const clipboard = Reflect.get(navigator, 'clipboard') as Clipboard | undefined
      if (!clipboard) {
        addToast('Clipboard is unavailable in this browser.', 'error')
        return
      }
      void clipboard.writeText(text).then(
        () => addToast(successMessage, 'success'),
        () => addToast('Could not copy to the clipboard.', 'error')
      )
    },
    [addToast, successMessage]
  )
}
