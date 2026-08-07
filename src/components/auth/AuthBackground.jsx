import { motion } from 'framer-motion'

/**
 * Ambient background for auth pages: faint dot grid + slowly floating
 * gradient blobs. Purely decorative (aria-hidden) and shared across
 * the student/teacher/parent login pages for a consistent premium feel.
 */
export default function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 20%, black 30%, transparent 100%)',
        }}
      />
      <motion.div
        animate={{ y: [0, 24, 0], x: [0, 16, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, -18, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 -left-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 16, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/4 h-56 w-56 rounded-full bg-secondary/10 blur-3xl"
      />
    </div>
  )
}
