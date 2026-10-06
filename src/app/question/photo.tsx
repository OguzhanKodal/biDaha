import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { photoUri } from '@/lib/photos';
import { minTouchSize, useTheme } from '@/theme';

/** Tam ekran fotoğraf; iki parmakla yakınlaştırılır. Parametre: path (göreli yol). */
export default function PhotoViewerScreen() {
  const { path, title } = useLocalSearchParams<{ path: string; title?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return (
    <View style={[styles.flex, { backgroundColor: colors.media }]}>
      <StatusBar style="light" />
      <ScrollView
        maximumZoomScale={5}
        minimumZoomScale={1}
        centerContent
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ width, height }}>
        <Image
          source={{ uri: photoUri(path) }}
          style={{ width, height }}
          contentFit="contain"
          accessibilityLabel={title ?? 'Fotoğraf'}
        />
      </ScrollView>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Kapat"
        style={{
          position: 'absolute',
          top: insets.top + 8,
          right: 16,
          width: minTouchSize,
          height: minTouchSize,
          borderRadius: minTouchSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.scrim,
        }}>
        <Icon name="xmark" size={18} tint={colors.onMedia} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
