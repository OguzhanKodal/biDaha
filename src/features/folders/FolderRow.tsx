import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import type { FolderWithStats } from '@/db/folders';
import { folderSummary } from '@/domain/folders';
import { minTouchSize, useTheme } from '@/theme';

type Props = {
  folder: FolderWithStats;
  editing: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
};

export function FolderRow({ folder, editing, isFirst, isLast, onEdit, onDelete, onMove }: Props) {
  const { colors, spacing, radius, folderColor } = useTheme();
  const summary = folderSummary(folder);
  const topics = folder.topic_count > 0 ? `${folder.topic_count} konu · ` : '';

  const content = (
    <>
      <View
        style={{ width: 14, height: 14, borderRadius: radius.full, backgroundColor: folderColor(folder.color) }}
      />
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {folder.name}
        </AppText>
        <AppText variant="callout" color="textSecondary">
          {topics}
          {summary}
        </AppText>
      </View>
      {folder.due > 0 && !editing ? (
        <View
          style={{
            backgroundColor: colors.dangerSoft,
            borderRadius: radius.full,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xxs,
          }}>
          <AppText variant="caption" color="danger">
            {folder.due} bugün
          </AppText>
        </View>
      ) : null}
    </>
  );

  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
    minHeight: minTouchSize + 20,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  };

  if (editing) {
    return (
      <View style={[rowStyle, { paddingRight: spacing.xs }]}>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`${folder.name} düzenle`}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            alignSelf: 'stretch',
            opacity: pressed ? 0.6 : 1,
          })}>
          {content}
        </Pressable>
        <RowIconButton icon="arrow.up" label={`${folder.name} yukarı taşı`} disabled={isFirst} onPress={() => onMove(-1)} />
        <RowIconButton icon="arrow.down" label={`${folder.name} aşağı taşı`} disabled={isLast} onPress={() => onMove(1)} />
        <RowIconButton icon="trash" label={`${folder.name} sil`} onPress={onDelete} destructive />
      </View>
    );
  }

  // Link asChild, Pressable'ın fonksiyon stilini (pressed) taşımıyor; düzen içteki View'da.
  return (
    <Link href={{ pathname: '/folders/[id]', params: { id: String(folder.id) } }} asChild>
      <Link.Trigger>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${folder.name}. ${topics}${summary}`}
          accessibilityHint="Açmak için dokun, seçenekler için basılı tut">
          <View style={rowStyle}>
            {content}
            <Icon name="chevron.right" size={14} color="textSecondary" />
          </View>
        </Pressable>
      </Link.Trigger>
      <Link.Menu>
        <Link.MenuAction icon="pencil" onPress={onEdit}>
          Düzenle
        </Link.MenuAction>
        <Link.MenuAction icon="trash" destructive onPress={onDelete}>
          Sil
        </Link.MenuAction>
      </Link.Menu>
    </Link>
  );
}

function RowIconButton({
  icon,
  label,
  onPress,
  disabled = false,
  destructive = false,
}: {
  icon: 'arrow.up' | 'arrow.down' | 'trash';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
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
        opacity: disabled ? 0.25 : pressed ? 0.5 : 1,
      })}>
      <Icon name={icon} size={18} color={destructive ? 'danger' : 'accent'} />
    </Pressable>
  );
}
