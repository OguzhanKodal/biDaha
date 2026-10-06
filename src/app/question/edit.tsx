import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { QuestionForm, type QuestionFormMode } from '@/features/questions/QuestionForm';

/** Soru düzenleme. Parametre: id. */
export default function EditQuestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mode = useMemo<QuestionFormMode>(() => ({ kind: 'edit', id: Number(id) }), [id]);
  return <QuestionForm mode={mode} />;
}
