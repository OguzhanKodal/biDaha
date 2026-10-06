import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import type { QuestionListItem } from '@/db/questions';
import { nextReviewLabel, progressLabel } from '@/domain/questions';
import type { LocalDate } from '@/lib/date';
import { photoUri } from '@/lib/photos';
import { useTheme } from '@/theme';

import { QuestionBadges } from './QuestionBadges';

type Props = { question: QuestionListItem; target: number; today: LocalDate };

export function QuestionCard({ question, target, today }: Props) {
  const { colors, spacing, radius } = useTheme();
  const completed = question.completed_at !== null;
  const a11yStatus = completed
    ? 'tamamlandı'
    : `${progressLabel(question.success_count, target)}, sonraki tekrar ${nextReviewLabel(question.next_review_date, today)}` +
      (question.last_result === 'fail' ? ', son tekrarda çözemedin' : '');
  const details = [question.tag_names.join(', '), question.note].filter(Boolean).join(' · ');

  return (
    <Link href={{ pathname: '/question/[id]', params: { id: String(question.id) } }} asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={`Soru, ${a11yStatus}${details ? `. ${details}` : ''}`}>
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.md,
            padding: spacing.sm,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            alignItems: 'center',
          }}>
          <Image
            source={{ uri: photoUri(question.question_image) }}
            style={{ width: 72, height: 72, borderRadius: radius.sm, backgroundColor: colors.surfaceSelected }}
            contentFit="cover"
            recyclingKey={String(question.id)}
          />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <QuestionBadges question={question} target={target} today={today} />
            {details ? (
              <AppText variant="callout" color="textSecondary" numberOfLines={2}>
                {details}
              </AppText>
            ) : null}
          </View>
          <Icon name="chevron.right" size={14} color="textSecondary" />
        </View>
      </Pressable>
    </Link>
  );
}
