// ============================================================================
// Notification store — a lightweight, framework-agnostic notification center
// for the admin.
//
// Every important platform event (exam created/edited/deleted, exam started /
// submitted, teacher added/deleted, student registered, …) is pushed here via
// `notify()`. The store:
//
//   - keeps notifications in memory (newest first) and mirrors them to
//     localStorage so they survive a page refresh,
//   - publishes changes to every subscriber (admin Header) immediately, so
//     new notifications appear without any page reload,
//   - syncs across tabs of the same browser via the `storage` event,
//   - exposes `playNotificationSound()` so a single beep can be played once
//     per arriving notification (never replayed for the same one).
//
// Timestamps use the platform's unified convention: `createdAt` is stored in
// UTC as "YYYY-MM-DD HH:MM" (produced from `toISOString()`), exactly like
// `submittedAt`, so the display helpers (timeAgo / formatDateTime) show the
// true creation instant in the viewer's local time.
// ============================================================================

const STORAGE_KEY = 'crev-admin-notifications'
const MAX_NOTIFICATIONS = 60

const nowUtc = () => new Date().toISOString().replace('T', ' ').slice(0, 16)

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let notifications = []
const listeners = new Set()

// Reads persisted notifications once at startup (no sound is played for
// restored items — only freshly arriving ones beep).
try {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw) {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      notifications = parsed
        .filter((n) => n && n.id && n.text)
        .sort((a, b) => (String(b.createdAt) < String(a.createdAt) ? -1 : 1))
        .slice(0, MAX_NOTIFICATIONS)
    }
  }
} catch {
  /* localStorage unavailable — notifications stay in-memory only */
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  } catch {
    /* ignore write failures (private mode, quota, …) */
  }
}

function emit() {
  for (const listener of listeners) {
    try {
      listener()
    } catch {
      /* a broken listener must never break the store */
    }
  }
}

function commit(next) {
  notifications = next.slice(0, MAX_NOTIFICATIONS)
  persist()
  emit()
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a notification and publishes it immediately to subscribers.
 * `type` selects the icon in the UI; `text` is the human-readable message.
 * Newest notifications are inserted at the top.
 */
export function notify({ type = 'info', text = '' }) {
  if (!text) return
  commit([
    { id: `N-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, type, text, createdAt: nowUtc(), read: false },
    ...notifications,
  ])
}

/** Marks a single notification as read. */
export function markRead(id) {
  const next = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
  commit(next)
}

/** Marks every notification as read. */
export function markAllRead() {
  const next = notifications.map((n) => (n.read ? n : { ...n, read: true }))
  commit(next)
}

/** Removes every notification (used by the demo-data reset). */
export function clearAll() {
  commit([])
}

/** Stable snapshot for useSyncExternalStore. */
export function getNotifications() {
  return notifications
}

export function getUnreadCount() {
  let count = 0
  for (const n of notifications) if (!n.read) count += 1
  return count
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// ---------------------------------------------------------------------------
// Cross-tab sync — notifications created in another tab appear here instantly.
// ---------------------------------------------------------------------------

try {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return
    try {
      const parsed = e.newValue ? JSON.parse(e.newValue) : []
      if (!Array.isArray(parsed)) return
      const remote = new Map(notifications.map((n) => [n.id, n]))
      let changed = false
      for (const n of parsed) {
        if (!n || !n.id) continue
        if (!remote.has(n.id)) {
          remote.set(n.id, n)
          changed = true
        }
      }
      if (changed) {
        notifications = Array.from(remote.values())
          .sort((a, b) => (String(b.createdAt) < String(a.createdAt) ? -1 : 1))
          .slice(0, MAX_NOTIFICATIONS)
        persist()
        emit()
      }
    } catch {
      /* ignore malformed cross-tab payloads */
    }
  })
} catch {
  /* storage events unavailable — same-tab updates still work */
}

// ---------------------------------------------------------------------------
// Alert sound — a short two-tone beep, played once per new notification.
// ---------------------------------------------------------------------------

let audioCtx = null

function beep(ctx, { freq, start, duration, volume }) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start)
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration + 0.05)
}

/** Plays a short notification beep (no-op when audio is unavailable/blocked). */
export function playNotificationSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    audioCtx = audioCtx || new Ctx()
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    beep(audioCtx, { freq: 880, start: 0, duration: 0.16, volume: 0.16 })
    beep(audioCtx, { freq: 660, start: 0.18, duration: 0.22, volume: 0.14 })
  } catch {
    /* never throw when audio isn't permitted */
  }
}
