/**
 * INP (Interaction to Next Paint) Optimization Utilities
 *
 * INP replaced FID as a Core Web Vital in March 2024.
 * These utilities help minimize INP by deferring non-critical work,
 * yielding to the main thread, and optimizing event handlers.
 *
 * Good: <= 200ms | Needs Improvement: 200-500ms | Poor: > 500ms
 */

/**
 * Yield to the main thread to prevent long tasks from blocking interactions.
 * Use this in loops or heavy computations to keep INP low.
 *
 * @example
 * ```ts
 * for (const item of largeArray) {
 *   processItem(item);
 *   if (index % 100 === 0) await yieldToMain();
 * }
 * ```
 */
export function yieldToMain(): Promise<void> {
  if ('scheduler' in window && 'yield' in (window.scheduler as { yield?: () => Promise<void> })) {
    return (window.scheduler as { yield: () => Promise<void> }).yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Run a callback during idle time without blocking interactions.
 * Falls back to setTimeout for browsers without requestIdleCallback.
 */
export function runWhenIdle(callback: () => void, timeout = 5000): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 100);
  }
}

/**
 * Create a debounced event handler optimized for INP.
 * Uses requestAnimationFrame for visual updates, setTimeout for non-visual work.
 */
export function createINPSafeHandler<T extends (...args: unknown[]) => void>(
  handler: T,
  isVisual = false
): T {
  let pending = false;

  return ((...args: unknown[]) => {
    if (pending) return;
    pending = true;

    if (isVisual) {
      requestAnimationFrame(() => {
        handler(...args);
        pending = false;
      });
    } else {
      setTimeout(() => {
        handler(...args);
        pending = false;
      }, 0);
    }
  }) as T;
}

/**
 * Break a long task into smaller chunks that yield to the main thread.
 * Keeps each chunk under the 50ms long-task threshold.
 */
export async function processInChunks<T>(
  items: T[],
  processor: (item: T, index: number) => void,
  chunkSize = 50
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    chunk.forEach((item, j) => processor(item, i + j));
    if (i + chunkSize < items.length) {
      await yieldToMain();
    }
  }
}
