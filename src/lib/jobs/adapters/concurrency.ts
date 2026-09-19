export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const queue = [...items];
  const results: R[] = [];
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item !== undefined) {
        const result = await fn(item);
        results.push(result);
      }
    }
  });
  await Promise.all(workers);
  return results;
}

export async function handleRateLimit(response: Response): Promise<boolean> {
  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
    await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 30000)));
    return true;
  }
  return false;
}
