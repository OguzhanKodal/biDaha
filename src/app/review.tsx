import { router, useLocalSearchParams } from 'expo-router';
import type { SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { listReviewItems, recordReview, undoReview, type RecordedReview, type ReviewItem, type ReviewSource } from '@/db/reviews';
import { useDatabase } from '@/db/useDatabase';
import { sessionSummary, type ReviewResult, type SessionResult } from '@/domain/spacedRepetition';
import { ReviewCard } from '@/features/review/ReviewCard';
import { useSettings } from '@/features/settings/SettingsProvider';
import { today } from '@/lib/date';
import { syncReminders } from '@/lib/reminders';
import { minTouchSize, useTheme } from '@/theme';

const SWIPE_THRESHOLD = 110;
const EXIT_DURATION = 180;

type Answered = { recorded: RecordedReview; session: SessionResult };

/**
 * Tekrar oturumu (SPEC §6). Parametreler:
 * - mode=due (varsayılan) [folderId] → günü gelen sorular
 * - mode=free folderId → serbest çalışma (sadece günü gelenler sayılır)
 */
export default function ReviewScreen() {
  const params = useLocalSearchParams<{ mode?: string; folderId?: string }>();
  const db = useDatabase();
  const { settings } = useSettings();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const folderId = params.folderId ? Number(params.folderId) : null;
  const isFree = params.mode === 'free' && folderId !== null;

  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answered, setAnswered] = useState<Answered[]>([]);
  const [busy, setBusy] = useState(false);
  const translateX = useSharedValue(0);

  // Oturum listesi bir kez yüklenir; oturum boyunca sabit kalır.
  useEffect(() => {
    const source: ReviewSource = isFree ? { kind: 'free', folderId: folderId as number } : { kind: 'due', folderId };
    listReviewItems(db, source, today())
      .then(setItems)
      .catch((e: unknown) => {
        Alert.alert('Tekrar açılamadı', e instanceof Error ? e.message : String(e));
        router.back();
      });
  }, [db, isFree, folderId]);

  // Oturum kapanınca bildirim planı yeni sayılarla güncellenir (sorular bittiyse hatırlatmaya döner).
  useEffect(() => () => void syncReminders(db), [db]);

  const current = items?.[index] ?? null;
  const finished = items !== null && items.length > 0 && index >= items.length;

  const commit = async (result: ReviewResult) => {
    if (!current) return;
    try {
      const recorded = await recordReview(
        db,
        current.id,
        result,
        settings.target_repetitions,
        today(),
        new Date().toISOString(),
      );
      setAnswered((list) => [
        ...list,
        { recorded, session: { result, counted: recorded.counted, completedNow: recorded.completedNow } },
      ]);
      setRevealed(false);
      setIndex((i) => i + 1);
      translateX.set(0);
    } catch (e) {
      translateX.set(withSpring(0));
      Alert.alert('Kaydedilemedi', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const answer = (result: ReviewResult) => {
    if (busy || !current) return;
    setBusy(true);
    translateX.set(withTiming(result === 'success' ? width * 1.2 : -width * 1.2, { duration: EXIT_DURATION }));
    setTimeout(() => commit(result), EXIT_DURATION);
  };

  const undo = async () => {
    const last = answered.at(-1);
    if (!last || busy) return;
    setBusy(true);
    try {
      await undoReview(db, last.recorded, new Date().toISOString());
      setAnswered((list) => list.slice(0, -1));
      setIndex((i) => Math.max(0, i - 1));
      setRevealed(false);
      translateX.set(0);
    } catch (e) {
      Alert.alert('Geri alınamadı', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(!busy && current !== null)
    .activeOffsetX([-15, 15])
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      translateX.set(e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) answer('success');
      else if (e.translationX < -SWIPE_THRESHOLD) answer('fail');
      else translateX.set(withSpring(0));
    });

  const cardStyle = useAnimatedStyle(() => {
    const x = translateX.get();
    return { transform: [{ translateX: x }, { rotate: `${interpolate(x, [-width, width], [-8, 8])}deg` }] };
  });
  const successHint = useAnimatedStyle(() => ({ opacity: interpolate(translateX.get(), [20, SWIPE_THRESHOLD], [0, 1], 'clamp') }));
  const failHint = useAnimatedStyle(() => ({ opacity: interpolate(translateX.get(), [-SWIPE_THRESHOLD, -20], [1, 0], 'clamp') }));

  const close = () => router.back();
  const title = isFree ? 'Serbest çalışma' : 'Tekrar';
  const total = items?.length ?? 0;

  let body;
  if (items === null) {
    body = <ActivityIndicator color={colors.accent} style={{ flex: 1 }} />;
  } else if (items.length === 0) {
    body = (
      <EmptyState
        icon="checkmark.seal"
        title={isFree ? 'Çalışılacak aktif soru yok' : 'Bugün tekrar edilecek soru yok'}
        message={isFree ? 'Bu klasörde aktif soru kalmamış.' : 'Harika! Yeni soru ekleyebilir ya da bir klasörde serbest çalışabilirsin.'}
        action={<Button title="Kapat" onPress={close} />}
      />
    );
  } else if (finished) {
    const summary = sessionSummary(answered.map((a) => a.session));
    body = (
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
        <Icon name="flag.checkered" size={44} color="accent" />
        <AppText variant="title" accessibilityRole="header">
          Oturum bitti
        </AppText>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md }}>
          <SummaryRow icon="square.stack" label="Tekrar edilen" value={summary.total} />
          <SummaryRow icon="checkmark.circle" label="Çözdüm" value={summary.solved} tone="success" />
          <SummaryRow icon="xmark.circle" label="Çözemedim" value={summary.failed} tone="danger" />
          <SummaryRow icon="star.circle" label="Tamamlanan soru" value={summary.completed} tone="success" />
        </View>
        {summary.uncounted > 0 ? (
          <AppText variant="callout" color="textSecondary">
            {summary.uncounted} soru günü gelmeden çalışıldığı için sayaca işlenmedi.
          </AppText>
        ) : null}
        <Button title="Bitir" onPress={close} />
        <Button title="Son cevabı geri al" variant="plain" onPress={undo} />
      </View>
    );
  } else if (current) {
    body = (
      <>
        <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
          <GestureDetector gesture={pan}>
            <Animated.View style={[{ flex: 1 }, cardStyle]}>
              <ReviewCard key={current.id} item={current} revealed={revealed} onReveal={() => setRevealed(true)} />
              <Animated.View pointerEvents="none" style={[styles.hint, styles.hintLeft, { backgroundColor: colors.successSoft, borderColor: colors.success }, successHint]}>
                <Icon name="checkmark" size={18} color="success" />
                <AppText variant="bodyStrong" color="success">Çözdüm</AppText>
              </Animated.View>
              <Animated.View pointerEvents="none" style={[styles.hint, styles.hintRight, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }, failHint]}>
                <Icon name="xmark" size={18} color="danger" />
                <AppText variant="bodyStrong" color="danger">Çözemedim</AppText>
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.lg }}>
          <AnswerButton label="Çözemedim" icon="xmark" tone="danger" onPress={() => answer('fail')} disabled={busy} />
          <AnswerButton label="Çözdüm" icon="checkmark" tone="success" onPress={() => answer('success')} disabled={busy} />
        </View>
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, minHeight: minTouchSize + 8 }}>
        <IconButton icon="xmark" label="Kapat" onPress={close} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="bodyStrong">{title}</AppText>
          {total > 0 && !finished ? (
            <AppText variant="caption" color="textSecondary">
              {Math.min(index + 1, total)} / {total}
            </AppText>
          ) : null}
        </View>
        <IconButton icon="arrow.uturn.backward" label="Son cevabı geri al" onPress={undo} disabled={answered.length === 0 || busy} />
      </View>
      {total > 0 ? (
        <View style={{ height: 4, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surfaceSelected }}>
          <View style={{ height: 4, borderRadius: radius.full, width: `${(Math.min(index, total) / total) * 100}%`, backgroundColor: colors.primary }} />
        </View>
      ) : null}
      {body}
    </View>
  );
}

function IconButton({ icon, label, onPress, disabled = false }: { icon: SFSymbol; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        width: minTouchSize,
        height: minTouchSize,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.3 : pressed ? 0.5 : 1,
      })}>
      <Icon name={icon} size={20} color="accent" />
    </Pressable>
  );
}

function AnswerButton({
  label,
  icon,
  tone,
  onPress,
  disabled,
}: {
  label: string;
  icon: SFSymbol;
  tone: 'success' | 'danger';
  onPress: () => void;
  disabled: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={tone === 'success' ? 'Kartı sağa kaydırmakla aynı' : 'Kartı sola kaydırmakla aynı'}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: tone === 'success' ? colors.success : colors.danger,
        backgroundColor: tone === 'success' ? colors.successSoft : colors.dangerSoft,
        opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
      })}>
      <Icon name={icon} size={20} color={tone} />
      <AppText variant="bodyStrong" color={tone}>
        {label}
      </AppText>
    </Pressable>
  );
}

function SummaryRow({ icon, label, value, tone }: { icon: SFSymbol; label: string; value: number; tone?: 'success' | 'danger' }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Icon name={icon} size={20} color={tone ?? 'textSecondary'} />
      <AppText style={{ flex: 1 }}>{label}</AppText>
      <AppText variant="heading">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    position: 'absolute',
    top: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
  },
  hintLeft: { left: 20 },
  hintRight: { right: 20 },
});
