/** Give the top-level SmoothCursor pointer coordinates from a local embedded section. */
export function connectSmoothCursor(frame: HTMLIFrameElement, doc: Document) {
  const host = frame.ownerDocument.defaultView!
  const root = doc.documentElement

  function syncCursor() {
    root.toggleAttribute('data-smooth-cursor', frame.ownerDocument.body.style.cursor === 'none')
  }

  function forwardPointer(event: PointerEvent) {
    if (event.pointerType === 'touch' || !root.hasAttribute('data-smooth-cursor')) return
    const bounds = frame.getBoundingClientRect()
    host.dispatchEvent(new PointerEvent('pointermove', {
      clientX: bounds.left + event.clientX,
      clientY: bounds.top + event.clientY,
      pointerType: event.pointerType,
      isPrimary: event.isPrimary,
    }))
  }

  const preference = new MutationObserver(syncCursor)
  preference.observe(frame.ownerDocument.body, {attributes:true,attributeFilter:['style']})
  syncCursor()
  doc.addEventListener('pointermove',forwardPointer,{passive:true})
  return () => {
    preference.disconnect()
    doc.removeEventListener('pointermove',forwardPointer)
    root.removeAttribute('data-smooth-cursor')
  }
}
