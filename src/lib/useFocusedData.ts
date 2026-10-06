import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/**
 * Ekran her odaklandığında (ilk açılış, geri dönüş, sekme değişimi) veriyi yeniden yükler.
 * `load` her render'da yeni olabilir; yükleme sadece odakta ve reload() ile tetiklenir.
 */
export function useFocusedData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      load()
        .then((result) => {
          if (active) {
            setData(result);
            setError(null);
          }
        })
        .catch((e: unknown) => {
          if (active) setError(e instanceof Error ? e : new Error(String(e)));
        });
      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [version]),
  );

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, reload };
}
