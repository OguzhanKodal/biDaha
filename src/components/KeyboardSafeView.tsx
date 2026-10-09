import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = { children: ReactNode; style?: StyleProp<ViewStyle> };

/**
 * Klavye açılınca içeriği (ve alttaki butonları) klavyenin üstünde tutar.
 * iOS: KeyboardAvoidingView. Android: kenardan kenara çizimde KeyboardAvoidingView yetmiyor;
 * klavye yüksekliği Reanimated ile ölçülüp alt boşluk olarak verilir (alt güvenli alan düşülür).
 */
export function KeyboardSafeView({ children, style }: Props) {
  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView behavior="padding" style={[{ flex: 1 }, style]}>
        {children}
      </KeyboardAvoidingView>
    );
  }
  return <AndroidKeyboardSafeView style={style}>{children}</AndroidKeyboardSafeView>;
}

function AndroidKeyboardSafeView({ children, style }: Props) {
  const keyboard = useAnimatedKeyboard();
  const { bottom } = useSafeAreaInsets();
  const animated = useAnimatedStyle(() => ({
    paddingBottom: Math.max(0, keyboard.height.value - bottom),
  }));
  return <Animated.View style={[{ flex: 1 }, style, animated]}>{children}</Animated.View>;
}
