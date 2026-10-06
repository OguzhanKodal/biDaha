import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import {
  fitInside,
  fullRect,
  moveCorner,
  moveRect,
  toImageRect,
  type Corner,
  type Rect,
  type Size,
} from '@/domain/crop';
import { CROP_REQUEST } from '@/features/questions/photoFlow';
import { getPendingInput, resolvePending } from '@/lib/pendingResult';
import { finalizePhoto, rotatePhoto, type TempPhoto } from '@/lib/photos';
import { minTouchSize, useTheme } from '@/theme';

const EDGE_PADDING = 24;
const MIN_CROP = 60;
const HANDLE = minTouchSize;
const corners: Corner[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

/** Serbest kırpma + 90° döndürme. Sonucu pendingResult ile çağıran forma verir. */
export default function CropScreen() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState<TempPhoto | null>(() => getPendingInput<TempPhoto>(CROP_REQUEST));
  const [area, setArea] = useState<Size | null>(null);
  const [crop, setCrop] = useState<Rect | null>(null);
  const [busy, setBusy] = useState(false);
  // Sürükleme başladığındaki çerçeve (jest boyunca sabit).
  const gestureStart = useSharedValue<Rect | null>(null);

  // Ekran başka yoldan kapanırsa bekleyen form "vazgeçildi" sonucunu alır.
  useEffect(() => () => resolvePending(CROP_REQUEST, null), []);

  const fit =
    photo && area
      ? fitInside(photo, { width: area.width - EDGE_PADDING * 2, height: area.height - EDGE_PADDING * 2 })
      : null;
  const bounds: Size = { width: fit?.width ?? 0, height: fit?.height ?? 0 };
  const rect = crop ?? fullRect(bounds);

  const cancel = () => {
    resolvePending(CROP_REQUEST, null);
    router.back();
  };

  const rotate = async () => {
    if (!photo || busy) return;
    setBusy(true);
    try {
      setPhoto(await rotatePhoto(photo.uri, 90));
      setCrop(null);
    } catch (e) {
      Alert.alert('Döndürülemedi', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const done = async () => {
    if (!photo || !fit || busy) return;
    setBusy(true);
    try {
      const result = await finalizePhoto(photo, toImageRect(rect, fit.scale, photo));
      resolvePending(CROP_REQUEST, result);
      router.back();
    } catch (e) {
      setBusy(false);
      Alert.alert('Fotoğraf hazırlanamadı', e instanceof Error ? e.message : String(e));
    }
  };

  const moveGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => {
      gestureStart.set(rect);
    })
    .onUpdate((e) => {
      const start = gestureStart.get();
      if (start) setCrop(moveRect(start, e.translationX, e.translationY, bounds));
    });

  const cornerGesture = (corner: Corner) =>
    Gesture.Pan()
      .runOnJS(true)
      .onStart(() => {
        gestureStart.set(rect);
      })
      .onUpdate((e) => {
        const start = gestureStart.get();
        if (start) setCrop(moveCorner(start, corner, e.translationX, e.translationY, bounds, MIN_CROP));
      });

  if (!photo) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: colors.media }]}>
        <AppText style={{ color: colors.onMedia }}>Düzenlenecek fotoğraf yok.</AppText>
        <ToolbarButton label="Kapat" icon="xmark" onPress={() => router.back()} color={colors.onMedia} />
      </View>
    );
  }

  const scrimStyle = { position: 'absolute' as const, backgroundColor: colors.scrim };

  return (
    <View style={[styles.flex, { backgroundColor: colors.media, paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <AppText variant="callout" style={{ color: colors.onMedia, textAlign: 'center', paddingVertical: spacing.sm }}>
        Köşeleri sürükleyerek soruyu çerçevele
      </AppText>

      <View style={styles.flex} onLayout={(e) => setArea(e.nativeEvent.layout)}>
        {fit ? (
          <View style={{ position: 'absolute', left: fit.x + EDGE_PADDING, top: fit.y + EDGE_PADDING, width: fit.width, height: fit.height }}>
            <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="fill" accessibilityLabel="Düzenlenen fotoğraf" />

            {/* Çerçeve dışını karart */}
            <View style={[scrimStyle, { left: 0, top: 0, width: fit.width, height: rect.y }]} />
            <View style={[scrimStyle, { left: 0, top: rect.y + rect.height, width: fit.width, bottom: 0 }]} />
            <View style={[scrimStyle, { left: 0, top: rect.y, width: rect.x, height: rect.height }]} />
            <View style={[scrimStyle, { left: rect.x + rect.width, top: rect.y, right: 0, height: rect.height }]} />

            <GestureDetector gesture={moveGesture}>
              <View
                accessibilityLabel="Kırpma çerçevesi, kaydırmak için sürükle"
                style={{
                  position: 'absolute',
                  left: rect.x,
                  top: rect.y,
                  width: rect.width,
                  height: rect.height,
                  borderWidth: 1.5,
                  borderColor: colors.onMedia,
                }}>
                {[1, 2].map((i) => (
                  <View key={`v${i}`} style={[styles.gridLine, { left: `${(i * 100) / 3}%`, top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: colors.onMedia }]} />
                ))}
                {[1, 2].map((i) => (
                  <View key={`h${i}`} style={[styles.gridLine, { top: `${(i * 100) / 3}%`, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.onMedia }]} />
                ))}
              </View>
            </GestureDetector>

            {corners.map((corner) => {
              const isLeft = corner === 'topLeft' || corner === 'bottomLeft';
              const isTop = corner === 'topLeft' || corner === 'topRight';
              const cx = isLeft ? rect.x : rect.x + rect.width;
              const cy = isTop ? rect.y : rect.y + rect.height;
              return (
                <GestureDetector key={corner} gesture={cornerGesture(corner)}>
                  <View
                    accessibilityLabel="Kırpma köşesi"
                    style={{ position: 'absolute', left: cx - HANDLE / 2, top: cy - HANDLE / 2, width: HANDLE, height: HANDLE }}>
                    <View
                      style={{
                        position: 'absolute',
                        width: 22,
                        height: 22,
                        left: isLeft ? HANDLE / 2 - 3 : HANDLE / 2 - 19,
                        top: isTop ? HANDLE / 2 - 3 : HANDLE / 2 - 19,
                        borderColor: colors.onMedia,
                        borderLeftWidth: isLeft ? 4 : 0,
                        borderRightWidth: isLeft ? 0 : 4,
                        borderTopWidth: isTop ? 4 : 0,
                        borderBottomWidth: isTop ? 0 : 4,
                      }}
                    />
                  </View>
                </GestureDetector>
              );
            })}
          </View>
        ) : null}
        {busy ? (
          <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: colors.scrim }]}>
            <ActivityIndicator color={colors.onMedia} size="large" />
          </View>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.sm,
        }}>
        <ToolbarButton label="Vazgeç" icon="xmark" onPress={cancel} color={colors.onMedia} disabled={busy} />
        <ToolbarButton label="Döndür" icon="rotate.right" onPress={rotate} color={colors.onMedia} disabled={busy} />
        <ToolbarButton label="Sıfırla" icon="arrow.uturn.backward" onPress={() => setCrop(null)} color={colors.onMedia} disabled={busy} />
        <Pressable
          onPress={done}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Kullan"
          style={({ pressed }) => ({
            minHeight: minTouchSize,
            paddingHorizontal: spacing.xl,
            borderRadius: radius.full,
            justifyContent: 'center',
            backgroundColor: colors.primary,
            opacity: busy ? 0.5 : pressed ? 0.7 : 1,
          })}>
          <AppText variant="bodyStrong" color="onPrimary">
            Kullan
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function ToolbarButton({
  label,
  icon,
  onPress,
  color,
  disabled = false,
}: {
  label: string;
  icon: SFSymbol;
  onPress: () => void;
  color: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minWidth: minTouchSize,
        minHeight: minTouchSize,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
      })}>
      <Icon name={icon} size={20} tint={color} />
      <AppText variant="caption" style={{ color }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  gridLine: { position: 'absolute', opacity: 0.5 },
});
