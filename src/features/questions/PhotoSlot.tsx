import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { minTouchSize, useTheme } from '@/theme';

type Props = {
  label: string;
  /** Boş kutudaki buton metni (varsayılan: "{label} ekle"). */
  addLabel?: string;
  /** Gösterilecek URI (yoksa boş kutu). */
  uri: string | null;
  onPick: () => void;
  onRemove?: () => void;
  error?: string | null;
};

export function PhotoSlot({ label, addLabel, uri, onPick, onRemove, error }: Props) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="callout" color="textSecondary">
        {label}
      </AppText>
      {uri ? (
        <View style={{ gap: spacing.xs }}>
          <Image
            source={{ uri }}
            style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.surface }}
            contentFit="contain"
            accessibilityLabel={label}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <SmallAction icon="camera" label="Değiştir" onPress={onPick} />
            {onRemove ? <SmallAction icon="trash" label="Kaldır" onPress={onRemove} destructive /> : null}
          </View>
        </View>
      ) : (
        <Pressable
          onPress={onPick}
          accessibilityRole="button"
          accessibilityLabel={addLabel ?? `${label} ekle`}
          style={({ pressed }) => ({
            minHeight: 120,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.xs,
            opacity: pressed ? 0.7 : 1,
          })}>
          <Icon name="camera" size={28} color="accent" />
          <AppText variant="bodyStrong" color="accent">
            {addLabel ?? `${label} ekle`}
          </AppText>
        </Pressable>
      )}
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function SmallAction({
  icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: 'camera' | 'trash';
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        minHeight: minTouchSize,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: destructive ? colors.dangerSoft : colors.surface,
        opacity: pressed ? 0.7 : 1,
      })}>
      <Icon name={icon} size={16} color={destructive ? 'danger' : 'accent'} />
      <AppText variant="callout" color={destructive ? 'danger' : 'accent'}>
        {label}
      </AppText>
    </Pressable>
  );
}
