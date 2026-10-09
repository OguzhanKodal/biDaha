import { router, Stack, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { HeaderButton } from '@/components/HeaderButton';
import { Icon } from '@/components/Icon';
import { KeyboardSafeView } from '@/components/KeyboardSafeView';
import { TextField } from '@/components/TextField';
import { createErrorTag, listErrorTags } from '@/db/errorTags';
import { getFolderPath } from '@/db/folders';
import { getQuestion, insertQuestion, listRecentSources, updateQuestion } from '@/db/questions';
import type { AnswerChoice, ErrorTagRow } from '@/db/types';
import { useDatabase } from '@/db/useDatabase';
import {
  answerChoices,
  filterSourceSuggestions,
  optionalText,
  questionDraftErrorMessages,
  validateQuestionDraft,
} from '@/domain/questions';
import { today } from '@/lib/date';
import { deletePhotoFiles, persistPhoto, photoUri, type TempPhoto } from '@/lib/photos';
import { syncReminders } from '@/lib/reminders';
import { minTouchSize, useTheme } from '@/theme';

import { capturePhoto, pickFolder } from './photoFlow';
import { PhotoSlot } from './PhotoSlot';
import { TagPicker } from './TagPicker';

/** Kayıtlı (göreli yol) ya da yeni düzenlenmiş (önbellekte) fotoğraf. */
type PhotoValue = { kind: 'stored'; path: string } | { kind: 'temp'; photo: TempPhoto };

function displayUri(value: PhotoValue | null): string | null {
  if (!value) return null;
  return value.kind === 'stored' ? photoUri(value.path) : value.photo.uri;
}

export type QuestionFormMode = { kind: 'new'; folderId: number | null } | { kind: 'edit'; id: number };

type Original = { questionImage: string; solutionImage: string | null };

export function QuestionForm({ mode }: { mode: QuestionFormMode }) {
  const db = useDatabase();
  const { colors, spacing, radius } = useTheme();

  const [loaded, setLoaded] = useState(false);
  const [tags, setTags] = useState<ErrorTagRow[]>([]);
  const [recentSources, setRecentSources] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<number | null>(mode.kind === 'new' ? mode.folderId : null);
  const [folderLabel, setFolderLabel] = useState<string | null>(null);
  const [questionPhoto, setQuestionPhoto] = useState<PhotoValue | null>(null);
  const [solutionPhoto, setSolutionPhoto] = useState<PhotoValue | null>(null);
  const [answer, setAnswer] = useState<AnswerChoice | null>(null);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourcePage, setSourcePage] = useState('');
  const [dirty, setDirty] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const original = useRef<Original | null>(null);
  const autoPromptDone = useRef(false);

  const touch = () => setDirty(true);

  // İlk yükleme: etiketler, son kaynaklar, klasör adı ve (düzenlemede) mevcut soru.
  useEffect(() => {
    (async () => {
      const [tagRows, sources] = await Promise.all([listErrorTags(db), listRecentSources(db)]);
      setTags(tagRows);
      setRecentSources(sources);
      let initialFolder = mode.kind === 'new' ? mode.folderId : null;
      if (mode.kind === 'edit') {
        const q = await getQuestion(db, mode.id);
        if (!q) throw new Error('Soru bulunamadı.');
        original.current = { questionImage: q.question_image, solutionImage: q.solution_image };
        initialFolder = q.folder_id;
        setFolderId(q.folder_id);
        setQuestionPhoto({ kind: 'stored', path: q.question_image });
        setSolutionPhoto(q.solution_image ? { kind: 'stored', path: q.solution_image } : null);
        setAnswer(q.correct_answer);
        setTagIds(q.tag_ids);
        setNote(q.note ?? '');
        setSourceName(q.source_name ?? '');
        setSourcePage(q.source_page ?? '');
      }
      if (initialFolder !== null) setFolderLabel(await getFolderPath(db, initialFolder));
      setLoaded(true);
    })().catch((e: unknown) => {
      Alert.alert('Açılamadı', e instanceof Error ? e.message : String(e));
      router.back();
    });
  }, [db, mode]);

  const addQuestionPhoto = async () => {
    const photo = await capturePhoto('Soru fotoğrafı');
    if (photo) {
      setQuestionPhoto({ kind: 'temp', photo });
      touch();
    }
  };

  const addSolutionPhoto = async () => {
    const photo = await capturePhoto('Çözüm fotoğrafı');
    if (photo) {
      setSolutionPhoto({ kind: 'temp', photo });
      touch();
    }
  };

  // Ekranın açılış animasyonu bitti mi? Animasyon sürerken uyarı penceresi açmak
  // iOS'ta ekranın sunumunu yarıda kesebilir.
  const navigation = useNavigation();
  const [presented, setPresented] = useState(false);
  useEffect(() => {
    const unsubscribe = navigation.addListener('transitionEnd' as never, () => setPresented(true));
    // Olay gelmezse (ör. animasyonsuz açılış) yedek süre.
    const fallback = setTimeout(() => setPresented(true), 700);
    return () => {
      unsubscribe();
      clearTimeout(fallback);
    };
  }, [navigation]);

  // Yeni soruda form açılınca doğrudan fotoğraf seçimine geç.
  useEffect(() => {
    if (loaded && presented && mode.kind === 'new' && !autoPromptDone.current) {
      autoPromptDone.current = true;
      addQuestionPhoto();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, presented]);

  const chooseFolder = async () => {
    const folder = await pickFolder(folderId);
    if (folder) {
      setFolderId(folder.id);
      setFolderLabel(await getFolderPath(db, folder.id));
      touch();
    }
  };

  const toggleTag = (id: number) => {
    setTagIds((ids) => (ids.includes(id) ? ids.filter((t) => t !== id) : [...ids, id]));
    touch();
  };

  const createTag = async (name: string) => {
    const id = await createErrorTag(db, name);
    setTags(await listErrorTags(db));
    setTagIds((ids) => [...ids, id]);
    touch();
  };

  const errors = validateQuestionDraft({ hasQuestionPhoto: questionPhoto !== null, folderId });

  const save = async () => {
    setSubmitted(true);
    if (errors.length > 0 || saving || !questionPhoto || folderId === null) return;
    setSaving(true);
    const created: string[] = [];
    const persist = async (value: PhotoValue | null): Promise<string | null> => {
      if (!value) return null;
      if (value.kind === 'stored') return value.path;
      const path = await persistPhoto(value.photo.uri);
      created.push(path);
      return path;
    };
    try {
      const questionImage = (await persist(questionPhoto)) as string;
      const solutionImage = await persist(solutionPhoto);
      const input = {
        folderId,
        questionImage,
        solutionImage,
        correctAnswer: answer,
        note: optionalText(note),
        sourceName: optionalText(sourceName),
        sourcePage: optionalText(sourcePage),
        tagIds,
      };
      const now = new Date().toISOString();
      if (mode.kind === 'new') {
        await insertQuestion(db, input, now, today());
      } else {
        await updateQuestion(db, mode.id, input, now);
        // Kayıt güncellendikten SONRA, artık kullanılmayan eski fotoğrafları sil.
        const old = original.current;
        if (old) {
          const stillUsed = new Set([questionImage, solutionImage]);
          deletePhotoFiles([old.questionImage, old.solutionImage].filter((p): p is string => !!p && !stillUsed.has(p)));
        }
      }
      syncReminders(db);
      leaving.current = true;
      router.back();
    } catch (e) {
      // Kayıt başarısız: bu denemede kopyalanan dosyalar hiçbir kayda bağlı değil.
      deletePhotoFiles(created);
      setSaving(false);
      Alert.alert('Kaydedilemedi', e instanceof Error ? e.message : String(e));
    }
  };

  // Ekran hangi yoldan kapanırsa kapansın (Vazgeç, Android geri tuşu, kaydırma) kaydedilmemiş
  // değişiklik varsa önce onay istenir. Kaydetme sonrası çıkışta leaving true yapılır.
  const leaving = useRef(false);
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!dirty || leaving.current) return;
      e.preventDefault();
      Alert.alert('Değişiklikler kaydedilmesin mi?', undefined, [
        { text: 'Düzenlemeye devam et', style: 'cancel' },
        {
          text: 'Kaydetmeden çık',
          style: 'destructive',
          onPress: () => {
            leaving.current = true;
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
  }, [navigation, dirty]);

  const cancel = () => router.back();

  const suggestions = filterSourceSuggestions(recentSources, sourceName);
  const showError = (key: 'missingPhoto' | 'missingFolder') =>
    submitted && errors.includes(key) ? questionDraftErrorMessages[key] : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: mode.kind === 'new' ? 'Yeni soru' : 'Soruyu düzenle',
          headerLeft: () => <HeaderButton label="Vazgeç" onPress={cancel} />,
          headerRight: () =>
            saving ? <ActivityIndicator color={colors.accent} /> : <HeaderButton label="Kaydet" bold onPress={save} />,
        }}
      />
      {loaded ? (
        <KeyboardSafeView>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}>
            <PhotoSlot
              label="Soru fotoğrafı"
              uri={displayUri(questionPhoto)}
              onPick={addQuestionPhoto}
              error={showError('missingPhoto')}
            />

            <View style={{ gap: spacing.xs }}>
              <AppText variant="callout" color="textSecondary">
                Klasör
              </AppText>
              <Pressable
                onPress={chooseFolder}
                accessibilityRole="button"
                accessibilityLabel={`Klasör: ${folderLabel ?? 'seçilmedi'}. Değiştirmek için dokun`}
                style={({ pressed }) => ({
                  minHeight: minTouchSize + 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: showError('missingFolder') ? colors.danger : 'transparent',
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.7 : 1,
                })}>
                <Icon name="folder" size={18} color="accent" />
                <AppText style={{ flex: 1 }} color={folderLabel ? 'text' : 'textSecondary'}>
                  {folderLabel ?? 'Klasör seç'}
                </AppText>
                <Icon name="chevron.right" size={14} color="textSecondary" />
              </Pressable>
              {showError('missingFolder') ? (
                <AppText variant="caption" color="danger">
                  {showError('missingFolder')}
                </AppText>
              ) : null}
            </View>

            <View style={{ gap: spacing.xs }}>
              <AppText variant="callout" color="textSecondary">
                Doğru şık
              </AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm }} accessibilityRole="radiogroup">
                {answerChoices.map((choice) => (
                  <Chip
                    key={choice}
                    label={choice}
                    role="radio"
                    selected={answer === choice}
                    accessibilityLabel={`${choice} şıkkı`}
                    onPress={() => {
                      setAnswer((a) => (a === choice ? null : choice));
                      touch();
                    }}
                  />
                ))}
              </View>
            </View>

            <TagPicker tags={tags} selectedIds={tagIds} onToggle={toggleTag} onCreate={createTag} />

            <PhotoSlot
              label="Çözüm fotoğrafı (isteğe bağlı)"
              addLabel="Çözüm fotoğrafı ekle"
              uri={displayUri(solutionPhoto)}
              onPick={addSolutionPhoto}
              onRemove={() => {
                setSolutionPhoto(null);
                touch();
              }}
            />

            <TextField
              label="Not"
              placeholder="Ör. Zincir kuralını unuttum"
              value={note}
              onChangeText={(t) => {
                setNote(t);
                touch();
              }}
              multiline
              style={{ minHeight: 96, paddingTop: spacing.md, textAlignVertical: 'top' }}
            />

            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 3 }}>
                  <TextField
                    label="Kaynak"
                    placeholder="Kitap ya da deneme adı"
                    value={sourceName}
                    onChangeText={(t) => {
                      setSourceName(t);
                      touch();
                    }}
                    maxLength={80}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Sayfa"
                    placeholder="Ör. 42"
                    value={sourcePage}
                    onChangeText={(t) => {
                      setSourcePage(t);
                      touch();
                    }}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                  />
                </View>
              </View>
              {suggestions.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {suggestions.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      icon="clock.arrow.circlepath"
                      role="button"
                      accessibilityLabel={`Son kaynak: ${s}`}
                      onPress={() => {
                        setSourceName(s);
                        touch();
                      }}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardSafeView>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
    </>
  );
}
