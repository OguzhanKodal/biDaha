import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import type { ReviewItem } from '@/db/reviews';
import { photoUri } from '@/lib/photos';
import { useTheme } from '@/theme';

type Props = {
  item: ReviewItem;
  revealed: boolean;
  onReveal: () => void;
};

/** Tekrar kartı: önce sadece soru fotoğrafı; "Çözümü göster" ile çözüm ve bilgiler açılır (SPEC §6). */
export function ReviewCard({ item, revealed, onReveal }: Props) {
  const { colors, spacing, radius } = useTheme();
  const openPhoto = (path: string, title: string) =>
    router.push({ pathname: '/question/photo', params: { path, title } });
  const folderPath = item.parent_folder_name ? `${item.parent_folder_name} › ${item.folder_name}` : item.folder_name;
  const source = [item.source_name, item.source_page ? `s. ${item.source_page}` : null].filter(Boolean).join(', ');

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <AppText variant="caption" color="textSecondary">
          {folderPath}
        </AppText>
        <Pressable
          onPress={() => openPhoto(item.question_image, 'Soru fotoğrafı')}
          accessibilityRole="imagebutton"
          accessibilityLabel="Soru fotoğrafı, büyütmek için dokun">
          <Image
            source={{ uri: photoUri(item.question_image) }}
            style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.background }}
            contentFit="contain"
          />
        </Pressable>

        {revealed ? (
          <View style={{ gap: spacing.md }}>
            {item.correct_answer ? (
              <AppText variant="heading">Doğru şık: {item.correct_answer}</AppText>
            ) : null}
            {item.solution_image ? (
              <Pressable
                onPress={() => openPhoto(item.solution_image as string, 'Çözüm fotoğrafı')}
                accessibilityRole="imagebutton"
                accessibilityLabel="Çözüm fotoğrafı, büyütmek için dokun">
                <Image
                  source={{ uri: photoUri(item.solution_image) }}
                  style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.background }}
                  contentFit="contain"
                />
              </Pressable>
            ) : null}
            {item.tag_names.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {item.tag_names.map((name) => (
                  <Badge key={name} text={name} />
                ))}
              </View>
            ) : null}
            {item.note ? <AppText>{item.note}</AppText> : null}
            {source ? (
              <AppText variant="callout" color="textSecondary">
                Kaynak: {source}
              </AppText>
            ) : null}
            {!item.correct_answer && !item.solution_image && !item.note ? (
              <AppText color="textSecondary">Bu soru için çözüm bilgisi eklenmemiş.</AppText>
            ) : null}
          </View>
        ) : (
          <Button title="Çözümü göster" variant="secondary" onPress={onReveal} />
        )}
      </ScrollView>
    </View>
  );
}
