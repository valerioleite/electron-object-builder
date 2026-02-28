/**
 * Creates a debounced version of a function that delays invoking
 * the function until after `delay` milliseconds have elapsed since
 * the last time it was called.
 */

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timerId: ReturnType<typeof setTimeout> | null = null

  const debounced = ((...args: Parameters<T>) => {
    if (timerId !== null) {
      clearTimeout(timerId)
    }
    timerId = setTimeout(() => {
      timerId = null
      fn(...args)
    }, delay)
  }) as T & { cancel: () => void }

  debounced.cancel = () => {
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  return debounced
}
