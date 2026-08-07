import { useCallback, useState } from 'react'

/**
 * Small boolean-toggle hook for modals, drawers, and dropdowns.
 * Keeps open/close logic (and its intent) consistent everywhere
 * instead of re-deriving `useState(false)` + handlers per component.
 */
export function useDisclosure(initialValue = false) {
  const [isOpen, setIsOpen] = useState(initialValue)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  return { isOpen, open, close, toggle }
}
