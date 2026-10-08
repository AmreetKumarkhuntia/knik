const overlays: symbol[] = []
let modalCount = 0
let previousOverflow = ''

export function registerOverlay(modal = false) {
  const token = Symbol('overlay')
  overlays.push(token)
  if (modal) {
    if (modalCount === 0) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    modalCount += 1
  }
  return {
    isTop: () => overlays.at(-1) === token,
    release: () => {
      const index = overlays.indexOf(token)
      if (index < 0) return
      overlays.splice(index, 1)
      if (modal && --modalCount === 0) document.body.style.overflow = previousOverflow
    },
  }
}
