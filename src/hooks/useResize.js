import { useCallback, useEffect, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage.js'

/**
 * Drag-to-resize hook.
 * Returns [width, onResizerMouseDown].
 * Width is persisted to localStorage under storageKey.
 * Double-clicking the resizer resets to initialWidth.
 */
export function useResize(storageKey, initialWidth, min = 160, max = 900) {
  const [width, setWidth] = useLocalStorage(storageKey, initialWidth)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const onMouseDown = useCallback((e) => {
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    e.preventDefault()
  }, [width])

  const onDoubleClick = useCallback(() => {
    setWidth(initialWidth)
  }, [initialWidth, setWidth])

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current) return
      const delta = e.clientX - startX.current
      setWidth(Math.min(max, Math.max(min, startWidth.current + delta)))
    }

    const onMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [min, max, setWidth])

  return [width, onMouseDown, onDoubleClick]
}
