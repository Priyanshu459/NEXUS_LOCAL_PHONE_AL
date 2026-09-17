/** Coalesce token bursts without losing text. Final persistence remains the caller's job. */
export function createReplyUpdates(publish: () => void, intervalMs = 80) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  return {
    schedule() {
      if (disposed || timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        if (!disposed) publish();
      }, intervalMs);
    },
    dispose() {
      disposed = true;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}
