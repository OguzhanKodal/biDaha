import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HeaderButton } from '@/components/HeaderButton';
import { deleteQuestion, getQuestion, setSolutionImage } from '@/db/questions';
import { useDatabase } from '@/db/useDatabase';
import { capturePhoto } from '@/features/questions/photoFlow';
import { QuestionBadges } from '@/features/questions/QuestionBadges';
import { useSettings } from '@/features/settings/SettingsProvider';
import { today } from '@/lib/date';
import { deletePhotoFiles, persistPhoto, photoUri } from '@/lib/photos';
import { useFocusedData } from '@/lib/useFocusedData';
import { useTheme } from '@/theme';

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const questionId = Number(id);
  const db = useDatabase();
  const { colors, spacing, radius } = useTheme();
  const { settings } = useSettings();
  const [busy, setBusy] = useState(false);
  const { data: question, error, reload } = useFocusedData(() => getQuestion(db, questionId));

  if (error) return <EmptyState icon="exclamationmark.triangle" title="Soru açılamadı" message={error.message} />;
  if (question === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const openPhoto = (path: string, title: string) =>
    router.push({ pathname: '/question/photo', params: { path, title } });

  const addSolution = async () => {
    const photo = await capturePhoto('Çözüm fotoğrafı');
    if (!photo) return;
    setBusy(true);
    let path: string | null = null;
    try {
      path = await persistPhoto(photo.uri);
      await setSolutionImage(db, question.id, path, new Date().toISOString());
      reload();
    } catch (e) {
      if (path) deletePhotoFiles([path]);
      Alert.alert('Kaydedilemedi', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Soru silinsin mi?', 'Soru, fotoğrafları ve tekrar geçmişi kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            // Önce kayıt, sonra dosyalar (Kural 1).
            const photos = await deleteQuestion(db, question.id);
            deletePhotoFiles(photos);
            router.back();
          } catch (e) {
            Alert.alert('Silinemedi', e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);
  };

  const folderPath = question.parent_folder_name
    ? `${question.parent_folder_name} › ${question.folder_name}`
    : question.folder_name;
  const source = [question.source_name, question.source_page ? `s. ${question.source_page}` : null]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Soru',
          headerRight: () => (
            <HeaderButton
              label="Düzenle"
              onPress={() => router.push({ pathname: '/question/edit', params: { id: String(question.id) } })}
            />
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <Pressable
          onPress={() => openPhoto(question.question_image, 'Soru fotoğrafı')}
          accessibilityRole="imagebutton"
          accessibilityLabel="Soru fotoğrafı, büyütmek için dokun">
          <Image
            source={{ uri: photoUri(question.question_image) }}
            style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.surface }}
            contentFit="contain"
          />
        </Pressable>

        <QuestionBadges question={question} target={settings.target_repetitions} today={today()} />

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md }}>
          <InfoRow label="Klasör" value={folderPath} />
          <InfoRow label="Doğru şık" value={question.correct_answer ?? '—'} />
          <View style={{ gap: spacing.xs }}>
            <AppText variant="callout" color="textSecondary">
              Hata nedeni
            </AppText>
            {question.tag_names.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {question.tag_names.map((name) => (
                  <Badge key={name} text={name} />
                ))}
              </View>
            ) : (
              <AppText>—</AppText>
            )}
          </View>
          {question.note ? <InfoRow label="Not" value={question.note} /> : null}
          {source ? <InfoRow label="Kaynak" value={source} /> : null}
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppText variant="heading" accessibilityRole="header">
            Çözüm
          </AppText>
          {question.solution_image ? (
            <Pressable
              onPress={() => openPhoto(question.solution_image as string, 'Çözüm fotoğrafı')}
              accessibilityRole="imagebutton"
              accessibilityLabel="Çözüm fotoğrafı, büyütmek için dokun">
              <Image
                source={{ uri: photoUri(question.solution_image) }}
                style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.surface }}
                contentFit="contain"
              />
            </Pressable>
          ) : busy ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Button title="Çözüm fotoğrafı ekle" variant="secondary" onPress={addSolution} />
          )}
        </View>

        <Button title="Soruyu sil" variant="destructive" onPress={confirmDelete} />
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xxs }}>
      <AppText variant="callout" color="textSecondary">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}
