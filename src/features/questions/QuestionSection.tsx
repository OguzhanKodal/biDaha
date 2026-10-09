import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { countQuestionsByStatus, listQuestions } from '@/db/questions';
import { countActive, countDue } from '@/db/reviews';
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
import { useTheme } from '@/theme';

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
    const [questions, counts, due, active] = await Promise.all([
      listQuestions(db, folderId, status, sort),
      countQuestionsByStatus(db, folderId),
      countDue(db, today(), folderId),
      countActive(db, folderId),
    ]);
    return { questions, counts, due, active };
  });

  const changeStatus = (next: QuestionStatusFilter) => {
    setStatus(next);
    reload();
  };

  const changeSort = (next: QuestionSort) => {
    setSort(next);
    reload();
  };

  const addQuestion = () => router.push({ pathname: '/question/new', params: { folderId: String(folderId) } });

  return (
    <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
      <AppText variant="heading" accessibilityRole="header">
        Sorular
      </AppText>

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

      {data && data.due > 0 ? (
        <Button
          title={`Tekrara başla (${data.due})`}
          onPress={() => router.push({ pathname: '/review', params: { mode: 'due', folderId: String(folderId) } })}
        />
      ) : null}
      {data && data.active > 0 ? (
        <Button
          title="Serbest çalış"
          variant="secondary"
          accessibilityHint="Günü gelmemiş soruları da çalışırsın; sadece günü gelenler sayılır"
          onPress={() => router.push({ pathname: '/review', params: { mode: 'free', folderId: String(folderId) } })}
        />
      ) : null}
      {/* Android'de uyarı penceresi en fazla 3 buton gösterir; sıralama bu yüzden ekranda seçilir. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Icon name="arrow.up.arrow.down" size={14} color="textSecondary" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {questionSorts.map((option) => (
            <Chip
              key={option}
              label={questionSortLabels[option]}
              role="radio"
              selected={sort === option}
              accessibilityLabel={`Sırala: ${questionSortLabels[option]}`}
              onPress={() => changeSort(option)}
            />
          ))}
        </ScrollView>
      </View>

      <Button title="Soru ekle" variant={data && data.due > 0 ? 'secondary' : 'primary'} onPress={addQuestion} />

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
