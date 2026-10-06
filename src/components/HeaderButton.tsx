import type { SFSymbol } from 'expo-symbols';
import { Pressable } from 'react-native';

import { minTouchSize } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type Props = {
  onPress: () => void;
  /** Ekran okuyucu için ve ikon yoksa görünen metin. */
  label: string;
  icon?: SFSymbol;
  bold?: boolean;
};

export function HeaderButton({ onPress, label, icon, bold = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({
        minWidth: minTouchSize,
        minHeight: minTouchSize,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        opacity: pressed ? 0.5 : 1,
      })}>
      {icon ? (
        <Icon name={icon} size={22} color="accent" />
      ) : (
        <AppText variant={bold ? 'bodyStrong' : 'body'} color="accent">
          {label}
        </AppText>
      )}
    </Pressable>
  );
}
