import { View } from 'react-native';

import { Badge } from '@/components/Badge';
import type { QuestionRow } from '@/db/types';
import { nextReviewLabel, progressLabel } from '@/domain/questions';
import type { LocalDate } from '@/lib/date';
import { useTheme } from '@/theme';

type Props = {
  question: Pick<QuestionRow, 'success_count' | 'completed_at' | 'last_result' | 'next_review_date'>;
  target: number;
  today: LocalDate;
};

/** SPEC §7: aktif sorular kırmızı tonlu ilerleme rozeti, son tekrarda çözülemeyenlerde "Çözemedin"; tamamlananlar yeşil. */
export function QuestionBadges({ question, target, today }: Props) {
  const { spacing } = useTheme();
  const completed = question.completed_at !== null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
      {completed ? (
        <Badge text={`Tamamlandı ${progressLabel(question.success_count, target)}`} tone="success" icon="checkmark" />
      ) : (
        <>
          <Badge text={progressLabel(question.success_count, target)} tone="danger" icon="arrow.triangle.2.circlepath" />
          {question.last_result === 'fail' ? <Badge text="Çözemedin" tone="danger" icon="xmark" /> : null}
          <Badge text={nextReviewLabel(question.next_review_date, today)} icon="calendar" />
        </>
      )}
    </View>
  );
}
