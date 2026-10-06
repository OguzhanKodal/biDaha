/**
 * Ekranlar arası sonuç aktarımı: bir ekran sonuç bekleyerek başka bir ekran açar
 * (ör. form → kırpma ekranı), açılan ekran sonucu verip kapanır.
 * Aynı anahtarda aynı anda tek istek olur; yenisi eskisini null ile kapatır.
 */
type Pending<TInput, TResult> = { input: TInput; resolve: (result: TResult | null) => void };

const pending = new Map<string, Pending<unknown, unknown>>();

export function requestResult<TInput, TResult>(key: string, input: TInput, open: () => void): Promise<TResult | null> {
  pending.get(key)?.resolve(null);
  return new Promise<TResult | null>((resolve) => {
    pending.set(key, { input, resolve: resolve as (result: unknown) => void });
    open();
  });
}

export function getPendingInput<TInput>(key: string): TInput | null {
  return (pending.get(key)?.input as TInput | undefined) ?? null;
}

/** Sonucu verir (vazgeçmek için null). İstek yoksa bir şey yapmaz. */
export function resolvePending<TResult>(key: string, result: TResult | null): void {
  const entry = pending.get(key);
  if (!entry) return;
  pending.delete(key);
  entry.resolve(result);
}
