import { createContext, useContext, useState, type ReactNode } from 'react';

import { emptyDraft, type OnboardingDraft } from '@/domain/onboarding';

type DraftContextValue = {
  draft: OnboardingDraft;
  update: (changes: Partial<OnboardingDraft>) => void;
};

const DraftContext = createContext<DraftContextValue | null>(null);

/** Onboarding cevapları son adıma kadar sadece bellekte tutulur. */
export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(emptyDraft);
  const update = (changes: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...changes }));
  return <DraftContext.Provider value={{ draft, update }}>{children}</DraftContext.Provider>;
}

export function useOnboardingDraft(): DraftContextValue {
  const value = useContext(DraftContext);
  if (!value) throw new Error('useOnboardingDraft, OnboardingDraftProvider içinde kullanılmalı.');
  return value;
}
