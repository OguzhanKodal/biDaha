import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { getSettings } from '@/db/settings';
import type { SettingsRow } from '@/db/types';
import { useDatabase } from '@/db/useDatabase';

type SettingsContextValue = {
  settings: SettingsRow;
  reloadSettings: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Ayarlar yüklenene kadar hiçbir şey çizmez (açılış ekranı görünür kalır). */
export function SettingsProvider({ children, onError }: { children: ReactNode; onError: (e: Error) => void }) {
  const db = useDatabase();
  const [settings, setSettings] = useState<SettingsRow | null>(null);

  const reloadSettings = useCallback(async () => {
    setSettings(await getSettings(db));
  }, [db]);

  useEffect(() => {
    let active = true;
    getSettings(db)
      .then((row) => {
        if (active) setSettings(row);
      })
      .catch(onError);
    return () => {
      active = false;
    };
  }, [db, onError]);

  if (!settings) return null;

  return <SettingsContext.Provider value={{ settings, reloadSettings }}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings, SettingsProvider içinde kullanılmalı.');
  return value;
}
