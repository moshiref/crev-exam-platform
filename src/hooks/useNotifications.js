import { useEffect, useRef, useSyncExternalStore } from 'react'
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
  subscribe,
  playNotificationSound,
} from '../services/notifications.js'

/**
 * Admin notification center state: the live list (newest first), the unread
 * counter, and mark-as-read actions. Plays the alert sound exactly once per
 * newly arriving notification — never for notifications that were already
 * present (restored from storage) or already announced in this tab.
 */
export function useNotifications() {
  const notifications = useSyncExternalStore(subscribe, getNotifications)
  const unreadCount = useSyncExternalStore(subscribe, getUnreadCount)
  const announcedRef = useRef(new Set())
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      // First run: remember everything that already exists so stored
      // notifications never beep again — only freshly arriving ones alert.
      for (const n of notifications) announcedRef.current.add(n.id)
      mountedRef.current = true
      return
    }
    for (const n of notifications) {
      if (!announcedRef.current.has(n.id)) {
        announcedRef.current.add(n.id)
        playNotificationSound()
      }
    }
  }, [notifications])

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
  }
}
