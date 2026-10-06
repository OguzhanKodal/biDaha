import type { SFSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type Props = {
  icon: SFSymbol;
  title: string;
  message?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, message, action }: Props) {
  const { spacing } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, gap: spacing.sm }}>
      <Icon name={icon} size={40} color="textSecondary" />
      <AppText variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      {message ? (
        <AppText color="textSecondary" style={{ textAlign: 'center' }}>
          {message}
        </AppText>
      ) : null}
      {action ? <View style={{ marginTop: spacing.md, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}
