import type { SFSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { minTouchSize, useTheme } from '@/theme';

export function SettingsSection({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      {title ? (
        // textTransform Türkçe İ/ı kuralını bilmez; büyük harf tr-TR ile yapılır.
        <AppText variant="caption" color="textSecondary" style={{ marginLeft: spacing.lg }} accessibilityRole="header">
          {title.toLocaleUpperCase('tr-TR')}
        </AppText>
      ) : null}
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' }}>{children}</View>
      {footer ? (
        <AppText variant="caption" color="textSecondary" style={{ marginHorizontal: spacing.lg }}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

type RowProps = {
  icon: SFSymbol;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  /** Sağda değer yerine özel içerik (anahtar, sayaç). */
  accessory?: ReactNode;
  last?: boolean;
};

export function SettingsRow({ icon, label, value, onPress, destructive, disabled, accessory, last }: RowProps) {
  const { colors, spacing } = useTheme();
  const content = (
    <View
      style={{
        minHeight: minTouchSize + 8,
        flexDirection: 'row',
        // Büyük yazıda değer etiketin altına iner; etiket harf harf kırılmaz.
        flexWrap: 'wrap',
        alignItems: 'center',
        // Sarma modunda içerik varsayılan olarak üste yaslanır; satırın dikey ortasında dursun.
        alignContent: 'center',
        columnGap: spacing.md,
        rowGap: spacing.xxs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.background,
        opacity: disabled ? 0.45 : 1,
      }}>
      <Icon name={icon} size={18} color={destructive ? 'danger' : 'accent'} />
      <AppText style={{ flexGrow: 1, flexShrink: 1, minWidth: 120 }} color={destructive ? 'danger' : 'text'}>
        {label}
      </AppText>
      {accessory ?? (
        // Değer ve ok birlikte taşınır (büyük yazıda birlikte alt satıra iner).
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1, marginLeft: 'auto' }}>
          {value ? (
            <AppText color="textSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>
              {value}
            </AppText>
          ) : null}
          {onPress && !destructive ? <Icon name="chevron.right" size={13} color="textSecondary" /> : null}
        </View>
      )}
    </View>
  );
  if (!onPress || disabled) {
    return (
      <View accessible accessibilityLabel={value ? `${label}: ${value}` : label} accessibilityState={{ disabled }}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}: ${value}` : label}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {content}
    </Pressable>
  );
}

export function SettingsSwitch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { colors } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ true: colors.success, false: colors.surfaceSelected }}
      thumbColor={colors.background}
      ios_backgroundColor={colors.surfaceSelected}
    />
  );
}

/** Ayar satırı içinde − sayı + düğmeleri. */
export function SettingsStepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const { spacing } = useTheme();
  const button = (direction: -1 | 1) => {
    const disabled = direction < 0 ? value <= min : value >= max;
    return (
      <Pressable
        onPress={() => onChange(value + direction)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${direction < 0 ? 'azalt' : 'artır'}`}
        style={({ pressed }) => ({
          width: minTouchSize,
          height: minTouchSize,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.3 : pressed ? 0.5 : 1,
        })}>
        <Icon name={direction < 0 ? 'minus.circle' : 'plus.circle'} size={22} color="accent" />
      </Pressable>
    );
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs }}>
      {button(-1)}
      <AppText variant="bodyStrong" style={{ minWidth: 24, textAlign: 'center' }}>
        {value}
      </AppText>
      {button(1)}
    </View>
  );
}
