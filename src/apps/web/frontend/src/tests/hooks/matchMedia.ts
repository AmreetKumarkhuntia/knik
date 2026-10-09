/**
 * jsdom has no window.matchMedia. Importing this module installs a width-driven one that evaluates
 * (min-width) and (max-width) queries against window.innerWidth and emits 'change' when a resize
 * event flips a query, so tests keep resizing through innerWidth. Other media features never match.
 */
type ChangeListener = (event: MediaQueryListEvent) => void

const subscriptions: { query: string; listener: ChangeListener; matches: boolean }[] = []

function evaluate(query: string) {
  const min = /\(min-width:\s*(\d+)px\)/.exec(query)
  const max = /\(max-width:\s*(\d+)px\)/.exec(query)
  if (!min && !max) return false
  return (
    (!min || window.innerWidth >= Number(min[1])) && (!max || window.innerWidth <= Number(max[1]))
  )
}

window.addEventListener('resize', () => {
  for (const subscription of [...subscriptions]) {
    const matches = evaluate(subscription.query)
    if (matches === subscription.matches) continue
    subscription.matches = matches
    subscription.listener({ matches, media: subscription.query } as MediaQueryListEvent)
  }
})

function matchMedia(query: string): MediaQueryList {
  const subscribe = (listener: ChangeListener) => {
    subscriptions.push({ query, listener, matches: evaluate(query) })
  }
  const unsubscribe = (listener: ChangeListener) => {
    const index = subscriptions.findIndex(
      subscription => subscription.query === query && subscription.listener === listener
    )
    if (index >= 0) subscriptions.splice(index, 1)
  }
  return {
    media: query,
    get matches() {
      return evaluate(query)
    },
    onchange: null,
    addEventListener: (_type: string, listener: ChangeListener) => subscribe(listener),
    removeEventListener: (_type: string, listener: ChangeListener) => unsubscribe(listener),
    addListener: subscribe,
    removeListener: unsubscribe,
    dispatchEvent: () => false,
  } as unknown as MediaQueryList
}

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: matchMedia,
})

export function activeMediaSubscriptions() {
  return subscriptions.length
}
