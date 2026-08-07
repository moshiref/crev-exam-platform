/**
 * Tiny classname combiner — joins truthy class strings and skips
 * falsy ones (undefined/null/false), so components can write
 * conditional Tailwind classes without pulling in a dependency.
 *
 *   cn('rounded-xl', isActive && 'bg-primary', error && 'border-red-300')
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
