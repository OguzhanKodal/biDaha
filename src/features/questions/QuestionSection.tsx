import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { countQuestionsByStatus, listQuestions } from '@/db/questions';
import { useDatabase } from '@/db/useDatabase';
import {
  questionSortLabels,
  questionSorts,
  type QuestionSort,
  type QuestionStatusFilter,
} from '@/domain/questions';
import { useSettings } from '@/features/settings/SettingsProvider';
import { today } from '@/lib/date';
import { useFocusedData } from '@/lib/useFocusedData';
import { minTouchSize, useTheme } from '@/theme';

import { QuestionCard } from './QuestionCard';

/** Klasör ekranındaki soru bölümü: Aktif/Tamamlanan, sıralama, soru ekle. Sadece klasöre doğrudan eklenenler. */
export function QuestionSection({ folderId }: { folderId: number }) {
  const db = useDatabase();
  const { spacing } = useTheme();
  const { settings } = useSettings();
  const [status, setStatus] = useState<QuestionStatusFilter>('active');
  const [sort, setSort] = useState<QuestionSort>('nextReview');
  const todayValue = today();

  const { data, reload } = useFocusedData(async () => {
    const [questions, counts] = await Promise.all([
      listQuestions(db, folderId, status, sort),
      countQuestionsByStatus(db, folderId),
    ]);
    return { questions, counts };
  });

  const changeStatus = (next: QuestionStatusFilter) => {
    setStatus(next);
    reload();
  };

  const chooseSort = () => {
    Alert.alert('Sırala', undefined, [
      ...questionSorts.map((option) => ({
        text: option === sort ? `✓ ${questionSortLabels[option]}` : questionSortLabels[option],
        onPress: () => {
          setSort(option);
          reload();
        },
      })),
      { text: 'Vazgeç', style: 'cancel' as const },
    ]);
  };

  const addQuestion = () => router.push({ pathname: '/question/new', params: { folderId: String(folderId) } });

  return (
    <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="heading" accessibilityRole="header">
          Sorular
        </AppText>
        <Pressable
          onPress={chooseSort}
          accessibilityRole="button"
          accessibilityLabel={`Sıralama: ${questionSortLabels[sort]}. Değiştirmek için dokun`}
          style={({ pressed }) => ({
            minHeight: minTouchSize,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            opacity: pressed ? 0.6 : 1,
          })}>
          <Icon name="arrow.up.arrow.down" size={14} color="accent" />
          <AppText variant="callout" color="accent">
            {questionSortLabels[sort]}
          </AppText>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }} accessibilityRole="tablist">
        <Chip
          label={`Aktif (${data?.counts.active ?? 0})`}
          role="radio"
          selected={status === 'active'}
          onPress={() => changeStatus('active')}
        />
        <Chip
          label={`Tamamlanan (${data?.counts.completed ?? 0})`}
          role="radio"
          selected={status === 'completed'}
          onPress={() => changeStatus('completed')}
        />
      </View>

      <Button title="Soru ekle" onPress={addQuestion} />

      {data && data.questions.length === 0 ? (
        status === 'active' ? (
          <EmptyState
            icon="photo.on.rectangle"
            title="Henüz soru yok"
            message="Çözemediğin bir sorunun fotoğrafını çek, tekrar zamanı gelince sana hatırlatalım."
          />
        ) : (
          <EmptyState
            icon="checkmark.seal"
            title="Tamamlanan soru yok"
            message={`Bir soruyu ${settings.target_repetitions} kez çözünce burada görünür.`}
          />
        )
      ) : null}

      {data?.questions.map((q) => (
        <QuestionCard key={q.id} question={q} target={settings.target_repetitions} today={todayValue} />
      ))}
    </View>
  );
}
