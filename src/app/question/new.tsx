import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { QuestionForm, type QuestionFormMode } from '@/features/questions/QuestionForm';

/** Yeni soru. Parametre: folderId (isteğe bağlı; içinde bulunulan klasör varsayılan olur). */
export default function NewQuestionScreen() {
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const mode = useMemo<QuestionFormMode>(
    () => ({ kind: 'new', folderId: folderId ? Number(folderId) : null }),
    [folderId],
  );
  return <QuestionForm mode={mode} />;
}
